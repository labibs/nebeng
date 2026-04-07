import { Search, X } from "lucide-react";
import { useState } from "react";

export default function TransaksiHeader({ searchQuery, setSearchQuery }) {
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  return (
    <div className="sticky top-0 z-30 px-4 pt-3 pb-3 bg-[#f0f7ff]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="bg-gradient-to-r from-[#4e73df] to-[#6c8ef8] bg-clip-text text-[26px] font-extrabold text-transparent tracking-tight">
          Transaksi
        </h3>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSearchVisible(!isSearchVisible)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-50 bg-white shadow-[0_12px_28px_rgba(82,109,181,0.15)] transition-transform active:scale-95 relative"
            aria-label="Search"
          >
            <Search
              size={20}
              className={isSearchVisible ? "text-[#4e73df]" : "text-slate-500"}
            />
            {searchQuery && !isSearchVisible && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 border-2 border-white" />
            )}
          </button>
        </div>
      </div>

      {isSearchVisible && (
        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-[22px] bg-white px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100">
            <Search size={18} className="shrink-0 text-[#4e73df]" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi, rute, atau item..."
              className="w-full min-w-0 bg-transparent text-[14px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
