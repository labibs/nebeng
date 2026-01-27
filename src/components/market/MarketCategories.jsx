export default function MarketCategories({ active, onChange }) {
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

  return (
    <div className="px-4 mt-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => onChange(item === "Semua" ? null : item)}
            className={`
              btn btn-sm rounded-full
              ${(active === item) || (item === "Semua" && active === null)
                ? "btn-success text-white"
                : "btn-outline dark:btn-ghost"
              }
            `}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}