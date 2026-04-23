import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function OutletHeader() {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-50 bg-[#f0f7ff] shrink-0 pt-[calc(env(safe-area-inset-top)+0.75rem)] px-4 pb-1">
      <div className="flex items-start gap-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_12px_28px_rgba(82,109,181,0.15)] transition-transform active:scale-95"
        >
          <ArrowLeft size={20} className="text-slate-700" />
        </button>

        <div className="flex flex-col">
          <h3 className="text-base font-semibold leading-tight text-slate-900">
            Outlet Saya
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola produk dan outletmu di sini
          </p>
        </div>
      </div>
    </div>
  );
}
