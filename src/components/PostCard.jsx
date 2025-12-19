import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export default function PostCard({ post }) {
  const isTitip = post.type === 'titip'

  // Ambil data user dari join (post.users dari query Supabase)
  const user = post.users || {}
  const username = user.name || (isTitip ? 'Titipers' : 'Traveler')
  const userAvatar =
    user.avatar_url ||
    'https://img.freepik.com/free-vector/user-circles-set_78370-4704.jpg'

  // Format tanggal travel atau created_at
  const formatDate = (dateString) => {
    if (!dateString) return 'Tanggal tidak tersedia'
    try {
      return format(new Date(dateString), 'd MMM yyyy', { locale: localeId })
    } catch {
      return 'Tanggal tidak valid'
    }
  }

  const displayDate = post.travel_date
    ? formatDate(post.travel_date)
    : formatDate(post.created_at)

  // Foto barang (fallback ke placeholder kalau kosong)
  const itemPhoto =
    post.item_photo ||
    'https://beritabeta.com/storage/img/2020/06/jastip-ota-ok-17668.jpg'

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <div className="card-body p-5">

        {/* Header: User + Badge Tipe */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img src={userAvatar} alt={username} className="object-cover" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg">{username}</h3>
              <p className="text-sm text-base-content/70">{displayDate}</p>
            </div>
          </div>

          <div className={`badge ${isTitip ? 'badge-primary' : 'badge-secondary'} badge-lg`}>
            {isTitip ? 'Mau Titip' : 'Bisa Bawa'}
          </div>
        </div>

        {/* Foto Barang */}
        {post.item_photo && (
          <figure className="mb-5 -mx-5">
            <img
              src={itemPhoto}
              alt="Barang yang dititipkan"
              className="w-full h-64 object-cover rounded-b-xl"
            />
          </figure>
        )}

        {/* Rute Perjalanan */}
        <div className="flex items-center justify-center gap-4 my-6 text-xl font-bold">
          <span className="text-primary">{post.from_city || '—'}</span>
          <svg className="w-10 h-10 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span className="text-secondary">{post.to_city || '—'}</span>
        </div>

        {/* Deskripsi Tambahan */}
        {post.description && (
          <p className="text-base leading-relaxed text-base-content/90 mb-4">
            {post.description}
          </p>
        )}

        {/* Detail Barang */}
        {post.item_description && (
          <div className="bg-base-200 rounded-xl p-4 mb-5">
            <p className="font-medium">
              <span className="font-bold">Barang:</span> {post.item_description}
            </p>
          </div>
        )}

        {/* Footer: Harga + CTA */}
        <div className="flex justify-between items-end pt-5 border-t border-base-300">
          <div className="space-y-1">
            {post.price > 0 && (
              <p className="text-lg">
                Harga Barang:{' '}
                <span className="font-bold">Rp{post.price.toLocaleString('id-ID')}</span>
              </p>
            )}
            <p className="text-2xl font-bold text-primary">
              Fee: Rp{post.fee.toLocaleString('id-ID')}
            </p>
          </div>

          <button className="btn btn-primary btn-lg shadow-lg hover:scale-105 transition-transform">
            Chat & Deal
          </button>
        </div>
      </div>
    </div>
  )
}