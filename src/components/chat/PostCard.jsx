export default function PostCard({ msg, isMine, avatar, postInfo }) {
  // Kalau mau tetap coba pakai msg.post (untuk safety ekstra), bisa:
  const post =  msg.post || {};
  //console.log ('isi relasi msg dan post', post)

  return (
    <div className={`chat ${isMine ? 'chat-end ' : 'chat-start'} `} >
      <div className="chat-image avatar ">
        <div className="w-10 rounded-full ">
          <img src={avatar} alt="avatar" />
        </div>
      </div>

      <div className="chat-header">
        <time className="text-xs opacity-70">
          {new Date(msg.created_at).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
      </div>

      <div
        className={`
          relative max-w-md px-5 py-4 rounded-2xl shadow-lg overflow-hidden
          bg-base-100 border border-lime-700
          ${isMine ? 'rounded-br-none' : 'rounded-bl-none'}
        `}
      >
        {/* Isi Post Card */}
        <div className="flex gap-4 items-start">
          {/* Gambar Barang */}
          <div className="avatar flex-shrink-0">
            <div className="w-24 h-24 rounded-xl overflow-hidden ring-2 ring-emerald-500/20">
              <img
                src={post.item_photo || '/default-item.jpg'}
                alt="Barang"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info Post */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-end mb-2">
              <div className="badge badge-primary badge-sm font-medium">
                {post.type === 'titip' ? 'Mau Titip' : 'Bisa Bawa'} 
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-base-content/80 mt-3">
              <span className="font-semibold">{post.from_city || '-'}</span>
              <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span className="font-semibold">{post.to_city || '-'}</span>
            </div>

            <div className="mt-4">
              <p className="text-emerald-600 font-bold text-lg">
                Fee: Rp{post.fee ? parseInt(post.fee).toLocaleString('id-ID') : '-'}
              </p>
            </div>
          </div>
        </div>

        <hr className="my-4 border-base-300" />

        <p className="text-xs text-center text-base-content/60 -mb-1">
          {msg.content || 'saya tertarik dengan penawaran ini.'}
        </p>

        {/* Tail lancip */}
        <div className={`absolute w-3 h-5 top-6 ${isMine ? 'right-0 translate-x-full' : 'left-0 -translate-x-full'}`}>
          <svg viewBox="0 0 8 16" className="w-full h-full drop-shadow-md">
            <path
              d="M0,0 Q8,8 0,16 L0,0"
              fill="#f5f5f5"
              className="dark:fill-base-100"
            />
          </svg>
        </div>
      </div>
      {isMine && (
        <div className={`chat-footer text-xs mt-0 ${msg.is_read ? 'text-blue-500' : 'opacity-70'}`}>
          {msg.is_read ? 'Terbaca ✓✓' : 'Terkirim ✓'}
        </div>
      )}
    </div>
  );
}