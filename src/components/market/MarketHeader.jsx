export default function MarketHeader() {
  return (
    <div className="px-4 pt-4 space-y-4">

      {/* Top Bar: Location + Logo */}
      <div className="flex items-center justify-between">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm opacity-80">
          📍 <span>Tritih Lor, Jeruklegi</span>
        </div>

        {/* App Logo */}
        <img
          src="./pwa-64x64.png"
          alt="Nebeng"
          className="w-11 h-11 object-cover"
        />
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Cari Outlet atau Produk"
        className="input input-bordered w-full rounded-full"
      />
    </div>
  );
}

