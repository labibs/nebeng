import { ArrowLeft, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLanguage } from "../../lib/LanguageContext";

export default function CartHeader({
  title = "Keranjang Nitip",
  searchQuery = "",
  setSearchQuery = () => {},
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  return (
    <div className="sticky top-0 z-40 shrink-0 bg-[#f0f7ff] px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 transition-all">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label={t("Kembali")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-50 bg-white shadow-[0_12px_28px_rgba(82,109,181,0.15)] transition-transform active:scale-95"
          >
            <ArrowLeft size={20} className="text-slate-700" />
          </button>
          <h3 className="text-lg font-bold text-slate-900">{t(title)}</h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSearchVisible(!isSearchVisible)}
            aria-label={t("Search")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-50 bg-white shadow-[0_12px_28px_rgba(82,109,181,0.15)] transition-transform active:scale-95 relative"
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
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-[22px] bg-white px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100">
            <Search size={18} className="shrink-0 text-[#4e73df]" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Cari item, toko, atau nama...")}
              className="w-full min-w-0 bg-transparent text-[14px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
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
