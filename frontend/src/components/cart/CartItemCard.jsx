// components/cart/CartItemCard.jsx
import { Trash2, Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";

export default function CartItemCard({
  item,
  isSelected,
  onToggleSelect,
  onUpdateQuantity,
  onDelete,
}) {
  const product = item.product || {};
  const warung = item.warung || {};

  const handleQtyChange = (newQty) => {
    if (newQty < 1) return;
    onUpdateQuantity(item.id, newQty);
  };

  const keteranganByStatus = () => {
    if (warung.status === "kurir") return "Mau Nitip";
    if (warung.status === "pembeli" && warung.category === "Jasa")
      return "Anterin Kesini";
    if (warung.status === "pembeli" && warung.category !== "Jasa")
      return "Beliin Kesini";
    return "Nitip Sekarang";
  };

  return (
    <motion.div
      className={`
        bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden
        flex items-start gap-3 p-3 relative
        ${isSelected ? "ring-2 ring-[#4e73df]/30" : ""}
      `}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="w-full">
        <div className="flex items-start gap-3 w-full">
          {/* Gambar produk */}
          <div className="flex-shrink-0">
            <img
              src={product.image_url || "https://via.placeholder.com/90"}
              alt={product.name}
              className="w-20 h-20 object-cover rounded-xl border border-slate-100 bg-slate-50"
            />
          </div>

          {/* Konten utama */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Checkbox + Nama */}
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="font-semibold text-sm leading-tight line-clamp-2 text-slate-900">
                  {product.name}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {keteranganByStatus()} • {warung.name.substring(0, 15)}
                  {warung.name.length > 15 ? "..." : ""}
                </p>
              </div>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(item.id)}
                className="checkbox checkbox-sm mt-1 accent-[#4e73df]"
              />
            </div>

            {/* Harga */}
            <div className="flex justify-between items-start mt-1">
              <p className="text-sm font-semibold text-[#4e73df]">
                Rp{" "}
                {Number(product.estimated_price || 0).toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-400">{item.quantity} pcs</p>
            </div>

            {/* Catatan */}
            {item.notes && (
              <p className="text-[10px] text-slate-400 mt-1 italic">
                Catatan: {item.notes}
              </p>
            )}
          </div>
        </div>

        <hr className="mt-2 mb-2 border-slate-50" />

        {/* Estimasi Total + Controls */}
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="text-[10px] text-slate-400">Estimasi Total</p>
            <p className="text-sm font-bold text-slate-900">
              Rp{" "}
              {(
                Number(item.estimated_price || 0) * item.quantity
              ).toLocaleString("id-ID")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-slate-200 rounded-full overflow-hidden text-sm font-medium">
              <button
                onClick={() => handleQtyChange(item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="w-8 h-8 flex items-center justify-center bg-slate-50 disabled:opacity-40 text-slate-600"
              >
                <Minus size={14} />
              </button>
              <span className="w-9 text-center text-sm text-slate-700">
                {item.quantity}
              </span>
              <button
                onClick={() => handleQtyChange(item.quantity + 1)}
                className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Tombol hapus */}
            <button
              onClick={() => onDelete(item.id)}
              className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 rounded-full transition-colors"
              title="Hapus item"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
