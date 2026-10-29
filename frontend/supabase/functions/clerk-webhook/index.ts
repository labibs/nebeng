import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Webhook } from 'https://esm.sh/svix'

serve(async (req) => {
  const payload = await req.text()

  const svixId = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('❌ Missing Svix headers')
    return new Response('Missing Svix headers', { status: 400 })
  }

  let event
  try {
    const wh = new Webhook(Deno.env.get('CLERK_WEBHOOK_SECRET')!)
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch (err) {
    console.error('❌ Signature verification failed', err)
    return new Response('Invalid signature', { status: 400 })
  }

  console.log('🔥 EVENT:', event.type)

  if (event.type !== 'user.created') {
    return new Response('Ignored', { status: 200 })
  }

  const user = event.data

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { error } = await supabase.from('users').upsert(
    {
      id: user.id,
      email: user.email_addresses?.[0]?.email_address,
      name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
      avatar_url: user.image_url,
      clerk_id: user.clerk_id,
    },
    { onConflict: 'clerk_id' }
  )

  if (error) {
    console.error('❌ Supabase error:', error)
    return new Response('DB error', { status: 500 })
  }

  console.log('✅ User inserted:', user.id)
  return new Response('OK', { status: 200 })
})
