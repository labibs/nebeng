import { ArrowLeft, Share2, Heart, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CartIconButton from "../cart/CartIconButton";

export default function DetailProductHeader({ title = "Detail Produk" }) {
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

                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 active:scale-95 transition-all">
                        <Share2 size={20} />
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 active:scale-95 transition-all">
                        <Heart size={20} />
                    </button>
                    <CartIconButton />
                </div>
            </div>
        </div>
    );
}
