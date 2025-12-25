import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabaseClient'
import { uploadPostImage } from '../lib/uploadPostImage'
import FloatingInput from '../components/FloatingInput'
import FloatingTextarea from '../components/FloatingTextarea'
import FloatingSelect from '../components/FloatingSelect'
import FloatingLocationInput from "../components/FloatingLocationInput";

export default function CreatePost() {
  const { user } = useUser()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    type: 'titip',
    armada: 'motor',
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
  const [location, setLocation] = useState({
    name: "",
    address: "",
    lat: null,
    lng: null
  });

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

      console.log("Location yang akan disimpan:", location);

      // Insert post
      const { error } = await supabase.from('posts').insert({
        user_id: userRow.id,
        type: form.type,
        armada: form.armada,
        from_city: form.from_city,
        to_city: form.to_city,
        location: location,
        travel_date: form.travel_date,
        item_description: form.item_description,
        price: Number(form.price) || null,
        fee: Number(form.fee) || null,
        description: form.description,
        item_photo: photoUrl,
        clerk_user_id: user.id,
        status: 'open',
      })

      if (error) throw error

      navigate('/')
    } catch (err) {
      console.error(err)
      alert('Gagal membuat post')
    } finally {
      setUploading(false)
    }
  }

 return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f5e9] via-[#f0f8f1] to-[#d9f0e0] dark:from-[#1e293b] dark:via-[#0f172a] dark:to-[#1e293b] text-base-content flex flex-col flex items-center bg-base-200 flex justify-center px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 space-y-6 mb-10"
      >
        <h1 className="text-xl font-bold text-white text-center">
          Buat Post Jastip
        </h1>

        {/* TYPE */}
        <FloatingSelect
          label="Mau apa?"
          name="type"
          value={form.type}
          onChange={handleChange}
          required
        >
          <option value="" disabled hidden>
            Pilih
          </option>
          <option value="titip">Nitip</option>
          <option value="bawa">Bawa Titipan</option>
        </FloatingSelect>

        {/* FROM CITY */}
        <FloatingInput
          name="from_city"
          value={form.from_city}
          onChange={handleChange}
          label="Dari"
          required
        />

        {/* TO CITY */}
        <FloatingInput
          name="to_city"
          value={form.to_city}
          onChange={handleChange}
          label="Ke"
          required
        />

        {/* DATE */}
        <FloatingInput
          type="date"
          placeholder=""
          name="travel_date"
          value={form.travel_date}
          onChange={handleChange}
          label="Tanggal Perjalanan"
          required
        />

        <FloatingSelect
          label="Jenis Armada"
          name="armada"
          value={form.armada}
          onChange={handleChange}
          required
        >
          <option value="motor">Motor</option>
          <option value="mobil">Mobil</option>
          <option value="bus">Bus</option>
          <option value="kereta">Kereta</option>
        </FloatingSelect>

        <FloatingLocationInput
          label="Lokasi"
          name="location"
          value={location}
          onChange={setLocation}
        />

        {/* ITEM DESC */}
        <FloatingTextarea
          name="item_description"
          value={form.item_description}
          onChange={handleChange}
          label="Deskripsi Barang"
          required
        />

        {/* PRICE */}
        <FloatingInput
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          label="Perkiraan Harga Barang"
          required
        />

        {/* FEE */}
        <FloatingInput
          type="number"
          name="fee"
          value={form.fee}
          onChange={handleChange}
          label="Tawarkan Ongkos Jastip"
          required
        />

        {/* NOTE */}
        <FloatingTextarea
          name="description"
          value={form.description}
          onChange={handleChange}
          label="Catatan Tambahan / Isi Postingan"
          required
        />

        {/* UPLOAD FOTO */}
        <div className="space-y-2">
          <label className="text-sm text-white/80">
            Gambar
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
            className="w-full rounded-xl border border-white/30 bg-transparent text-white file:bg-white file:text-primary file:rounded-lg file:border-0 file:px-4 file:py-2"
          />

          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="rounded-2xl max-h-72 object-contain shadow-lg"
            />
          )}
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={uploading}
          className="w-full py-3 rounded-xl bg-black text-white text-lg font-semibold hover:scale-[1.02] active:scale-95 transition"
        >
          {uploading ? 'Menyimpan...' : 'Buat Post'}
        </button>
      </form>
    </div>
  )
}
