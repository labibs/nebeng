import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CartHeader({ title = "Titipan Tersimpan" }) {
    const navigate = useNavigate();

    return (
      <div className="shrink-0 mb-0 pt-3 px-4 bottom-0 pb-[0.5px] pl-4 pr-4 bg-gradient-to-br from-green-100 to-emerald-200
        dark:from-slate-900 dark:to-slate-800
        transition-transform sticky top-0 z-40">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-white dark:bg-slate-800 rounded-full p-2 shadow-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
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
