import { useState } from "react";

const categories = [
  "Makanan",
  "Obat",
  "Sembako",
  "Pakaian",
  "Perkakas",
  "Material",
  "Jasa"
];

export default function MarketCategories() {
  const [active, setActive] = useState(0);

  return (
    <div className="px-4 mt-4">
      <div
        className="
          flex gap-2 overflow-x-auto
          snap-x snap-mandatory
          overscroll-x-contain
          scrollbar-hide
          pb-1
        "
      >
        {categories.map((item, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`
              snap-start
              btn btn-sm rounded-full whitespace-nowrap
              transition-all
              active:scale-95
              ${
                active === i
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
