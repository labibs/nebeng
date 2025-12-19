import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export default function PostCard({ post }) {
  const isTitip = post.type === 'titip'
  const user = post.users || {}

  const username = user.name || (isTitip ? 'Titipers' : 'Traveler')
  const userAvatar =
    user.avatar_url ||
    'https://img.freepik.com/free-vector/user-circles-set_78370-4704.jpg'

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

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-xl bg-base-100">

      {/* === HERO IMAGE (FULL) === */}
      <div className="relative h-[420px] w-full">
        <img
          src={itemPhoto}
          alt="Item"
          className="w-full h-full object-cover"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Avatar (pengganti angka 32) */}
        <div className="absolute top-4 left-4">
          
        </div>

        {/* Badge tipe */}
        <div className="absolute top-4 right-4">
          <div className={`badge ${isTitip ? 'badge-primary' : 'badge-secondary'} badge-lg`}>
            {isTitip ? 'Mau Titip' : 'Bisa Bawa'}
          </div>
        </div>
      </div>

      {/* === FLOATING BOTTOM CARD (GLASS) === */}
<div className="relative -mt-20 px-4 pb-5">
  <div
    className="
      rounded-3xl p-4
      backdrop-blur-xl bg-white/25
      border border-white/30
      shadow-[0_12px_40px_rgba(0,0,0,0.25)]
    "
  >
    {/* === HEADER: AVATAR + NAME + DATE === */}
    <div className="flex items-center gap-3 mb-3">
      <div className="w-12 h-12 rounded-full ring ring-white/70 ring-offset-2 ring-offset-transparent">
        <img
          src={userAvatar}
          alt={username}
          className="w-full h-full rounded-full object-cover"
        />
      </div>

      <div className="leading-tight">
        <h3 className="text-base font-semibold">
          {username}
        </h3>
        <p className="text-xs text-base-content/60">
          {displayDate}
        </p>
      </div>
    </div>

    {/* === RUTE === */}
    <div className="flex items-center justify-center gap-3 my-4 font-bold">
      <span className="text-lg text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.9)]">
        {post.from_city || '—'}
      </span>

      <svg
        className="w-6 h-6 text-emerald-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M14 5l7 7m0 0l-7 7m7-7H3"
        />
      </svg>

      <span className="text-lg text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.9)]">
        {post.to_city || '—'}
      </span>
    </div>

    {/* === DESKRIPSI === */}
    {post.description && (
      <p className="text-sm text-base-content/75 mb-3 leading-relaxed">
        {post.description}
      </p>
    )}

    {/* === BARANG === */}
    {post.item_description && (
      <div className="bg-white/30 rounded-xl px-3 py-2 mb-2">
        <p className="text-xs">
          <span className="font-semibold">Barang:</span>{' '}
          {post.item_description}
        </p>
      </div>
    )}

    {/* === PRICE & FEE === */}
    <div className="flex justify-between items-center text-sm mb-4 px-1">
      {post.price > 0 ? (
        <p className="text-base-content/80">
          Harga{' '}
          <span className="font-semibold">
            Rp{post.price.toLocaleString('id-ID')}
          </span>
        </p>
      ) : <span />}

      <p className="font-semibold text-emerald-500">
        Fee Rp{post.fee.toLocaleString('id-ID')}
      </p>
    </div>

    {/* === CTA BUTTON === */}
    <button
      className="
        w-full
        py-3
        rounded-full
        text-sm font-semibold text-white
        bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600
        shadow-[0_0_25px_rgba(16,185,129,0.8)]
        hover:scale-[1.02] active:scale-95
        transition
      "
    >
      Chat & Deal
    </button>
  </div>
</div>


    </div>
  )
}
