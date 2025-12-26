import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabaseClient'
import { uploadPostImage } from '../lib/uploadPostImage'
import FloatingInput from '../components/FloatingInput'
import FloatingTextarea from '../components/FloatingTextarea'
import FloatingSelect from '../components/FloatingSelect'
import FloatingLocationInput from "../components/FloatingLocationInput"

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
  })

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

      if (file) {
        photoUrl = await uploadPostImage(file)
      }

      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single()

      await supabase.from('posts').insert({
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

      navigate('/')

    } catch (err) {
      console.error(err)
      alert('Gagal membuat post')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className="
        min-h-screen flex items-center justify-center
        px-4 py-10

        bg-gradient-to-br
        from-[#e8f5e9] via-[#f3faf5] to-[#d7efe3]
        text-slate-800
        
        dark:from-[#020617] dark:via-[#020617] dark:to-[#020617]
        dark:text-slate-100
      "
    >
      <form
        onSubmit={handleSubmit}
        className="
          w-full max-w-md mb-10 p-6 space-y-6
          rounded-3xl shadow-2xl border

          bg-white/85 border-slate-200

          dark:bg-white/10 dark:border-white/10 dark:backdrop-blur-xl
        "
      >
        <h1 className="text-xl font-bold text-slate-900 dark:text-white text-center">
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
          <option value="titip">Nitip</option>
          <option value="bawa">Bawa Titipan</option>
        </FloatingSelect>

        {/* FROM */}
        <FloatingInput
          name="from_city"
          value={form.from_city}
          onChange={handleChange}
          label="Dari"
          required
        />

        {/* TO */}
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
          name="travel_date"
          value={form.travel_date}
          onChange={handleChange}
          label="Tanggal Perjalanan"
          required
        />

        {/* ARMADA */}
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

        {/* LOCATION */}
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

        {/* UPLOAD */}
        <div className="space-y-2">
          <label className="text-sm text-slate-600 dark:text-slate-300">
            Gambar
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
            className="
              w-full rounded-xl border px-3 py-2
              text-slate-800 dark:text-white

              bg-white border-slate-300
              dark:bg-white/5 dark:border-white/20

              file:rounded-lg file:px-4 file:py-2 file:border-0
              file:bg-emerald-200 file:text-emerald-900
              dark:file:bg-emerald-400/20 dark:file:text-emerald-200
            "
          />

          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="
                rounded-2xl max-h-72 object-contain
                shadow-lg border
                border-slate-200
                dark:border-white/10
              "
            />
          )}
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={uploading}
          className="
            w-full py-3 rounded-xl text-lg font-semibold
            transition hover:scale-[1.02] active:scale-95

            bg-emerald-600 text-white hover:bg-emerald-700
            dark:bg-emerald-500/80 dark:hover:bg-emerald-400
          "
        >
          {uploading ? 'Menyimpan...' : 'Buat Post'}
        </button>
      </form>
    </div>
  )
}
