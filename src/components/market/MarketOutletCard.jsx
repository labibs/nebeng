import { MapPinned, Heart, Route, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleMapsPointViewer from "../GoogleMapsViewer";
import AddressText from "./AddressText";
import OutletRouteViewer from "./OutletRouteViewer";

export default function MarketOutletCard({ outlet }) {
  const [openRoute, setOpenRoute] = useState(false);
  const [openMaps, setOpenMaps] = useState(false);
  const navigate = useNavigate();

  const { name, id, category, image_url, address, status, owner } = outlet;

  const keteranganByStatus = () => {
    if (status === "kurir") return "Kurir Nitip";
    if (status === "pembeli" && category === "Jasa") return "Butuh Jasa";
    if (status === "pembeli" && category !== "Jasa") return "Titip Beli";
    return "Outlet Resmi";
  };

  return (
    <div className="overflow-hidden rounded-[38px] bg-white shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-slate-100 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
      {/* Container Gambar */}
      <div className="relative p-2 pb-0">
        <div className="relative h-52 overflow-hidden rounded-[32px] bg-slate-100">
          <img
            src={image_url || "https://placehold.co/600x400?text=Outlet"}
            alt={name}
            className="h-full w-full object-cover transition duration-700 hover:scale-110"
          />

          <div className="absolute left-4 top-4 rounded-full bg-slate-900/60 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
            {category || "Outlet"}
          </div>

          <button
            onClick={() => navigate(`/outlet/${id}`)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg backdrop-blur-md transition-all active:scale-90"
          >
            <Heart size={18} fill="currentColor" className="text-pink-500" />
          </button>
        </div>
      </div>

      <div className="p-6 pt-5">
        {/* Nama Toko Full 1 Baris */}
        <div className="mb-2">
          <h3 className="text-xl font-extrabold tracking-tight text-slate-900 line-clamp-1 uppercase">
            {name || "Tanpa Nama Toko"}
          </h3>
        </div>

        {/* Lokasi */}
        <div className="flex items-center gap-2 mb-6 text-slate-500">
          <MapPinned size={14} className="shrink-0 text-emerald-500" />
          <div className="text-[13px] font-medium line-clamp-1">
            <AddressText address={address} onClick={() => setOpenMaps(true)} />
          </div>
        </div>

        {/* Baris Bawah: Profile + Badge (Kiri) & Button Icon (Kanan) */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            {/* Profile Chip */}
            <div className="flex h-9 items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-1.5 pr-3 shadow-sm">
              <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200">
                {owner?.avatar_url ? (
                  <img
                    src={owner.avatar_url}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-500">
                    <User size={10} />
                  </div>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-700 truncate max-w-[70px]">
                {owner?.name?.split(" ")[0] || "Owner"}
              </span>
            </div>
            {/* Badge Status di sebelah Profile */}
            <div className="flex items-center rounded-full bg-blue-50 px-3 h-9 border border-blue-100/50">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#4e73df] whitespace-nowrap leading-none">
                {keteranganByStatus()}
              </span>
            </div>{" "}
          </div>

          {/* Action Button (Kanan - Hanya Icon) */}
          <div className="flex shrink-0">
            {status !== "milik" ? (
              <button
                onClick={() => setOpenRoute(true)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-200 transition-all active:scale-90 hover:bg-slate-800"
              >
                <Route size={20} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                onClick={() => setOpenMaps(true)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#4e73df] text-white shadow-lg shadow-blue-100 transition-all active:scale-90 hover:bg-[#3b59bd]"
              >
                <MapPinned size={20} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      <OutletRouteViewer
        open={openRoute}
        setOpen={setOpenRoute}
        outletId={outlet.id}
      />
      <GoogleMapsPointViewer
        open={openMaps}
        setOpen={setOpenMaps}
        latitude={outlet.latitude}
        longitude={outlet.longitude}
        address={outlet.address}
        title={outlet.name}
      />
    </div>
  );
}
