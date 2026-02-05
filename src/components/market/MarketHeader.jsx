import { X } from "lucide-react";
import { useEffect, useState } from "react";
import OutletButton from "./OutletButton";

export default function MarketHeader({ search, onSearchChange, owner_avatar }) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 60);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top Bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <img
            src="./pwa-64x64.png"
            alt="Nebeng"
            className="w-10 h-10 rounded-xl"
          />
          <OutletButton owner_avatar={owner_avatar} />
        </div>
      </div>

      {/* Search (Sticky & Flexible) */}
      <div
        className={`
          sticky top-0 z-40
          px-4
          backdrop-blur
          transition-all duration-300
          ${isSticky ? "py-2 bg-white/80 dark:bg-base-100/80" : "pt-2 pb-3"}
        `}
      >
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari Outlet atau Produk"
              className="
                input input-bordered
                w-full rounded-full
                pl-3 pr-10
                bg-white dark:bg-base-100
                transition-all duration-300
              "
            />

            {search && (
              <button
                onClick={() => onSearchChange("")}
                className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  p-1 rounded-full
                  bg-gray-200 dark:bg-gray-700
                  text-gray-500 dark:text-gray-300
                  hover:bg-gray-300 dark:hover:bg-gray-600
                  transition
                "
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Outlet Button → hanya muncul saat sticky */}
          {isSticky && (
            <div className="shrink-0">
              <OutletButton owner_avatar={owner_avatar} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
