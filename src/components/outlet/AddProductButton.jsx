import { Plus } from "lucide-react";

export default function AddProductButton() {
  return (
    <button
      className="
        fixed bottom-20 right-4
        flex items-center gap-1.5
        bg-primary text-white
        px-3 py-2
        rounded-full
        shadow-lg
        text-[11px] font-medium
        hover:bg-primary/90
        transition
      "
    >
      <Plus size={14} />
      Tambah Produk
    </button>
  );
}
