// components/cart/CartItemCard.jsx
import { Heart, Trash2, Plus, Minus } from "lucide-react";
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

  return (
    <motion.div
      className={`
        bg-white dark:bg-slate-800 
        rounded-2xl shadow-md overflow-hidden
        flex items-start gap-3 p-3 relative
        ${isSelected ? "ring-2 ring-emerald-500/70" : ""}
      `}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Checkbox */}
      

      <div className="w-full">
        <div className="flex items-start gap-3 w-full">
          {/* Gambar produk */}
          <div className="flex-shrink-0">
            <img
              src={product.image_url || "https://via.placeholder.com/90"}
              alt={product.name}
              className="w-24 h-24 object-cover rounded-xl border border-gray-200 dark:border-slate-700"
            />
          </div>

          {/* Konten utama */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Nama + tombol wishlist */}
            <div className="flex justify-between items-start">
              <h4 className="font-semibold text-base leading-tight line-clamp-2 pr-8">
                {product.name}
              </h4>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(item.id)}
                className="checkbox checkbox-sm checkbox-primary mt-1"
              />
            </div>

            {/* Info tambahan (warung / size / variant jika ada) */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {warung.name} • {warung.address?.substring(0, 35)}
              {warung.address?.length > 35 ? "..." : ""}
            </p>
            <div className="flex justify-between items-start mt-1">
              <h4 className="font-semibold text-base leading-tight line-clamp-2 pr-8">
                {product.estimated_price
                  ? ` Rp ${Number(
                      product.estimated_price
                    ).toLocaleString("id-ID")}`
                  : "Rp. 0"}
              </h4>
              <p>X {item.quantity} pcs</p>
            </div>

            {/* Catatan (opsional) */}
            {item.notes && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                Catatan: {item.notes}
              </p>
            )}
          </div>
        </div>
        <hr className="px-2 mt-2 mb-0 opacity-10"/>
        {/* Row Estimasi + controls (full width, below gambar & keterangan) */}
        <div className="mt-1 flex items-center justify-between w-full">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Estimasi Total</p>
            <p className="text-sm font-semibold text-emerald-600">
              Rp {(Number(item.estimated_price || 0) * item.quantity).toLocaleString("id-ID")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-300 dark:border-slate-600 rounded-full overflow-hidden text-sm font-medium">
              <button
                onClick={() => handleQtyChange(item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-700 disabled:opacity-40"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center">{item.quantity}</span>
              <button
                onClick={() => handleQtyChange(item.quantity + 1)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-700"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Tombol hapus */}
            <button
              onClick={() => onDelete(item.id)}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-slate-700 text-red-500 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full transition-colors -mr-2"
              title="Hapus item"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}