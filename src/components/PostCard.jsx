import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function PostCard({ post }) {
  const navigate = useNavigate()
  const { user: clerkUser, isSignedIn } = useUser()
  const [open, setOpen] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)
  const [activeTab, setActiveTab] = useState('semua')

  // Tab options
  const tabOptions = [
    { id: 'semua', label: 'Semua' },
    { id: 'titip', label: 'Mau Titip' },
    { id: 'bawa', label: 'Bisa Bawa' }
  ]

  const currentUserId = clerkUser?.id

  const poster = post.users || {}
  const username = poster.name || (post.type === 'titip' ? 'Titipers' : 'Traveler')
  const userAvatar =
    poster.avatar_url ||
    'https://img.freepik.com/free-vector/user-circles-set_78370-4704.jpg'

  const isTitip = post.type === 'titip'

  const formatDate = (dateString) => {
    if (!dateString) return ''
    try {
      return format(new Date(dateString), 'd MMM yyyy', { locale: localeId })
    } catch {
      return ''
    }
  }

  const displayDate = post.travel_date
    ? formatDate(post.travel_date)
    : formatDate(post.created_at)

  const itemPhoto =
    post.item_photo ||
    'https://beritabeta.com/storage/img/2020/06/jastip-ota-ok-17668.jpg'

  const handleChatDeal = async () => {
    // ... (kode handleChatDeal tetap sama seperti sebelumnya)
    if (!isSignedIn) {
      alert('Kamu harus login dulu untuk chat!')
      return
    }

    const posterClerkId = post.clerk_user_id || null

    if (!posterClerkId) {
      alert('Data user tidak lengkap!')
      return
    }

    if (currentUserId === posterClerkId) {
      alert('Gak bisa chat sama diri sendiri dong 😅')
      return
    }

    setLoadingChat(true)

    try {
      let conversationId

      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .in('user_id', [currentUserId, posterClerkId])

      if (participants && participants.length >= 2) {
        conversationId = participants[0].conversation_id
      } else {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ post_id: post.id })
          .select('id')
          .single()

        conversationId = newConv.id

        await supabase.from('conversation_participants').insert([
          { conversation_id: conversationId, user_id: currentUserId },
          { conversation_id: conversationId, user_id: posterClerkId },
        ])

        await supabase.from('messages').insert({
          conversation_id: conversationId,
          content: null,
          message_type: 'post_card',
          sender_id: currentUserId,
          post_id: post.id,
        })
      }

      navigate(`/chat/${conversationId}`)
    } catch (error) {
      console.error('Error membuka chat:', error)
      alert('Gagal membuka chat. Coba lagi ya!')
    } finally {
      setLoadingChat(false)
    }
  }

  return (
  <div className="relative w-full h-screen overflow-hidden bg-black">
    {/* Sticky Tab Section - Fully Transparent & Overlay on Image */}
  <section className="sticky top-0 z-40 pointer-events-none">
    <div className="px-2 pt-5 pb-2 pointer-events-auto">
      <div className="flex justify-center">
        <div
  className="
    inline-flex items-center gap-2
    bg-transparent
    backdrop-blur-md
    border border-white/30
    rounded-full
    px-1 py-1
    shadow-2xl
  "
>

          {tabOptions.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 capitalize
                ${activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  </section>
    {/* Background Image */}
    <img
      src={itemPhoto}
      alt="Item"
      className="absolute inset-0 w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

    {/* Glass Card (sesuai gambar) */}
<div className="absolute inset-x-0 bottom-25 z-20 px-4">
  <div className="rounded-2xl p-5 backdrop-blur-xl bg-white/20 border border-white/30 shadow-2xl">
    {/* Header dengan Avatar */}
    <div className="flex items-center gap-3 mb-0">
      <div className="avatar">
        <div className="w-10 h-10 rounded-full ring-2 ring-white/50 ring-offset-2 ring-offset-black/20">
          <img src={userAvatar} alt={username} className="object-cover" />
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-base font-bold text-white drop-shadow">{username}</h3>
        <p className="text-xs text-white/70">{displayDate}</p>
      </div>
      {/* Badge Tipe */}
    <div className="flex items-center gap-2">
      
    </div>
      <button className="text-white/80 hover:text-white" onClick={() => setOpen(!open)}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </div>

   

    

    {/* Collapsible Detail (dipercantik) */}
    <div className={`transition-all duration-500 overflow-hidden ${open ? 'max-h-120 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
      {/* Informasi Rute - Style Boarding Pass Emirates */}
<div className="relative my-0 overflow-hidden rounded-2xl bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 p-6 shadow-2xl mb-2">

  {/* Header: Airline / Badge Type (opsional, bisa dihilangkan kalau nggak perlu) */}
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 1C5.935 1 1 4.134 1 8v8c0 3.866 4.935 7 11 7s11-3.134 11-7V8c0-3.866-4.935-7-11-7zm9 15c0 2.757-4.038 5-9 5s-9-2.243-9-5v-1.35C4.986 16.11 8.25 17 12 17s7.014-.89 9-2.35V16zm0-5c0 2.757-4.038 5-9 5s-9-2.243-9-5V9.65C4.986 11.11 8.25 12 12 12s7.014-.89 9-2.35V11zm0-5c0 2.757-4.038 5-9 5S3 8.757 3 6s4.038-5 9-5 9 2.243 9 5z"/>
      </svg>

      <span className="text-white font-bold text-lg tracking-wider">
          Rp{post.fee.toLocaleString('id-ID')}
        </span>
    </div>
    <span className={`badge badge-lg font-bold text-white border-white/50 text-sm ${
      isTitip ? 'bg-info/30' : 'bg-secondary/30'
    }`}>
      {isTitip ? 'MAU TITIP' : 'BISA BAWA'}
    </span>
  </div>

  {/* Main Route Info */}
  <div className="grid grid-cols-3 items-center text-white">

    {/* Kiri: Departure */}
    <div className="text-left">
      <div className="text-lg font-black leading-none">
        {post.from_city?.slice(0, 8).toUpperCase() || '—'}
      </div>
      <div className="text-md font-semibold mt-1">
        Asal
      </div>
      
    </div>

    {/* Tengah: Arrow Line + Status */}
    <div className="flex flex-col items-center mt-5">
      {/* Garis dengan pesawat */}
      <div className="relative w-full h-1 bg-white/30 rounded-full my-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 12h4l3-8h6l3 8h4v2h-4l-3 8h-6l-3-8H2v-2z"/>
          </svg>
        </div>
      </div>

      {/* Status "Left X time" - bisa diganti logic real-time nanti */}
      {/* <div className="badge badge-lg bg-success text-white border-none px-4 py-3 font-bold">
        Aktif Sekarang
      </div> */}

      {/* Fee di bawah */}
      
    </div>

    {/* Kanan: Arrival */}
    <div className="text-right">
      <div className="text-lg font-black leading-none">
        {post.to_city?.slice(0, 8).toUpperCase() || '—'}
      </div>
      <div className="text-md font-semibold mt-1">
        Tujuan
      </div>
      
    </div>
  </div>

</div>
      
      {/* Deskripsi */}
      {post.description && (
        <div className="mb-4">
          <p className="text-xs text-white/70 mb-1">Deskripsi</p>
          <p className="text-sm text-white/90 leading-relaxed bg-white/10 rounded-lg p-3">
            {post.description}
          </p>
        </div>
      )}

      {/* Detail Barang */}
      {post.item_description && (
        <div className="mb-4">
          <p className="text-xs text-white/70 mb-1">Detail Barang</p>
          <div className="bg-white/15 rounded-lg px-4 py-3">
            <p className="text-sm text-white/90">
              {post.item_description}
            </p>
          </div>
        </div>
      )}

      {post.price && (
        <div className="mb-4">
          <p className="text-xs text-white/70 mb-1">Perkiraan Harga Barang</p>
          <div className="bg-white/15 rounded-lg px-4 py-3">
            <p className="text-sm text-white/90">
              Rp{post.price.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      )}

      {/* Metode Pembayaran (opsional) */}
      <div className="mb-0">
        {/* Horizontal Actions (disesuaikan dengan gambar) */}
    <div className="flex justify-around items-center mt-4 pt-4 border-t border-white/20">
      {/* Like */}
      <button className="flex flex-col items-center gap-1.5">
        <div className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-1.164 0-2.097.943-2.097 2.095v2.81M7 20H4a2 2 0 01-2-2v-9a2 2 0 012-2h3" />
          </svg>
        </div>
        <span className="text-xs text-white/80 font-medium">Like</span>
      </button>

      {/* Komentar */}
      <button className="flex flex-col items-center gap-1.5"
      onClick={handleChatDeal} 
        disabled={loadingChat}>
        <div className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <span className="text-xs text-white/80 font-medium">Chat</span>
      </button>

      {/* Kerjasama / Deal - Lebih menonjol */}
      <button className="flex flex-col items-center gap-1.5 transform hover:scale-105 transition">
        <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-lg">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span className="text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text">Deal</span>
      </button>

      {/* Share */}
      <button className="flex flex-col items-center gap-1.5">
        <div className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </div>
        <span className="text-xs text-white/80 font-medium">Share</span>
      </button>
    </div>
      </div>
    </div>

    
  </div>
</div>
  </div>
)
}