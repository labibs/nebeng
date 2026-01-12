export default function MarketHeader() {
  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Location */}
      <div className="flex items-center gap-2 text-sm opacity-80">
        📍 <span>Lokasi saat ini</span>
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
