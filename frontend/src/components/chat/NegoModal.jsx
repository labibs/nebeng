import { useState } from "react";
import { X, DollarSign } from "lucide-react";

export default function NegoModal({
  isOpen,
  onClose,
  onSend,
  initialPrice,
  postInfo = "",
}) {
  if (!isOpen) return null;

  const formatRupiah = (value) => {
    const num = Number(value);
    if (isNaN(num)) return "-";
    return `Rp ${num.toLocaleString("id-ID")}`;
  };
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 pb-2 flex items-center justify-between flex-shrink-0">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <DollarSign size={20} />
              Nego Ongkos Jastip
            </h3>
            <button
              onClick={onClose}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <p className="px-6 text-sm text-slate-400">
            {formatRupiah(postInfo.fee)} mau dinego berapa ?
          </p>

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
      const formatted = parseInt(negoPrice).toLocaleString("id-ID");
      const message = `[deal_ongkos_jastip]\n\n💰 Nego Ongkos jastip: Rp ${formatted}\n\nBisa deal di harga ini ya kak? 🙏`;
      onSend(message);
      onClose();
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-slate-400">
            Rp
          </span>
          <input
            type="number"
            value={negoPrice}
            onChange={(e) => setNegoPrice(e.target.value.replace(/\D/g, ""))}
            placeholder="35000"
            className="input input-lg w-full pl-12 pr-4 text-2xl font-bold text-center bg-slate-50 rounded-2xl"
            autoFocus
          />
        </div>

        {negoPrice && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-sm text-emerald-700 whitespace-pre-wrap">
              💰 Nego Ongkos jastip: Rp
              {parseInt(negoPrice).toLocaleString("id-ID")}
              {"\n\n"}Bisa deal di harga ini ya kak? 🙏
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 flex-shrink-0 bg-white pb-8">
        <button
          onClick={handleSend}
          disabled={!negoPrice || parseInt(negoPrice) <= 0}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4e73df] text-white py-3 text-[13px] font-semibold hover:bg-[#3d64c7] transition-colors shadow-sm disabled:opacity-50"
        >
          Kirim Nego
        </button>
      </div>
    </>
  );
}
