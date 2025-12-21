import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom' // atau from 'next/navigation' jika Next.js
import { useUser } from '@clerk/clerk-react'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function PostCard({ post }) {
  const navigate = useNavigate()
  const { user: clerkUser, isSignedIn } = useUser();
  const currentUserId = clerkUser?.id // ID user yang sedang login (dari Clerk)

  const [loadingChat, setLoadingChat] = useState(false)

  // Data user pemosting (traveler/titipers)
  const poster = post.users || {}
  const username = poster.name || (post.type === 'titip' ? 'Titipers' : 'Traveler')
  const userAvatar =
    poster.avatar_url ||
    'https://img.freepik.com/free-vector/user-circles-set_78370-4704.jpg'

  const isTitip = post.type === 'titip'

  // Format tanggal
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

  // Foto barang default
  const itemPhoto =
    post.item_photo ||
    'https://beritabeta.com/storage/img/2020/06/jastip-ota-ok-17668.jpg'

  const handleChatDeal = async () => {
  if (!isSignedIn) {
    alert('Kamu harus login dulu untuk chat!')
    return
  }

  // Ambil Clerk ID poster dari relasi users
  const posterClerkId = post.clerk_user_id || null

  console.log('Current User ID:', currentUserId)
  console.log('Poster Clerk ID:', posterClerkId)

  if (!posterClerkId) {
    alert('Data user tidak lengkap!')
    console.error('post.users:', post.users)
    return
  }

  if (currentUserId === posterClerkId) {
    alert('Gak bisa chat sama diri sendiri dong 😅')
    return
  }

  setLoadingChat(true)

  try {
    let conversationId

    // Cari conversation existing pakai Clerk ID keduanya
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .in('user_id', [currentUserId, posterClerkId])  // ← PAKAI posterClerkId

    if (participants && participants.length >= 2) {
      conversationId = participants[0].conversation_id
    } else {
      // Buat conversation baru
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({})
        .select('id')
        .single()

      conversationId = newConv.id

      // Insert participant pakai Clerk ID string
      await supabase.from('conversation_participants').insert([     // Clerk string
        { conversation_id: conversationId, user_id: currentUserId },     // Clerk string
        { conversation_id: conversationId, user_id: posterClerkId },     // Clerk string
      ])
    }

    // Navigasi
    navigate(`/chat/${conversationId}`);
  } catch (error) {
    console.error('Error membuka chat:', error)
    alert('Gagal membuka chat. Coba lagi ya!')
  } finally {
    setLoadingChat(false)
  }
}

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-xl bg-base-100">
      {/* Hero Image */}
      <div className="relative h-[420px] w-full">
        <img
          src={itemPhoto}
          alt="Item"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Badge Tipe */}
        <div className="absolute top-4 right-4">
          <div className={`badge ${isTitip ? 'badge-primary' : 'badge-secondary'} badge-lg font-bold`}>
            {isTitip ? 'Mau Titip' : 'Bisa Bawa'}
          </div>
        </div>
      </div>

      {/* Floating Glass Card */}
      <div className="relative -mt-20 px-4 pb-6">
        <div className="rounded-3xl p-5 backdrop-blur-xl bg-white/30 border border-white/40 shadow-2xl">
          {/* Header: Avatar + Nama + Tanggal */}
          <div className="flex items-center gap-4 mb-4">
            <div className="avatar">
              <div className="w-14 h-14 rounded-full ring ring-white ring-offset-base-100 ring-offset-2">
                <img src={userAvatar} alt={username} className="object-cover" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white drop-shadow-md">
                {username}
              </h3>
              <p className="text-sm text-white/80">{displayDate}</p>
            </div>
          </div>

          {/* Rute */}
          <div className="flex items-center justify-center gap-4 my-5">
            <span className="text-xl font-bold text-emerald-300 drop-shadow-lg">
              {post.from_city || '—'}
            </span>
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span className="text-xl font-bold text-emerald-300 drop-shadow-lg">
              {post.to_city || '—'}
            </span>
          </div>

          {/* Deskripsi */}
          {post.description && (
            <p className="text-sm text-white/90 mb-3 leading-relaxed">
              {post.description}
            </p>
          )}

          {/* Barang */}
          {post.item_description && (
            <div className="bg-white/40 rounded-2xl px-4 py-3 mb-4">
              <p className="text-sm font-medium text-white">
                <span className="font-bold">Barang:</span> {post.item_description}
              </p>
            </div>
          )}

          {/* Price & Fee */}
          <div className="flex justify-between items-center mb-6 text-white">
            {post.price > 0 && (
              <p className="text-sm">
                Harga <span className="font-bold">Rp{post.price.toLocaleString('id-ID')}</span>
              </p>
            )}
            <p className="text-lg font-bold text-emerald-300">
              Fee Rp{post.fee.toLocaleString('id-ID')}
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleChatDeal}
            disabled={loadingChat}
            className="
              w-full py-4 rounded-full text-base font-bold text-white
              bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600
              shadow-[0_0_30px_rgba(16,185,129,0.9)]
              hover:scale-105 active:scale-95
              transition-all duration-300
              disabled:opacity-70 disabled:cursor-not-allowed
            "
          >
            {loadingChat ? 'Membuka chat...' : 'Chat & Deal'}
          </button>
        </div>
      </div>
    </div>
  )
}