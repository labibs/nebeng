import { Store } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MarketHeader() {
  const navigate = useNavigate();

  return (
    <>
      {/* Top Bar (NORMAL) */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">

          {/* Location */}
          <div className="flex items-center gap-2 text-sm opacity-80">
             <button
              onClick={() => navigate("/outlet")}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary"
            >
              <Store size={22} />
              Outlet Saya
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
           

            <img
              src="./pwa-64x64.png"
              alt="Nebeng"
              className="w-10 h-10 object-cover rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Search (FIXED / STICKY) */}
      <div className="sticky top-0 z-40 px-4 pb-3 pt-2 ">
        <input
          type="text"
          placeholder="Cari Outlet atau Produk"
          className="input input-bordered w-full rounded-full"
        />
      </div>
    </>
  );
}
