import { useNavigate } from "react-router-dom";
export default function MarketProductCard({ product, categories = [] }) {

  const navigate = useNavigate();

  const status = product?.warung?.status;
  const category = product?.warung?.category;

  const iconByStatus = () => {
    if (status === "kurir") return "🛵";
    if (status === "pembeli") return "🧺";
    return "🏪";
  };

  const keteranganByStatus = () => {
    if (status === "kurir") return "Bisa nitip ke saya";
    if (status === "pembeli" && category === "Jasa") return "Anterin ke sini";
    if (status === "pembeli" && category !== "Jasa") return "Beliin ke sini";
    return "Official";
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="relative h-48 rounded-2xl overflow-hidden shadow-lg group">

      {/* Image */}
      <img
        src={product.image_url}
        alt={product.name}
        className="absolute inset-0 w-full h-full object-cover
                   group-hover:scale-105 transition-transform duration-300"
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t
                      from-black/80 via-black/40 to-transparent" />

      {/* Favorite */}
      <button className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full
                         bg-white/80 backdrop-blur flex items-center justify-center">
        ❤️
      </button>

      {/* Estimation Badge */}
      {/* Category Badge */}
      <div className="absolute top-3 left-3 z-10 text-[10px]
                      px-2 py-0.5 rounded-full bg-black/60 text-white">
        {product.category_name || categories.find((c) => c.id === product.category_id)?.name || "Produk"}
      </div>

      {/* Content */}
      <div className="absolute bottom-0 z-10 p-3 w-full text-white">
        <h3 className="font-bold text-sm leading-tight line-clamp-2">
          {product.name}
        </h3>

        <p className="text-xs opacity-80">
          ⭐ {product.rating || 0} · {product.city} - {product.district}
        </p>

        <p className="font-semibold text-sm">
          ~ Rp {Number(product.estimated_price || 0).toLocaleString("id-ID")}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          {/* Posted By */}
          <div className="flex items-center ps-1 gap-1.5 text-xs text-white/90">
            <div className="w-7 h-7 rounded-full bg-white/80 text-black flex items-center justify-center">
              <span className="text-lg">
                {iconByStatus()}
              </span>
            </div>

            <span className="text-[11px] capitalize">
              {keteranganByStatus()}
            </span>
          </div>

          {/* CTA */}
          {/* <button className="btn btn-xs rounded-full bg-white text-black
                             border-none flex items-center gap-1">
            <span>🧺</span>
            Nitip
          </button> */}
        </div>
      </div>
    </div>
  );
}
