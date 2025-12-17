import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabaseClient'

export default function CreatePost() {
  const { user } = useUser()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    type: 'titip', // default
    from_city: '',
    to_city: '',
    travel_date: '',
    item_description: '',
    price: '',
    fee: '',
    description: '',
    item_photo: '' // akan diisi URL setelah upload
  })

  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleUpload = async () => {
    if (!file) return ''

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}` // unik per user

      const { error: uploadError } = await supabase.storage
        .from('item-photos') // ganti dengan nama bucket kamu
        .upload(fileName, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('item-photos')
        .getPublicUrl(fileName)

      return data.publicUrl
    } catch (err) {
      console.error(err)
      alert('Gagal upload foto: ' + err.message)
      return ''
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // Upload foto dulu kalau ada
      let photoUrl = ''
      if (file) {
        photoUrl = await handleUpload()
        if (!photoUrl) return // abort kalau gagal
      }

      // Ambil user_id dari tabel users
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single()

      if (userError) throw userError

      // Insert ke posts
      const { error } = await supabase.from('posts').insert([
        {
          user_id: userRow.id,
          type: form.type,
          from_city: form.from_city,
          to_city: form.to_city,
          travel_date: form.travel_date,
          item_description: form.item_description,
          price: Number(form.price) || null,
          fee: Number(form.fee) || null,
          description: form.description,
          item_photo: photoUrl || null,
          status: 'open'
        }
      ])

      if (error) throw error

      navigate('/')
    } catch (err) {
      console.error(err)
      alert('Gagal membuat post: ' + (err.message || 'Unknown error'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-md mx-auto">
      <h1 className="text-lg font-semibold">Buat Post</h1>

      {/* Dropdown untuk type */}
      <select name="type" value={form.type} onChange={handleChange} className="input" required>
        <option value="">Pilih Tipe</option>
        <option value="titip">Titip Barang (Jastip)</option>
        <option value="bawa">Cari yang Titip</option>
        {/* tambah opsi lain kalau perlu */}
      </select>

      <input name="from_city" placeholder="Dari Kota" onChange={handleChange} className="input" required />
      <input name="to_city" placeholder="Ke Kota" onChange={handleChange} className="input" required />
      <input type="date" name="travel_date" onChange={handleChange} className="input" required />
      <textarea name="item_description" placeholder="Deskripsi Barang" onChange={handleChange} className="textarea" required />
      <input type="number" name="price" placeholder="Harga Barang" onChange={handleChange} className="input" required />
      <input type="number" name="fee" placeholder="Fee Jastip" onChange={handleChange} className="input" required />
      <textarea name="description" placeholder="Catatan Tambahan" onChange={handleChange} className="textarea" />

      {/* Upload foto */}
      <div>
        <label className="block mb-2">Foto Barang</label>
        <input type="file" accept="image/*" onChange={handleFileChange} className="input" />
        {uploading && <p>Uploading...</p>}
        {form.item_photo && <img src={form.item_photo} alt="preview" className="mt-2 max-w-xs" />}
      </div>

      <button type="submit" disabled={uploading} className="btn btn-primary w-full">
        {uploading ? 'Uploading...' : 'Simpan'}
      </button>
    </form>
  )
}