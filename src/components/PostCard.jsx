import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function PostCard({ post }) {
  const isTitip = post.type === 'titip'

  // Format tanggal created_at jadi mudah dibaca (misal "15 Des 2025")
  const formatDate = (dateString) => {
    if (!dateString) return 'Tanggal tidak tersedia'
    try {
      return format(new Date(dateString), 'd MMM yyyy', { locale: id })
    } catch {
      return 'Tanggal tidak valid'
    }
  }

  // Import locale Indonesia untuk date-fns (tambahkan di main.jsx nanti kalau belum)
  // Untuk sekarang fallback ke format sederhana
  const displayDate = post.travel_date 
    ? format(new Date(post.travel_date), 'd MMM yyyy', { locale: id })
    : formatDate(post.created_at)

  // Foto barang (dari Supabase storage atau URL dummy)
  const itemPhoto = post.item_photo || 'https://cdns.klimg.com/mav-prod-resized/480x/ori/feedImage/2023/9/27/1695798211582-whzv7.jpeg'

  // Avatar user sementara (pakai foto barang atau placeholder)
  const userAvatar = post.item_photo || 'https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg'

  // Username sementara (nanti dari profiles)
  const username = 'Anonymous Traveler'

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className="card-body p-5">
        {/* Header User */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img src={userAvatar} alt={username} />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg">{username}</h3>
              <p className="text-sm text-base-content/70">{displayDate}</p>
            </div>
          </div>
          <div className={`badge ${isTitip ? 'badge-primary' : 'badge-secondary'} badge-lg font-medium`}>
            {isTitip ? 'Mau Titip' : 'Bisa Bawa'}
          </div>
        </div>

        {/* Foto Barang */}
        {post.item_photo && (
          <figure className="mb-5 -mx-5">
            <img 
              src={itemPhoto} 
              alt="Foto barang" 
              className="w-full h-64 object-cover"
            />
          </figure>
        )}

        {/* Rute Besar */}
        <div className="flex items-center gap-4 my-5 text-xl font-bold">
          <span className="text-primary">{post.from_city}</span>
          <svg className="w-8 h-8 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span className="text-secondary">{post.to_city}</span>
        </div>

        {/* Deskripsi */}
        <p className="text-base mb-4 leading-relaxed">{post.description}</p>

        {/* Item Description */}
        {post.item_description && (
          <div className="bg-base-200 rounded-xl p-4 mb-4">
            <p className="font-medium text-base-content/90">
              <span className="font-bold">Barang:</span> {post.item_description}
            </p>
          </div>
        )}

        {/* Footer Harga & Button */}
        <div className="flex justify-between items-end pt-5 border-t border-base-300">
          <div className="space-y-1">
            {post.price > 0 && (
              <p className="text-lg">
                Harga Barang: <span className="font-bold">Rp{post.price.toLocaleString('id-ID')}</span>
              </p>
            )}
            <p className="text-xl font-bold text-primary">
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