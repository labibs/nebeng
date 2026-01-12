export default function MarketProductCard() {
  return (
    <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg group">

      {/* Background Image */}
      <img
        src="https://puncatraining.id/wp-content/uploads/2023/06/feate-jajanan-tradisional-768x400.jpeg"
        alt="Produk warung"
        className="absolute inset-0 w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-300"
      />

      {/* Gradient Mask */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent dark:from-black/90" />

      {/* Favorite */}
      <button className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur flex items-center justify-center text-sm">
        ❤️
      </button>

      {/* Content */}
      <div className="absolute bottom-0 z-10 p-3 w-full text-white">
        <h3 className="font-bold text-sm leading-tight">
          Jajanan Warung
        </h3>

        <p className="text-xs opacity-80">
          ⭐ 4.7 · Cilacap - Jeruklegi
        </p>
        <p className="font-semibold text-sm">
            ~ Rp 10.000
          </p>
        <div className="mt-2 flex items-center justify-between gap-2">

        {/* Posted By */}
        <div className="flex items-center gap-1.5 text-xs text-white/90">
                <div className="w-7 h-7 rounded-full bg-white/80 text-black flex items-center justify-center text-[10px]">
                <div className="w-8 h-8 text-lg">🛵</div>

                </div>
                <span className="text-[11px]">Kurir</span>
            </div>

            {/* CTA */}
            <button className="btn btn-xs rounded-full bg-white text-black hover:bg-white/90 border-none flex items-center gap-1">
                <span className="text-sm">🧺</span>
                Nitip
            </button>
        </div>

      </div>

      {/* Estimation Badge */}
      <div className="absolute top-3 left-3 z-10 text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur">
        Estimasi
      </div>
    </div>
  );
}

