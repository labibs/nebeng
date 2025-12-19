import { supabase } from './supabaseClient'

export async function uploadPostImage(file) {
  const ext = file.name.split('.').pop()
  const fileName = `post-${crypto.randomUUID()}.${ext}`
  const filePath = `posts/${fileName}`

  const { error } = await supabase.storage
    .from('nebeng-photeo')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (error) throw error

  const { data } = supabase.storage
    .from('nebeng-photeo')
    .getPublicUrl(filePath)

  return data.publicUrl // ✅ SUDAH ADA /public/
}
