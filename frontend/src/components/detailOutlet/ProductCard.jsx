export default function OutletProductCard({ product }) {
  return (
    <div className="relative h-48 rounded-2xl overflow-hidden shadow-md group">

      {/* Background Image */}
      <img
        src={
          product.image_url ||
          "https://puncatraining.id/wp-content/uploads/2023/06/feate-jajanan-tradisional-768x400.jpeg"
        }
        alt={product.name}
        className="
          absolute inset-0 w-full h-full object-cover
          scale-100 group-hover:scale-105
          transition-transform duration-300
        "
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Edit / Action */}
      <button
        className="
          absolute top-3 right-3 z-10
          w-8 h-8 rounded-full
          bg-white/80 backdrop-blur
          flex items-center justify-center
          text-sm
        "
      >
        ✏️
      </button>

      {/* Content */}
      <div className="absolute bottom-0 z-10 p-3 w-full text-white">
        <h3 className="font-bold text-sm leading-tight line-clamp-2">
          {product.name}
        </h3>

        <p className="text-xs opacity-80">
          Produk Outlet
        </p>

        <p className="font-semibold text-sm">
          ~ Rp {product.estimated_price?.toLocaleString("id-ID")}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="text-[11px] opacity-80">
            Stok tersedia
          </div>

          <button className="btn btn-xs rounded-full bg-white text-black border-none">
            Edit
          </button>
        </div>
      </div>

      {/* Badge */}
      <div className="absolute top-3 left-3 z-10 text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur">
        Produk
      </div>
    </div>
  );
}
