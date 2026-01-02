import { useState } from 'react';

export default function DealCard({ msg, isMine, avatar, postInfo, currentUserId }) {
  const [negoPrice, setNegoPrice] = useState('');
  const [showNegoModal, setShowNegoModal] = useState(false);

  // Ekstrak ongkos yang diusulkan dari content (jika ada)
  const ongkosMatch = msg.content.match(/💰[^0-9]*([0-9.,]+)/);
  const ongkosText = ongkosMatch ? ongkosMatch[1].replace(/\./g, '') : null;
  const ongkos = ongkosText ? parseInt(ongkosText.replace(/,/g, ''), 10) : null;

  const handleQuickReply = (text) => {
    // Ini sementara — nanti akan diganti di MessageInput
    // Untuk sekarang, kita bisa copy ke clipboard atau alert
    navigator.clipboard.writeText(text);
    alert('Teks deal disalin ke clipboard!\n\n' + text);
  };

  return (
    <>
      <div className={`chat ${isMine ? 'chat-end' : 'chat-start'}`}>
        <div className="chat-image avatar">
          <div className="w-10 rounded-full">
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
            relative max-w-md px-5 py-4 rounded-2xl shadow-lg overflow-hidden border
            ${isMine
              ? 'bg-gradient-to-r from-[#81c784]/10 to-[#66bb6a]/10 border-emerald-300 rounded-br-none'
              : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 rounded-bl-none'
            }
          `}
        >
          {/* Header Card */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-emerald-700 dark:text-emerald-300">
                Deal Ongkos Jastip
              </div>
              <div className="text-xs opacity-70">
                {isMine ? 'Menunggu konfirmasi dari lawan...' : 'Pilih aksi'}
              </div>
            </div>
          </div>

          {/* Isi Pesan - FIX DI SINI: pakai postInfo.fee! */}
          <div className="mb-5 whitespace-pre-wrap text-base-content/90 text-sm leading-relaxed">
            💰 Ongkos awal jastip : Rp {postInfo?.fee ? parseInt(postInfo.fee).toLocaleString('id-ID') : '-'} <br />
            {msg.content.replace(/^\[[^\]]+\]\s*/, '').trim()}
          </div>

          {/* Tombol hanya muncul jika pesan dari lawan */}
          {!isMine && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const replyText = ongkos
                    ? `Deal! Ongkos jastip Rp${ongkos.toLocaleString('id-ID')} ✅\nTerima kasih kak, kapan mau ketemuan?`
                    : `Deal! Ongkos jastip sesuai kesepakatan ✅\nKapan mau ketemuan ya kak?`;
                  handleQuickReply(replyText);
                }}
                className="flex-1 btn btn-success btn-sm rounded-xl text-white font-medium shadow-md hover:shadow-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Deal
              </button>

              <button
                onClick={() => {
                  const defaultPrice = ongkos ? Math.floor(ongkos * 0.9) : 30000;
                  setNegoPrice(defaultPrice.toString());
                  setShowNegoModal(true);
                }}
                className="flex-1 btn btn-outline btn-warning btn-sm rounded-xl font-medium hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Nego
              </button>
            </div>
          )}

          {/* Tail lancip */}
          <div className={`absolute w-3 h-5 top-6 ${isMine ? 'right-0 translate-x-full' : 'left-0 -translate-x-full'}`}>
            <svg viewBox="0 0 8 16" className="w-full h-full drop-shadow-md">
              <path
                d="M0,0 Q8,8 0,16 L0,0"
                fill={isMine ? '#66bb6a' : '#dcfce7'}
                className="dark:fill-emerald-900/50"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Modal Nego sementara (akan dipindah ke komponen terpisah nanti) */}
      {showNegoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowNegoModal(false)}>
          <div className="bg-base-100 rounded-t-3xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-center mb-4">Nego Ongkos Jastip</h3>
            <input
              type="number"
              value={negoPrice}
              onChange={(e) => setNegoPrice(e.target.value.replace(/\D/g, ''))}
              className="input input-lg w-full text-center text-2xl"
              placeholder="35000"
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNegoModal(false)} className="flex-1 btn btn-ghost">
                Batal
              </button>
              <button
                onClick={() => {
                  if (negoPrice) {
                    const text = `[deal_ongkos_jastip]\n\n💰 Nego Ongkos jastip: Rp${parseInt(negoPrice).toLocaleString('id-ID')}\n\nBisa deal di harga ini ya kak? 🙏`;
                    handleQuickReply(text);
                    setShowNegoModal(false);
                  }
                }}
                className="flex-1 btn btn-success"
              >
                Kirim Nego
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}