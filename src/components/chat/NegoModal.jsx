import { useState } from 'react';
export default function NegoModal({ isOpen, onClose, onSend, initialPrice, postInfo = '' }) {
  if (!isOpen) return null;

  const formatRupiah = (value) => {
    const num = Number(value);
      if (isNaN(num)) return '-';
      return `Rp ${num.toLocaleString('id-ID')}`;
    };
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="bg-base-100 rounded-t-3xl shadow-2xl overflow-hidden">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-base-300 rounded-full" />
          </div>

          <div className="px-6 pt-2 pb-4 text-center">
            <h3 className="text-xl font-bold">Nego Ongkos Jastip</h3>
            <p className="text-sm text-base-content/70 mt-1">{formatRupiah(postInfo.fee)} mau dinego berapa ?</p>
          </div>

          <NegoForm 
            initialPrice={postInfo?.fee ? Math.floor(postInfo.fee * 0.95) : 0} 
            onSend={onSend} 
            onClose={onClose} 
          />
        </div>
      </div>
    </>
  );
}

// Form terpisah agar lebih rapi
function NegoForm({ initialPrice, onSend, onClose }) {
  const [negoPrice, setNegoPrice] = useState(initialPrice.toString());

  const handleSend = () => {
    if (negoPrice && parseInt(negoPrice) > 0) {
      const formatted = parseInt(negoPrice).toLocaleString('id-ID');
      const message = `[deal_ongkos_jastip]\n\n💰 Nego Ongkos jastip: Rp ${formatted}\n\nBisa deal di harga ini ya kak? 🙏`;
      onSend(message);
      onClose();
    }
  };

  return (
    <>
      <div className="px-6 pb-6">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-base-content/60">Rp</span>
          <input
            type="number"
            value={negoPrice}
            onChange={(e) => setNegoPrice(e.target.value.replace(/\D/g, ''))}
            placeholder="35000"
            className="input input-lg w-full pl-12 pr-4 text-2xl font-bold text-center bg-base-200 focus:outline-none focus:ring-4 focus:ring-emerald-400/30"
            autoFocus
          />
        </div>

        {negoPrice && (
          <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-base-content/80 whitespace-pre-wrap">
              💰 Nego Ongkos jastip: Rp{parseInt(negoPrice).toLocaleString('id-ID')}{'\n\n'}Bisa deal di harga ini ya kak? 🙏
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 px-6 pb-8">
        <button onClick={onClose} className="flex-1 btn btn-ghost btn-lg rounded-2xl">
          Batal
        </button>
        <button
          onClick={handleSend}
          disabled={!negoPrice || parseInt(negoPrice) <= 0}
          className="flex-1 btn btn-success btn-lg rounded-2xl text-white font-bold shadow-lg disabled:opacity-50"
        >
          Kirim Nego
        </button>
      </div>
    </>
  );
}