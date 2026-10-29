import { useState } from "react";
import { Package, Bike, Truck, Car, ArrowRight } from "lucide-react";

export default function PostCard({ msg, isMine, avatar, postInfo }) {
  const [showFullAddress, setShowFullAddress] = useState(false);
  const post = msg.post || {};

  // Helper untuk menentukan icon armada
  const getArmadaIcon = () => {
    const iconSize = 20;
    if (post.type === "titip")
      return <Package size={iconSize} className="text-white" />;
    const armada = post.armada?.toLowerCase();
    if (armada?.includes("motor"))
      return <Bike size={iconSize} className="text-white" />;
    if (armada?.includes("mobil"))
      return <Car size={iconSize} className="text-white" />;
    if (armada?.includes("truk") || armada?.includes("pickup"))
      return <Truck size={iconSize} className="text-white" />;
    return <Bike size={iconSize} className="text-white" />; // Default
  };

  // Helper untuk mengambil nama kota saja (asumsi format: "Kota, Provinsi, ...")
  const getCityOnly = (fullAddress) => {
    if (!fullAddress) return "-";
    // Hilangkan koordinat jika ada
    const cleaned = fullAddress.replace(
      /[-+]?\d*\.\d+,\s*[-+]?\d*\.\d+,\s*/g,
      "",
    );
    const parts = cleaned.split(",");
    return parts[0].trim();
  };

  const fromCity = getCityOnly(post.from_city);
  const toCity = getCityOnly(post.to_city);

  return (
    <div className={`chat ${isMine ? "chat-end " : "chat-start"} `}>
      <div className="chat-image avatar ">
        <div className="w-10 rounded-full ">
          <img src={avatar} alt="avatar" />
        </div>
      </div>

      <div className="chat-header">
        <time className="text-xs opacity-70">
          {new Date(msg.created_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>

      <div
        className={`
          relative max-w-[260px] w-full px-4 py-4 rounded-2xl shadow-2xl overflow-hidden
          bg-white border-2
          ${
            isMine
              ? "border-blue-200 rounded-br-none"
              : "border-slate-200 rounded-bl-none"
          }
        `}
      >
        {/* Header ala Gambar: Icon Lingkaran + Stacked Text */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-md ${post.type === "titip" ? "bg-orange-500" : "bg-blue-500"}`}
          >
            {getArmadaIcon()}
          </div>
          <div className="flex flex-col">
            <h3 className="font-black text-slate-800 text-[15px] leading-tight uppercase tracking-tight">
              {post.type === "titip" ? "Mau Titip" : "Bisa Bawa"}
            </h3>
            <p className="text-xs font-bold text-emerald-600 mt-0.5">
              Ongkos: Rp
              {post.fee ? parseInt(post.fee).toLocaleString("id-ID") : "-"}
            </p>
          </div>
        </div>

        {/* Gambar Barang - Full Width */}
        <div className="w-full h-36 rounded-2xl overflow-hidden mb-3 bg-slate-50 border border-slate-100">
          <img
            src={
              post.item_photo ||
              "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&q=80"
            }
            alt="Barang"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info Lokasi - Simplified One Row */}
        <div className="mb-3 px-1">
          <div className="flex items-center gap-2 text-[12px] font-black text-slate-700">
            <span className="truncate">{fromCity}</span>
            <ArrowRight size={12} className="shrink-0 text-blue-500" />
            <span className="truncate">{toCity}</span>
          </div>

          {post.description && (
            <p className="mt-2 text-[11px] text-slate-500 leading-relaxed line-clamp-2 italic">
              "{post.description}"
            </p>
          )}
        </div>

        {/* Toggle Detail */}
        <button
          onClick={() => setShowFullAddress(!showFullAddress)}
          className="w-full py-2 bg-slate-50 rounded-xl text-[9px] text-slate-500 font-bold hover:bg-slate-100 transition-colors uppercase tracking-widest border border-slate-100"
        >
          {showFullAddress ? "Tutup Alamat" : "Detail Alamat"}
        </button>

        {showFullAddress && (
          <div className="mt-3 p-3 bg-slate-50 rounded-xl text-[10px] space-y-2 border border-slate-100 animate-in fade-in slide-in-from-top-2">
            <div>
              <span className="block font-black text-slate-400 mb-0.5">
                ALAMAT ASAL:
              </span>
              <span className="text-slate-600 leading-tight">
                {post.from_city.replace(
                  /[-+]?\d*\.\d+,\s*[-+]?\d*\.\d+,\s*/g,
                  "",
                )}
              </span>
            </div>
            <div>
              <span className="block font-black text-slate-400 mb-0.5">
                ALAMAT TUJUAN:
              </span>
              <span className="text-slate-600 leading-tight">
                {post.to_city.replace(
                  /[-+]?\d*\.\d+,\s*[-+]?\d*\.\d+,\s*/g,
                  "",
                )}
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-50">
          <p className="text-[11px] text-center text-slate-400 italic leading-relaxed">
            "{msg.content || "Saya tertarik dengan penawaran ini."}"
          </p>
        </div>

        {/* Tail lancip */}
        <div
          className={`absolute w-3 h-5 top-6 ${isMine ? "right-0 translate-x-full" : "left-0 -translate-x-full"}`}
        >
          <svg viewBox="0 0 8 16" className="w-full h-full drop-shadow-md">
            <path
              d="M0,0 Q8,8 0,16 L0,0"
              fill={isMine ? "#bfdbfe" : "#e2e8f0"}
            />
          </svg>
        </div>
      </div>
      {isMine && (
        <div
          className={`chat-footer text-xs mt-0 ${msg.is_read ? "text-blue-500" : "opacity-70"}`}
        >
          {msg.is_read ? "Terbaca ✓✓" : "Terkirim ✓"}
        </div>
      )}
    </div>
  );
}
