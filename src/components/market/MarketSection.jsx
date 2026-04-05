import MarketProductCard from "./MarketProductCard";

export default function MarketSection({
  title,
  subtitle,
  products = [],
  loading = false,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          ) : (
            <p className="mt-1 text-[13px] font-medium text-slate-400 uppercase tracking-wider">
              Temukan produk terbaik
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-white px-3 py-1.5 shadow-sm border border-slate-50">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4e73df] animate-pulse"></span>
          <span className="text-[12px] font-bold text-slate-500">
            {products.length} Items
          </span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-[38px] bg-slate-100/50 border border-slate-50"
            />
          ))}
        </div>
      ) : products.length ? (
        <div className="space-y-5">
          {products.map((product) => (
            <MarketProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-[40px] border border-dashed border-slate-200 px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
            <span className="text-2xl">🔍</span>
          </div>
          <p className="text-base font-bold text-slate-700">Tidak ada produk</p>
          <p className="mt-2 text-sm text-slate-400 max-w-[200px] mx-auto">
            Coba ganti pencarian atau pilih kategori lain.
          </p>
        </div>
      )}
    </div>
  );
}
