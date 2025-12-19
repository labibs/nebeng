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
          <div className="w-14 h-14 rounded-full ring ring-white ring-offset-2 ring-offset-transparent">
            <img
              src={userAvatar}
              alt={username}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        {/* Badge tipe */}
        <div className="absolute top-4 right-4">
          <div className={`badge ${isTitip ? 'badge-primary' : 'badge-secondary'} badge-lg`}>
            {isTitip ? 'Mau Titip' : 'Bisa Bawa'}
          </div>
        </div>
      </div>

      {/* === FLOATING BOTTOM CARD === */}
      <div className="relative -mt-24 px-4 pb-5">
        <div className="bg-base-100 rounded-3xl shadow-2xl p-5">

          {/* Username (pengganti "Good") */}
          <div className="mb-1">
            <h3 className="text-2xl font-bold">{username}</h3>
            <p className="text-sm text-base-content/60">{displayDate}</p>
          </div>

          {/* Rute */}
          <div className="flex items-center justify-center gap-4 my-4 text-lg font-bold">
            <span className="text-primary">{post.from_city || '—'}</span>
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
            <span className="text-secondary">{post.to_city || '—'}</span>
          </div>

          {/* Deskripsi */}
          {post.description && (
            <p className="text-base text-base-content/80 mb-3">
              {post.description}
            </p>
          )}

          {/* Detail Barang */}
          {post.item_description && (
            <div className="bg-base-200 rounded-xl p-3 mb-4">
              <p className="text-sm">
                <span className="font-bold">Barang:</span>{' '}
                {post.item_description}
              </p>
            </div>
          )}

          {/* Harga & CTA */}
          <div className="flex justify-between items-center pt-3 border-t border-base-300">
            <div>
              {post.price > 0 && (
                <p className="text-sm">
                  Harga:{' '}
                  <span className="font-semibold">
                    Rp{post.price.toLocaleString('id-ID')}
                  </span>
                </p>
              )}
              <p className="text-xl font-bold text-primary">
                Fee Rp{post.fee.toLocaleString('id-ID')}
              </p>
            </div>

            <button className="btn btn-primary btn-lg rounded-full px-6 shadow-lg hover:scale-105 transition">
              Chat & Deal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
