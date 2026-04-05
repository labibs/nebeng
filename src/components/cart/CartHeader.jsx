import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CartHeader({ title = "Titipan Tersimpan" }) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-40 mb-0 shrink-0 bg-gradient-to-br from-[#eef4ff] to-[#dfe9ff] px-4 pb-[0.5px] pt-3 transition-transform">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full bg-white p-2 text-black shadow-sm transition-all hover:bg-gray-50 active:scale-95 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            <ArrowLeft size={20} />
          </button>

          <h3 className="text-base font-semibold leading-tight text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      </div>
    </div>
  );
}
