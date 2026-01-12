const icons = [
  { icon: "🍩", label: "Roti" },
  { icon: "🍦", label: "Es Krim" },
  { icon: "🍉", label: "Semangka" },
  { icon: "☕", label: "Kopi" },
  { icon: "🍔", label: "Srabikan" },
];

export default function MarketQuickIcons() {
  return (
    <div className="px-4 mt-2">
      <div
        className="
          flex gap-4 overflow-x-auto
          snap-x snap-mandatory
          overscroll-x-contain
          scrollbar-hide
          pb-1
        "
      >
        {icons.map((item, i) => (
          <button
            key={i}
            className="
              snap-start
              flex flex-col items-center gap-1
              min-w-[64px]
              focus:outline-none
              active:scale-95
              transition
            "
          >
            <div className="w-14 h-14 rounded-full bg-white dark:bg-base-100 flex items-center justify-center shadow-md">
              <span className="text-3xl">{item.icon}</span>
            </div>
            <span className="text-xs opacity-70">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
