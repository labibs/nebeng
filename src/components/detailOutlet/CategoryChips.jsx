const categories = [
  "Sport shoes",
  "Sneakers",
  "Basketball",
  "Running",
];

export default function CategoryChips() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {categories.map((cat, i) => (
        <button
          key={i}
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border ${
            i === 0 ? "bg-black text-white" : "bg-base-100"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}