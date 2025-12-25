import { format, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import LazyImage from './LazyImage'
import { Bike, Car, Bus, Train } from "lucide-react";

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

  const currentUserId = clerkUser?.clerk_id

  const poster = post.users || {}
  const username = poster.name || (post.type === 'titip' ? 'Titipers' : 'Traveler')
  const userAvatar =
    poster.avatar_url ||
    'https://img.freepik.com/free-vector/user-circles-set_78370-4704.jpg'

  const isTitip = post.type === 'titip'

  const formatDate = (dateString) => {
    if (!dateString) return ''

    try {
      return format(
        new Date(dateString),
        'EEEE, d MMM yyyy',
        { locale: localeId } // pastikan bernilai locale Indonesia
      )
    } catch {
      return ''
    }
  }

  const formatSmartDate = (dateString) => {
    if (!dateString) return ''

    try {
      const date = new Date(dateString)
      const now = new Date()

      const minutes = differenceInMinutes(now, date)
      if (minutes < 1) return 'baru saja'
      if (minutes < 60) return `${minutes} menit yang lalu`

      const hours = differenceInHours(now, date)
      if (hours < 24) return `${hours} jam yang lalu`

      const days = differenceInDays(now, date)
      if (days < 5) return `${days} hari yang lalu`

      // fallback format normal (pakai hari + tanggal)
      return format(date, 'EEEE, d MMM yyyy', { locale: localeId })

    } catch {
      return ''
    }
  }

  const displayDate = post.travel_date
    ? formatDate(post.travel_date)
    : ''

  const createDate = post.created_at
  ? formatSmartDate(post.created_at)
  : ''

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

        // 🔎 Cek apakah sudah ada message post_card untuk post ini
        const { data: existingMessage } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', conversationId)
          .eq('post_id', post.id)
          .eq('message_type', 'post_card')
          .limit(1)
          .maybeSingle()

        // ❌ Jika belum ada → tambahkan message post_card
        if (!existingMessage) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            content: 'Saya tertarik dengan penawaran ini.',
            message_type: 'post_card',
            sender_id: currentUserId,
            post_id: post.id,
          })
        }

      } else {
        // 🔰 Conversation belum ada → buat baru
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

        // ⛳ kirim post_card pertama kali
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          content: null,
          message_type: 'post_card',
          sender_id: currentUserId,
          post_id: post.id,
        })
      }

      // ➜ Arahkan ke halaman chat
      navigate(`/chat/${conversationId}`)

    } catch (error) {
      console.error('Error membuka chat:', error)
      alert('Gagal membuka chat. Coba lagi ya!')
    } finally {
      setLoadingChat(false)
    }
  }

  const icons = {
    motor: Bike,
    mobil: Car,
    bus: Bus,
    kereta: Train,
  };

  const ArmadaIcon = ({ type }) => {
    const Icon = icons[type] ?? Bike;
    return <Icon className="w-7 h-7 text-white drop-shadow-lg" />;
  };

  return (
  <div className="relative w-full h-screen overflow-hidden bg-black">
    
    {/* Background Image */}
    <LazyImage
      src={itemPhoto}
      alt="Item"
      className="absolute inset-0 w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

    {/* Glass Card (sesuai gambar) */}
<div className="absolute inset-x-0 bottom-20 z-20 px-4" onClick={() => setOpen(!open)}>
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
        <p className="text-xs text-white/70 italic">{!open ? ` ${isTitip ? 'Mau nitip' : 'Bisa bawa'} dari ${post.from_city?.slice(0, 8).toUpperCase() || '—'} ke ${post.to_city?.slice(0, 8).toUpperCase()|| '—'}, berangkat hari ${displayDate}` : `${createDate}`}</p>
      </div>
      {/* Badge Tipe */}
    <div className="flex items-center gap-2">
      
    </div>
      <button className="text-white/80 hover:text-white" >
      {!open ?
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
        </svg> :
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7m-14 8l7-7 7 7" />
        </svg>
      }
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
    <div className="flex flex-col items-center mt-4">

  {/* Wrapper posisi */}
  <div className="relative w-full">

      {/* Icon di atas garis */}
      <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/1 mb-1">
        <ArmadaIcon type={post.armada} />
      </div>

      {/* Garis di bawah icon */}
      <div className="w-full h-1 bg-white/30 rounded-full" />

    </div>
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
  <p className="mt-4 text-sm text-white/80 italic text-center">
    Berangkat pada {displayDate}
  </p>

</div>
      
      {/* Wrapper Horizontal Scroll untuk Deskripsi + Detail + Harga */}
<div className="mb-6 -mx-4 px-4"> {/* -mx-4 px-4 biar full bleed ke tepi layar */}
  <div
    className="
      flex gap-4
      overflow-x-auto overflow-y-hidden
      pb-0
      pt-2
      scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent
      snap-x snap-mandatory
      touch-pan-x
    "
    style={{ WebkitOverflowScrolling: 'touch' }}
  >
    {/* Deskripsi */}
    {post.description && (
      <section
        className="
          flex-shrink-0 w-80
          snap-start
          bg-white/10 rounded-2xl p-5
          border border-white/10
        "
      >
        {/* <p className="text-xs text-white/60 mb-3 uppercase tracking-wider">
          Deskripsi
        </p> */}
        <p className="text-sm text-white/90 leading-relaxed italic">
          {post.description}
        </p>
      </section>
    )}

    {/* Detail Barang */}
    {post.item_description && (
      <section
        className="
          flex-shrink-0 w-80
          snap-start
          bg-white/15 rounded-2xl p-5
          border border-white/10
        "
      >
        <p className="text-xs text-white/60 mb-3 uppercase tracking-wider">
          Detail Barang
        </p>
        <p className="text-sm text-white/90 leading-relaxed italic">
          {post.item_description}
        </p>
      </section>
    )}

    {/* Perkiraan Harga Barang */}
    {post.price && (
      <section
        className="
          flex-shrink-0 w-80
          snap-start
          bg-white/15 rounded-2xl p-5
          border border-white/10
        "
      >
        <p className="text-xs text-white/60 mb-3 uppercase tracking-wider">
          {isTitip ? 'Perkiraan Harga Barang' : 'Harga Barang Maximum'}
        </p>
        <p className="text-lg font-bold text-white italic">
          Rp{post.price.toLocaleString('id-ID')}
        </p>
      </section>
    )}

    {/* Jika tidak ada satupun data, tampilkan placeholder kosong agar tidak aneh */}
    {!post.description && !post.item_description && !post.price && (
      <div className="w-80 flex-shrink-0">
        <p className="text-white/50 text-sm">Tidak ada detail tambahan</p>
      </div>
    )}
  </div>
</div>

{/* Akhir Wrapper Scrollable */}

      {/* Metode Pembayaran (opsional) */}
      <div className="mb-0">
        {/* Horizontal Actions - Scrollable dengan Indikator Dot di Atas */}
{/* Horizontal Actions - Scrollable dengan Indikator Dot di Tengah */}
<div className="relative mt-6 pt-4 border-t border-white/20">
  {/* Indikator Dot - Selalu di tengah horizontal area actions */}
  <div className="absolute left-1/2 top-0 -translate-x-1/2 pointer-events-none z-10">
    <div className="flex items-center gap-1.5 animate-pulse">
      <div className="w-2 h-2 bg-white/70 rounded-full shadow-md" />
      <div className="w-2 h-2 bg-white/50 rounded-full shadow-md" />
    </div>
  </div>

  {/* Scrollable Container */}
  <div className="overflow-x-auto scrollbar-hide">
    <div className="flex justify-around items-center gap-6 px-6 py-2 min-w-max">
      {/* Like */}
      <button className="flex flex-col items-center gap-1.5 min-w-[60px]">
        <div className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-1.164 0-2.097.943-2.097 2.095v2.81M7 20H4a2 2 0 01-2-2v-9a2 2 0 012-2h3" />
          </svg>
        </div>
        <span className="text-xs text-white/80 font-medium">Like</span>
      </button>

      {/* Komentar */}
      <button className="flex flex-col items-center gap-1.5 min-w-[60px]">
        <div className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </div>
        <span className="text-xs text-white/80 font-medium">Komentar</span>
      </button>

      {/* Chat */}
      <button 
        onClick={handleChatDeal} 
        disabled={loadingChat}
        className="flex flex-col items-center gap-1.5 min-w-[60px]"
      >
        <div className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <span className="text-xs text-white/80 font-medium">Chat</span>
      </button>

      {/* Deal - Menonjol */}
      <button className="flex flex-col items-center gap-1.5 transform hover:scale-110 transition min-w-[70px]">
        <div className="p-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-xl ring-4 ring-emerald-500/30">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
          Deal
        </span>
      </button>

      {/* Repost */}
      <button className="flex flex-col items-center gap-1.5 min-w-[60px]">
        <div className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition">
          <svg
  className="w-6 h-6 text-white"
  fill="none"
  stroke="currentColor"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M17 1l4 4-4 4M3 11v-2a6 6 0 016-6h8M7 23l-4-4 4-4m14-2v2a6 6 0 01-6 6H7"
  />
</svg>
        </div>
        <span className="text-xs text-white/80 font-medium">Repost</span>
      </button>

      {/* Simpan */}
      <button className="flex flex-col items-center gap-1.5 min-w-[60px]">
        <div className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
          </svg>
        </div>
        <span className="text-xs text-white/80 font-medium">Simpan</span>
      </button>

      {/* Share */}
      <button className="flex flex-col items-center gap-1.5 min-w-[60px]">
        <div className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </div>
        <span className="text-xs text-white/80 font-medium">Share</span>
      </button>
    </div>
  </div>

  {/* Optional: Gradient fade kanan untuk hint lebih halus */}
  <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
</div>
      </div>
    </div>

    
  </div>
</div>
  </div>
)
}