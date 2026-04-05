const categories = [
  "Semua",
  "Makanan",
  "Obat",
  "Sembako",
  "Pakaian",
  "Perkakas",
  "Material",
  "Jasa",
];

export default function MarketCategories({ active, onChange }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
          Kategori
        </h2>
        <button className="text-[12px] font-bold text-[#4e73df] uppercase tracking-wider hover:opacity-70 transition-all">
          Lihat semua
        </button>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide px-0.5">
        {categories.map((item) => {
          const isActive =
            active === item || (item === "Semua" && active === null);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item === "Semua" ? null : item)}
              className={
                isActive
                  ? "whitespace-nowrap rounded-2xl bg-blue-50 px-6 py-3 text-[13px] font-black text-[#4e73df] border border-blue-100 shadow-sm shadow-blue-50 transition-all transform active:scale-95"
                  : "whitespace-nowrap rounded-2xl bg-white px-6 py-3 text-[13px] font-bold text-slate-500 shadow-[0_8px_25px_rgba(0,0,0,0.04)] border border-slate-50 transition-all hover:bg-slate-50 active:scale-95"
              }
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
