import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import CartIconButton from "../cart/CartIconButton";
import OutletButton from "./OutletButton";

export default function MarketHeader({
  search,
  onSearchChange,
  owner_avatar,
  owner_name,
}) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 80);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative z-20 px-4 pb-5 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <OutletButton owner_avatar={owner_avatar} owner_name={owner_name} />
        </div>

        <div className="flex items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-50 bg-white shadow-[0_12px_28px_rgba(82,109,181,0.15)] transition-transform active:scale-95">
            <CartIconButton className="!p-0 !text-[#4e73df] hover:!bg-transparent" />
          </div>
        </div>
      </div>

      <div
        className={`sticky z-50 transition-all duration-300 ${
          isSticky
            ? "top-0 -mx-4 bg-[#f0f7ff]/95 px-4 py-2.5 shadow-sm backdrop-blur-xl"
            : "top-3"
        }`}
      >
        <div
          className={`flex items-center gap-2.5 rounded-[26px] bg-white p-2 shadow-[0_16px_40px_rgba(82,109,181,0.14)] transition-all duration-300 ${
            isSticky ? "shadow-[0_14px_35px_rgba(82,109,181,0.18)]" : ""
          }`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[22px] bg-[#f5f7ff] px-3.5 py-3 shadow-inner">
            <Search size={18} className="shrink-0 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari outlet atau produk..."
              className="w-full min-w-0 bg-transparent text-[14px] text-slate-700 outline-none placeholder:text-slate-400"
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition hover:bg-slate-300"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-500 shadow-sm transition-transform active:scale-95"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
