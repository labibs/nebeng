import { Store, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MarketHeader({ search, onSearchChange }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Top Bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/outlet")}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary"
          >
            <Store size={18} />
            Outlet Saya
          </button>

          <img
            src="./pwa-64x64.png"
            alt="Nebeng"
            className="w-10 h-10 rounded-xl"
          />
        </div>
      </div>

      {/* Search */}
      <div className="sticky top-0 z-40 px-4 pb-3 pt-2 backdrop-blur">
        <div className="relative">


          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari Outlet atau Produk"
            className="
              peer
              input input-bordered
              w-full rounded-full
              pl-3 pr-10
              bg-white
              dark:bg-base-100
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
                transition-colors
              "
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}