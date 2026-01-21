export default function OutletInfoCard() {
  return (
    <div className="rounded-2xl overflow-hidden border">
      <img
        src="https://images.unsplash.com/photo-1521412644187-c49fa049e84d"
        alt="Outlet Banner"
        className="w-full h-40 object-cover"
      />

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white font-bold">
            N
          </div>
          <div className="flex-1">
            <p className="font-semibold">Nike</p>
            <p className="text-xs opacity-60">Online & In-store</p>
          </div>
          <button className="btn btn-sm btn-outline">Visit Website</button>
        </div>

        <div className="flex items-center justify-between bg-purple-100 rounded-xl p-3">
          <p className="text-sm">Free shipping for members on orders $50+</p>
          <button className="btn btn-xs btn-primary">Get Code</button>
        </div>
      </div>
    </div>
  );
}