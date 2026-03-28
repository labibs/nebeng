import { useRef, useState } from "react";

export default function TransaksiHeader({ searchQuery, setSearchQuery }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const inputRef = useRef(null);

  return (
    <div className="sticky top-0 z-10 navbar bg-base-100/80 dark:bg-base-900/80 backdrop-blur-xl shadow-md border-b border-base-300/20">
      {/* Title */}
      <div className="flex-1">
        <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#81c784] to-[#a5d6a7]">
          Transaksi
        </h3>
      </div>

      {/* Actions */}
      <div className="flex-none flex items-center gap-3">
        <div className="relative">
          {/* Search Button */}
          <button
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className="btn btn-ghost btn-circle text-green-600/70"
            aria-label="Search"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* Search Input */}
          <div
            className={`absolute right-14 top-0 w-64 transition-all duration-300 ease-in-out ${
              isSearchOpen
                ? "opacity-100 visible translate-y-0"
                : "opacity-0 invisible -translate-y-2 pointer-events-none"
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Cari transaksi, deal, rute..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() =>
                setTimeout(() => setIsSearchOpen(false), 200)
              }
              className="input input-bordered w-full bg-base-100 dark:bg-base-800 border-base-300/50 shadow-xl focus:outline-none focus:border-[#81c784]"
            />

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
