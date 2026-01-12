const icons = [
  { icon: "🍩", label: "Dessert" },
  { icon: "🍦", label: "Ice Cream" },
  { icon: "🍕", label: "Pizza" },
  { icon: "☕", label: "Coffee" },
  { icon: "🍔", label: "Burger" },
];

export default function MarketQuickIcons() {
  return (
    <div className="px-4 mt-2 flex gap-4 overflow-x-auto scrollbar-hide">
      {icons.map((item, i) => (
        <button
          key={i}
          className="flex flex-col items-center gap-1 min-w-[64px] focus:outline-none"
        >
          <div className="w-13 h-13 rounded-full bg-white dark:bg-base-100 flex items-center justify-center shadow-md hover:scale-105 transition">
            <span className="text-3xl">{item.icon}</span>
          </div>
          <span className="text-xs opacity-70">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
