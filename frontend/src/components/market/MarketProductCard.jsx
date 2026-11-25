import { Star, User, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../lib/LanguageContext";

export default function MarketProductCard({ product }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const status = product?.warung_status;
  const category = product?.warung_category;
  const ownerAvatar = product?.owner_avatar;

  const keteranganByStatus = () => {
    if (status === "kurir") return t("Bisa nitip");
    if (status === "pembeli" && category === "Jasa") return t("Butuh Jasa");
    if (status === "pembeli" && category !== "Jasa") return t("Nitip beliin");
    return t("Outlet resmi");
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="group relative flex h-[128px] cursor-pointer items-stretch overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_8px_25px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)]"
    >
      <div className="relative h-[128px] w-[128px] shrink-0 p-2">
        <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-slate-100">
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />

          <div className="absolute left-2 top-2 rounded-full bg-slate-900/50 px-2 py-0.5 text-[8px] font-medium text-white backdrop-blur-md">
            {product.category_name?.slice(0, 10) || t("Item")}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between overflow-hidden p-3.5 pl-0.5">
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-white px-1.5 py-0.5 text-[8px] font-semibold text-slate-800 shadow-sm">
          <Star size={8} className="fill-amber-400 text-amber-400" />
          {product.rating || "0.0"}
        </div>
        <div className="space-y-0.5">
          <p className="truncate text-[10px] font-medium text-[#4e73df] opacity-80">
            {product.warung_name || "Outlet Numpak"}
          </p>

          <h3 className="line-clamp-2 text-[13px] font-semibold leading-tight text-slate-900">
            {product.name}
          </h3>

          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[14px] font-bold text-slate-900">
              Rp{Number(product.estimated_price || 0).toLocaleString(language === "en" ? "en-US" : "id-ID")}
            </span>
            <span className="rounded-full border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[8px] font-medium leading-none text-amber-700">
              {t("Diskon 10%")}
            </span>
            <span className="shrink-0 text-[9px] font-medium text-slate-400">
              {t("estimasi")}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div
              className="flex h-6.5 items-center gap-1 rounded-full border border-slate-100 bg-slate-50 px-1 pr-2 shadow-sm cursor-pointer active:scale-95 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/detail/${product.owner_id}`);
              }}
            >
              <div className="h-4.5 w-4.5 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-100">
                {ownerAvatar ? (
                  <img
                    src={ownerAvatar}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-500">
                    <User size={7} />
                  </div>
                )}
              </div>
              <span className="max-w-[42px] truncate text-[8px] font-medium text-slate-600">
                {product.owner_name?.split(" ")[0] || t("Owner")}
              </span>
            </div>

            <div className="flex h-6.5 items-center rounded-full border border-blue-100/50 bg-blue-50 px-2">
              <span className="whitespace-nowrap text-[8px] font-medium leading-none text-[#4e73df]">
                {keteranganByStatus()}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 pr-1">
            <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-300 shadow-sm transition-all duration-300 group-hover:bg-[#4e73df] group-hover:text-white">
              <Heart size={12} strokeWidth={2.8} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
