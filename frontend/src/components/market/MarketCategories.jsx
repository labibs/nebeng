import { useLanguage } from "../../lib/LanguageContext";

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
  const { t } = useLanguage();
  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[18px] font-bold tracking-tight text-slate-900">
          {t("Kategori")}
        </h2>
        <button className="text-[11px] font-semibold text-[#4e73df] hover:opacity-70 transition-all">
          {t("Lihat semua")}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-0.5">
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
                  ? "whitespace-nowrap rounded-[26px] border border-blue-100 bg-blue-50 px-5 py-2.5 text-[12px] font-semibold text-[#4e73df] shadow-sm shadow-blue-50 transition-all transform active:scale-95"
                  : "whitespace-nowrap rounded-[26px] border border-slate-50 bg-white px-5 py-2.5 text-[12px] font-medium text-slate-500 shadow-[0_8px_25px_rgba(0,0,0,0.04)] transition-all hover:bg-slate-50 active:scale-95"
              }
            >
              {t(item)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
