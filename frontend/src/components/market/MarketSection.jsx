import MarketProductCard from "./MarketProductCard";
import { useLanguage } from "../../lib/LanguageContext";

export default function MarketSection({
  title,
  subtitle,
  products = [],
  loading = false,
}) {
  const { t } = useLanguage();
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-[13px] text-slate-500">{subtitle}</p>
          ) : (
            <p className="mt-1 text-[12px] font-medium text-slate-400">
              {t("Temukan produk terbaik")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-white px-3 py-1.5 shadow-sm border border-slate-50">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4e73df] animate-pulse"></span>
          <span className="text-[11px] font-semibold text-slate-500">
            {products.length} {t("item")}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[128px] animate-pulse rounded-[24px] border border-[#e4edff] bg-gradient-to-br from-[#e4edff] to-[#edf3ff]"
            />
          ))}
        </div>
      ) : products.length ? (
        <div className="space-y-4">
          {products.map((product) => (
            <MarketProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-[32px] border border-dashed border-slate-200 px-4 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
            <span className="text-xl">🔍</span>
          </div>
          <p className="text-[15px] font-semibold text-slate-700">
            {t("Tidak ada produk")}
          </p>
          <p className="mx-auto mt-2 max-w-[200px] text-[13px] text-slate-400">
            {t("Coba ganti pencarian atau pilih kategori lain.")}
          </p>
        </div>
      )}
    </div>
  );
}
