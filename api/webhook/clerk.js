import { Webhook } from 'svix'
import { createClient } from '@supabase/supabase-js'

export const config = {
  api: {
    bodyParser: false, // ⬅️ WAJIB
  },
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed')
  }

  // ambil RAW body
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const payload = Buffer.concat(chunks).toString()

  const headers = req.headers
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

  let evt
  try {
    evt = wh.verify(payload, headers)
  } catch (err) {
    console.error(err)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  const { type, data } = evt

  // ======================
  // USER CREATED
  // ======================
  if (type === 'user.created') {
    await supabase.from('users').insert({
      clerk_id: data.id,
      email: data.email_addresses?.[0]?.email_address,
      name: `${data.first_name ?? ''} ${data.last_name ?? ''}`,
      avatar: data.image_url,
    })
  }

  // ======================
  // USER UPDATED
  // ======================
  if (type === 'user.updated') {
    await supabase
      .from('users')
      .update({
        email: data.email_addresses?.[0]?.email_address,
        name: `${data.first_name ?? ''} ${data.last_name ?? ''}`,
        avatar: data.image_url,
      })
      .eq('clerk_id', data.id)
  }

  // ======================
  // USER DELETED
  // ======================
  if (type === 'user.deleted') {
    await supabase.from('users').delete().eq('clerk_id', data.id)
  }

  res.json({ received: true })
}
