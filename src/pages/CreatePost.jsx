import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabaseClient'
import { uploadPostImage } from '../lib/uploadPostImage'

export default function CreatePost() {
  const { user } = useUser()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    type: 'titip',
    from_city: '',
    to_city: '',
    travel_date: '',
    item_description: '',
    price: '',
    fee: '',
    description: '',
    item_photo: ''
  })

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (!selected) return

    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setUploading(true)

      let photoUrl = null

      // Upload foto ke Supabase Storage
      if (file) {
        photoUrl = await uploadPostImage(file)
      }

      // Ambil user_id dari tabel users
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single()

      if (userError) throw userError

      // Insert post
      const { error } = await supabase.from('posts').insert({
        user_id: userRow.id,
        type: form.type,
        from_city: form.from_city,
        to_city: form.to_city,
        travel_date: form.travel_date,
        item_description: form.item_description,
        price: Number(form.price) || null,
        fee: Number(form.fee) || null,
        description: form.description,
        item_photo: photoUrl,
        status: 'open',
      })

      if (error) throw error

      alert('Post berhasil dibuat!')
      navigate('/')
    } catch (err) {
      console.error(err)
      alert('Gagal membuat post')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-md mx-auto">
      <h1 className="text-lg font-semibold">Buat Post Jastip</h1>

      <select name="type" value={form.type} onChange={handleChange} className="input w-full">
        <option value="titip">Titip Barang (Jastip)</option>
        <option value="cari">Cari Orang Titip</option>
      </select>

      <input name="from_city" value={form.from_city} onChange={handleChange} placeholder="Dari Kota" className="input w-full" />
      <input name="to_city" value={form.to_city} onChange={handleChange} placeholder="Ke Kota" className="input w-full" />
      <input type="date" name="travel_date" value={form.travel_date} onChange={handleChange} className="input w-full" />

      <textarea name="item_description" value={form.item_description} onChange={handleChange} placeholder="Deskripsi Barang" className="textarea w-full" />
      <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="Harga Barang" className="input w-full" />
      <input type="number" name="fee" value={form.fee} onChange={handleChange} placeholder="Fee Jastip" className="input w-full" />
      <textarea name="description" value={form.description} onChange={handleChange} placeholder="Catatan Tambahan" className="textarea w-full" />

      {/* Upload foto */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Foto Barang (opsional)</label>
        <input type="file" accept="image/*" onChange={handleFileChange} className="input w-full" />

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className="rounded-lg max-h-72 object-contain shadow"
          />
        )}
      </div>

      <button type="submit" disabled={uploading} className="btn btn-primary w-full">
        {uploading ? 'Menyimpan...' : 'Buat Post'}
      </button>
    </form>
  )
}
