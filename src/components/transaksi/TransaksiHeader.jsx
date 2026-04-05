import { Search } from "lucide-react";
import { useState } from "react";
import SearchModal from "../common/SearchModal";

export default function TransaksiHeader({ searchQuery, setSearchQuery }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-30 px-4 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="bg-gradient-to-r from-[#4e73df] to-[#6c8ef8] bg-clip-text text-[26px] font-extrabold text-transparent tracking-tight">
            Transaksi
          </h3>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-50 bg-white shadow-[0_12px_28px_rgba(82,109,181,0.15)] transition-transform active:scale-95"
              aria-label="Search"
            >
              <Search size={20} className="text-[#4e73df]" />
              {searchQuery && (
                <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-rose-500 border-2 border-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      <SearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Cari transaksi, rute, atau item..."
      />
    </>
  );
}
