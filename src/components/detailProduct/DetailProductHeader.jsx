import { ArrowLeft, Share2, Heart, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CartIconButton from "../cart/CartIconButton";

export default function DetailProductHeader({ title = "Detail Produk" }) {
  const navigate = useNavigate();

  return (
    <div className="shrink-0 mb-0 pt-3 px-4 bottom-0 pb-[0.5px] pl-4 pr-4 bg-[#f0f7ff] sticky top-0 z-40">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="bg-white rounded-full p-2 shadow-sm text-slate-700 hover:bg-slate-50 active:scale-95 transition-all border border-slate-100"
          >
            <ArrowLeft size={18} />
          </button>

          <h3 className="text-base font-semibold leading-tight text-slate-900">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 active:scale-95 transition-all">
            <Share2 size={18} />
          </button>
          <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 active:scale-95 transition-all">
            <Heart size={18} />
          </button>
          <CartIconButton />
        </div>
      </div>
    </div>
  );
}
