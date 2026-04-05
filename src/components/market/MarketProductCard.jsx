import { Star, User, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MarketProductCard({ product }) {
  const navigate = useNavigate();

  const status = product?.warung_status;
  const category = product?.warung_category;
  const ownerAvatar = product?.owner_avatar;

  const keteranganByStatus = () => {
    if (status === "kurir") return "Kurir";
    if (status === "pembeli" && category === "Jasa") return "Butuh Jasa";
    if (status === "pembeli" && category !== "Jasa") return "Titip Beli";
    return "Official";
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="group cursor-pointer overflow-hidden rounded-[28px] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.04)] border border-slate-100 transition-all duration-300 hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] hover:-translate-y-1 flex items-stretch h-[140px]"
    >
      {/* Kolom Kiri: Gambar (Persegi Simetris) */}
      <div className="relative w-[140px] h-[140px] p-2 shrink-0">
        <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-slate-100">
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />

          {/* Badge Kategori (Mini) */}
          <div className="absolute left-2 top-2 rounded-full bg-slate-900/50 px-2 py-0.5 text-[7px] font-black uppercase tracking-widest text-white backdrop-blur-md">
            {product.category_name?.slice(0, 10) || "Item"}
          </div>

          {/* Rating (Mini) */}
          <div className="absolute bottom-2 right-2 rounded-lg bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-slate-800 backdrop-blur-md flex items-center gap-1 shadow-sm">
            <Star size={9} className="fill-amber-400 text-amber-400" />
            {product.rating || "0.0"}
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Konten (Fleksibel) */}
      <div className="flex-1 p-4 pl-1 flex flex-col justify-between overflow-hidden">
        <div className="space-y-0.5">
          {/* Info Outlet */}
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#4e73df] opacity-70 truncate">
            {product.warung_name || "Outlet Nebeng"}
          </p>

          {/* Nama Produk */}
          <h3 className="text-[14px] font-extrabold tracking-tight text-slate-900 line-clamp-2 uppercase leading-tight">
            {product.name}
          </h3>

          {/* Harga & Estimasi (1 Baris) */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[15px] font-black text-slate-900">
              Rp{Number(product.estimated_price || 0).toLocaleString("id-ID")}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter shrink-0">
              / estimasi
            </span>
          </div>
        </div>

        {/* Baris Bawah: Profile + Action */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-hidden">
            {/* Profile Micro Chip */}
            <div className="flex h-7 items-center gap-1 rounded-full border border-slate-100 bg-slate-50 px-1 pr-2 shadow-sm">
              <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-100">
                {ownerAvatar ? (
                  <img
                    src={ownerAvatar}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-500">
                    <User size={8} />
                  </div>
                )}
              </div>
              <span className="text-[9px] font-bold text-slate-600 truncate max-w-[45px]">
                {product.owner_name?.split(" ")[0] || "Owner"}
              </span>
            </div>

            {/* Status Badge (Mini) */}
            <div className="flex items-center rounded-full bg-blue-50 px-2 h-7 border border-blue-100/50">
              <span className="text-[8px] font-black uppercase tracking-tighter text-[#4e73df] whitespace-nowrap leading-none">
                {keteranganByStatus()}
              </span>
            </div>
          </div>

          {/* Action Icon (Minimalis) */}
          <div className="flex shrink-0 pr-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-300 group-hover:bg-[#4e73df] group-hover:text-white transition-all duration-300 shadow-sm border border-slate-100">
              <Heart size={14} strokeWidth={3} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
