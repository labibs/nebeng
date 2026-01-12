export default function MarketCategories() {
  return (
    <div className="px-4 mt-6 flex gap-2 overflow-x-auto">
      {["Makanan", "Obat", "Sembako", "Pakaian", "Perkakas", "Matrial"].map((item, i) => (
        <button
          key={i}
          className={`btn btn-sm rounded-full ${
            i === 0 ? "btn-success text-white" : "btn-outline"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
