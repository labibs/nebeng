import { ArrowLeft, Share2, Heart, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DetailProductHeader({ title = "Detail Produk" }) {
    const navigate = useNavigate();

    return (
        <div className="shrink-0 mb-0 pt-3 px-4 bottom-0 left-0 right-0 bg-white sticky top-0 z-40">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-white rounded-full p-2 border shadow-sm text-black hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <h3 className="text-base font-semibold leading-tight text-gray-900">
                        {title}
                    </h3>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-full hover:bg-gray-100 text-gray-700 active:scale-95 transition-all">
                        <Share2 size={20} />
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-100 text-gray-700 active:scale-95 transition-all">
                        <Heart size={20} />
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-100 text-gray-700 active:scale-95 transition-all relative">
                        <ShoppingCart size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
