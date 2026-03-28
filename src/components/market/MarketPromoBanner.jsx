export default function MarketPromoBanner() {
  return (
    <div className="px-4 mt-4 mb-2">
      <div className="rounded-3xl p-5 flex justify-between items-center text-white 
        bg-gradient-to-br from-green-600 via-emerald-500 to-teal-500 shadow-lg"
      >
        {/* Text */}
        <div className="max-w-[70%]">
          <h3 className="font-bold text-md leading-tight">
            Lagi nggak sempat keluar?
          </h3>
          <p className="text-sm opacity-90">
            Ada orang lewat, bisa nitip beliin.
          </p>

          <button className="btn btn-sm mt-3 bg-white text-green-700 hover:bg-white/90 border-none rounded-full">
            Coba nitip beliin sekarang
          </button>
        </div>

        {/* Image */}
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center">
          <img
            src="/nitip.png"
            alt="Nebeng"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
