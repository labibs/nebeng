import { supabase } from './supabaseClient'

let getUserIdFn = null

const CART_ITEM_SELECT = `
  id,
  user_id,
  quantity,
  requested_price,
  estimated_price,
  notes,
  status,
  product:product_id(name,image_url,estimated_price),
  warung:warung_id(
    id,
    name,
    address,
    latitude,
    longitude,
    category,
    status,
    created_by_clerk_id,
    owner:users!warungs_created_by_clerk_id_fkey(avatar_url,name)
  )
`

export function initApiClient(config) {
  if (typeof config === 'function') return
  getUserIdFn = config?.getUserId || null
}

function getCurrentUserId() {
  return getUserIdFn ? getUserIdFn() : null
}

async function parseBody(options) {
  if (!options?.body) return null
  if (typeof options.body === 'string') return JSON.parse(options.body)
  return options.body
}

function sortByCreatedAtDesc(rows) {
  return [...(rows || [])].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
}

async function ensureSignedIn() {
  const clerkId = getCurrentUserId()
  if (!clerkId) throw new Error('User not authenticated')
  return clerkId
}

async function syncUser(body) {
  const clerkId = await ensureSignedIn()
  const payload = {
    clerk_id: clerkId,
    name: body?.name || 'User',
    avatar_url: body?.avatar_url || null,
  }

  const { data: existing, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .maybeSingle()

  if (fetchError) throw fetchError

  if (existing?.id) {
    const { error } = await supabase.from('users').update(payload).eq('clerk_id', clerkId)
    if (error) throw error
    return { message: 'User updated' }
  }

  const { error } = await supabase.from('users').insert(payload)
  if (error) throw error
  return { message: 'User created' }
}

async function listUsers() {
  const clerkId = await ensureSignedIn()
  const { data, error } = await supabase
    .from('users')
    .select('id,name,avatar_url,clerk_id')
    .neq('clerk_id', clerkId)
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

async function startConversation(body) {
  const clerkId = await ensureSignedIn()
  const opponentId = body?.opponent_id
  if (!opponentId) throw new Error('opponent_id is required')

  const { data: myParticipants, error: myError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', clerkId)

  if (myError) throw myError

  const myConvIds = (myParticipants || []).map((row) => row.conversation_id)

  if (myConvIds.length > 0) {
    const { data: opponentParticipants, error: opponentError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', opponentId)
      .in('conversation_id', myConvIds)
      .limit(1)

    if (opponentError) throw opponentError
    if (opponentParticipants?.length) return { conversation_id: opponentParticipants[0].conversation_id }
  }

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .insert({})
    .select('id')
    .single()

  if (conversationError) throw conversationError

  const { error: participantError } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: conversation.id, user_id: clerkId },
      { conversation_id: conversation.id, user_id: opponentId },
    ])

  if (participantError) throw participantError
  return { conversation_id: conversation.id }
}

async function listConversations(rawSearch) {
  const clerkId = await ensureSignedIn()
  const search = rawSearch?.trim().toLowerCase()

  const { data: myParticipants, error: myError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', clerkId)

  if (myError) throw myError

  const convIds = (myParticipants || []).map((row) => row.conversation_id)
  if (!convIds.length) return []

  const [{ data: messages, error: messagesError }, { data: participants, error: participantsError }] = await Promise.all([
    supabase.from('messages').select('id,conversation_id,content,created_at,sender_id,is_read').in('conversation_id', convIds).order('created_at', { ascending: false }),
    supabase.from('conversation_participants').select('conversation_id,user_id').in('conversation_id', convIds),
  ])

  if (messagesError) throw messagesError
  if (participantsError) throw participantsError

  const opponentIds = [...new Set((participants || []).filter((row) => row.user_id !== clerkId).map((row) => row.user_id))]
  let opponentMap = new Map()

  if (opponentIds.length) {
    const { data: opponents, error: opponentsError } = await supabase
      .from('users')
      .select('clerk_id,name,avatar_url')
      .in('clerk_id', opponentIds)

    if (opponentsError) throw opponentsError
    opponentMap = new Map((opponents || []).map((row) => [row.clerk_id, row]))
  }

  const lastMessageMap = new Map()
  const unreadCountMap = new Map()
  for (const message of messages || []) {
    if (!lastMessageMap.has(message.conversation_id)) lastMessageMap.set(message.conversation_id, message)
    if (message.sender_id !== clerkId && !message.is_read) {
      unreadCountMap.set(message.conversation_id, (unreadCountMap.get(message.conversation_id) || 0) + 1)
    }
  }

  const opponentByConversation = new Map()
  for (const participant of participants || []) {
    if (participant.user_id !== clerkId && !opponentByConversation.has(participant.conversation_id)) {
      opponentByConversation.set(participant.conversation_id, participant.user_id)
    }
  }

  const result = convIds.map((conversationId) => {
    const opponentClerkId = opponentByConversation.get(conversationId)
    const opponent = opponentMap.get(opponentClerkId) || { name: 'Unknown', avatar_url: '/default-avatar.png' }
    const lastMessage = lastMessageMap.get(conversationId)
    return {
      conversationId,
      opponent,
      lastMessage: lastMessage?.content || 'Belum ada pesan',
      lastTime: lastMessage?.created_at || '',
      unreadCount: unreadCountMap.get(conversationId) || 0,
    }
  })

  const filtered = search ? result.filter((item) => (item.opponent?.name || '').toLowerCase().includes(search) || (item.lastMessage || '').toLowerCase().includes(search)) : result
  return filtered.sort((a, b) => (b.lastTime || '').localeCompare(a.lastTime || ''))
}

async function enrichCartBuyers(items) {
  const buyerIds = [...new Set((items || []).map((item) => item.user_id).filter(Boolean))]
  if (!buyerIds.length) return items || []

  const { data: buyers, error } = await supabase
    .from('users')
    .select('clerk_id,name,avatar_url')
    .in('clerk_id', buyerIds)

  if (error) throw error

  const buyerMap = new Map((buyers || []).map((buyer) => [buyer.clerk_id, buyer]))
  return (items || []).map((item) => ({
    ...item,
    buyer: buyerMap.get(item.user_id) || null,
  }))
}

async function getCart() {
  const clerkId = await ensureSignedIn()

  const { data: buyerItems, error: buyerError } = await supabase
    .from('warung_cart_items')
    .select(CART_ITEM_SELECT)
    .eq('user_id', clerkId)
    .eq('status', 'pending')

  if (buyerError) throw buyerError

  const { data: myWarungs, error: warungError } = await supabase
    .from('warungs')
    .select('id')
    .eq('created_by_clerk_id', clerkId)

  if (warungError) throw warungError

  let ownerItems = []
  const warungIds = (myWarungs || []).map((row) => row.id)
  if (warungIds.length) {
    const { data, error } = await supabase
      .from('warung_cart_items')
      .select(CART_ITEM_SELECT)
      .in('warung_id', warungIds)
      .eq('status', 'pending')
      .neq('user_id', clerkId)

    if (error) throw error
    ownerItems = data || []
  }

  return enrichCartBuyers([...(buyerItems || []), ...ownerItems])
}

async function updateCartQuantity(itemId, body) {
  const quantity = Number(body?.quantity)
  if (!Number.isFinite(quantity) || quantity < 1) throw new Error('Invalid quantity')
  const { error } = await supabase.from('warung_cart_items').update({ quantity }).eq('id', itemId)
  if (error) throw error
  return { message: 'Quantity updated' }
}

async function deleteCartItem(itemId) {
  const { error } = await supabase.from('warung_cart_items').delete().eq('id', itemId)
  if (error) throw error
  return { message: 'Item deleted' }
}

async function deleteCartItems(body) {
  const ids = body?.ids || []
  if (!ids.length) throw new Error('Invalid IDs')
  const { error } = await supabase.from('warung_cart_items').delete().in('id', ids)
  if (error) throw error
  return { message: `${ids.length} items deleted` }
}

async function dealCart(body) {
  const clerkId = await ensureSignedIn()
  const itemIds = body?.item_ids || []
  const opponentId = body?.opponent_id
  if (!itemIds.length) throw new Error('item_ids are required')
  if (!opponentId) throw new Error('opponent_id is required')

  const { error: cartError } = await supabase.from('warung_cart_items').update({ status: 'accepted' }).in('id', itemIds)
  if (cartError) throw cartError

  let existingDealQuery = supabase.from('deals').select('id').eq('carrier_id', body?.carrier_id || clerkId).eq('depositor_id', body?.depositor_id || opponentId).order('created_at', { ascending: false }).limit(1)
  existingDealQuery = body?.post_id ? existingDealQuery.eq('post_id', body.post_id) : existingDealQuery.eq('item_description', body?.item_description || '')

  const { data: existingDeals, error: existingDealError } = await existingDealQuery
  if (existingDealError) throw existingDealError

  const payload = {
    post_id: body?.post_id || null,
    carrier_id: body?.carrier_id || clerkId,
    depositor_id: body?.depositor_id || opponentId,
    pickup_location: body?.pickup_location || '',
    delivery_location: body?.delivery_location || '',
    item_description: body?.item_description || '',
    item_photos: Array.isArray(body?.item_photos) ? body.item_photos : body?.item_photos ? [body.item_photos] : body?.item_photo ? [body.item_photo] : [],
    item_fee: body?.total_item_price || 0,
    agreed_fee: body?.agreed_fee > 0 ? body.agreed_fee : body?.total_payment || body?.proposed_fee || 0,
    notes: body?.notes || '',
    pickup_datetime: body?.pickup_datetime || new Date().toISOString(),
    status: body?.status || 'completed',
    delivery_status: body?.delivery_status || 'draft',
  }

  let dealId = existingDeals?.[0]?.id
  if (dealId) {
    const { error } = await supabase.from('deals').update(payload).eq('id', dealId)
    if (error) throw error
  } else {
    const { data: newDeal, error } = await supabase.from('deals').insert(payload).select('id').single()
    if (error) throw error
    dealId = newDeal.id
  }

  const conversation = await startConversation({ opponent_id: opponentId })
  return { conversation_id: conversation.conversation_id, deal_id: dealId }
}

async function getMarketProducts(searchParams) {
  let query = supabase
    .from('warung_products')
    .select(`id,name,estimated_price,image_url,rating,is_estimated,created_at,categories:category_id(name),warung:warungs!inner(name,category,status,created_by_clerk_id,owner:users!warungs_created_by_clerk_id_fkey(avatar_url,name))`)
    .order('created_at', { ascending: false })
    .limit(20)

  const category = searchParams.get('category')
  const categoryId = searchParams.get('category_id')
  const search = searchParams.get('search')
  if (category) query = query.eq('warung.category', category)
  if (categoryId) query = query.eq('category_id', categoryId)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((product) => ({
    id: product.id,
    name: product.name,
    estimated_price: product.estimated_price,
    image_url: product.image_url,
    rating: product.rating,
    is_estimated: product.is_estimated,
    created_at: product.created_at,
    category_name: product.categories?.name,
    warung_name: product.warung?.name,
    warung_status: product.warung?.status,
    owner_id: product.warung?.created_by_clerk_id,
    owner_name: product.warung?.owner?.name,
    owner_avatar: product.warung?.owner?.avatar_url,
  }))
}

async function getTransactions() {
  const clerkId = await ensureSignedIn()
  const { data: deals, error } = await supabase
    .from('deals')
    .select(`id,carrier_id,depositor_id,item_description,item_photos,status,agreed_fee,item_fee,delivery_status,pickup_location,delivery_location,pickup_datetime,created_at,post:posts!fk_deals_post(id,from_city,to_city,type,item_photo,created_at),carrier:users!deals_carrier_id_fkey(clerk_id,name,avatar_url),depositor:users!fk_deals_depositor(clerk_id,name,avatar_url),transactions(id,deal_id,transaction_status,payment_status,gross_amount,payment_type,created_at)`)
    .or(`carrier_id.eq.${clerkId},depositor_id.eq.${clerkId}`)

  if (error) throw error

  const rows = []
  for (const deal of deals || []) {
    const dealSummary = {
      id: deal.id,
      item_description: deal.item_description,
      item_photos: deal.item_photos,
      status: deal.status,
      agreed_fee: deal.agreed_fee,
      item_fee: deal.item_fee,
      pickup_location: deal.pickup_location,
      delivery_location: deal.delivery_location,
      pickup_datetime: deal.pickup_datetime,
      carrier_id: deal.carrier_id,
      depositor_id: deal.depositor_id,
      post: deal.post,
      carrier: deal.carrier,
      depositor: deal.depositor,
    }

    const transactions = Array.isArray(deal.transactions)
      ? deal.transactions
      : deal.transactions
        ? [deal.transactions]
        : []

    for (const transaction of transactions) rows.push({ ...transaction, deal: dealSummary })
  }

  return sortByCreatedAtDesc(rows)
}

async function createMidtransPayment(body) {
  const transactionId = body?.transaction_id
  if (!transactionId) throw new Error('transaction_id wajib diisi')
  const { data, error } = await supabase.functions.invoke('create-midtrans-snap', { body: { transaction_id: transactionId } })
  if (error) throw error
  return data
}

async function getDealPostInfo(postId) {
  const { data, error } = await supabase.from('posts').select('id,type,from_city,to_city,travel_date,item_description,fee,item_photo').eq('id', postId).single()
  if (error) throw error
  return data
}

async function getDealByPost(postId) {
  const { data: message, error: messageError } = await supabase.from('messages').select('deal_id').eq('post_id', postId).not('deal_id', 'is', null).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (messageError) throw messageError
  if (!message?.deal_id) throw new Error('No deal found for this post')

  const { data, error } = await supabase.from('deals').select('id,agreed_fee,item_fee,pickup_location,delivery_location,pickup_datetime,item_description,status').eq('id', message.deal_id).single()
  if (error) throw error
  return data
}

async function getDealMessages(dealId) {
  const { data, error } = await supabase.from('messages').select('message_type,deal_id,content,from_city,to_city,fee,travel_date,item_description').eq('deal_id', dealId).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const body = await parseBody(options)
  const url = new URL(path, 'http://local')
  const pathname = url.pathname

  if (pathname === '/api/users/sync' && method === 'POST') return syncUser(body)
  if (pathname === '/api/users' && method === 'GET') return listUsers()
  if (pathname === '/api/conversations' && method === 'GET') return listConversations(url.searchParams.get('search') || '')
  if (pathname === '/api/conversations' && method === 'POST') return startConversation(body)
  if (pathname === '/api/cart' && method === 'GET') return getCart()
  if (pathname === '/api/cart' && method === 'DELETE') return deleteCartItems(body)
  if (pathname === '/api/cart/deal' && method === 'POST') return dealCart(body)
  if (/^\/api\/cart\/[^/]+\/quantity$/.test(pathname) && method === 'PATCH') return updateCartQuantity(pathname.split('/')[3], body)
  if (/^\/api\/cart\/[^/]+$/.test(pathname) && method === 'DELETE') return deleteCartItem(pathname.split('/')[3])
  if (pathname === '/api/market/products' && method === 'GET') return getMarketProducts(url.searchParams)
  if (pathname === '/api/transactions' && method === 'GET') return getTransactions()
  if (pathname === '/api/transactions/pay' && method === 'POST') return createMidtransPayment(body)
  if (/^\/deals\/post\/[^/]+\/info$/.test(pathname) && method === 'GET') return getDealPostInfo(pathname.split('/')[3])
  if (/^\/deals\/post\/[^/]+$/.test(pathname) && method === 'GET') return getDealByPost(pathname.split('/')[3])
  if (/^\/deals\/[^/]+\/messages$/.test(pathname) && method === 'GET') return getDealMessages(pathname.split('/')[2])

  throw new Error(`Unsupported backendless route: ${method} ${pathname}`)
}
