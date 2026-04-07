import { MapPinned, Heart, Route, Star, User } from "lucide-react";
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
    if (status === "kurir") return "Bisa nitip";
    if (status === "pembeli" && category === "Jasa") return "Butuh Jasa";
    if (status === "pembeli" && category !== "Jasa") return "Nitip beliin";
    return "Outlet resmi";
  };

  const promoLabel =
    category === "Makanan"
      ? "Promo ongkir"
      : category === "Jasa"
        ? "Diskon jasa"
        : "Promo hari ini";

  return (
    <div
      onClick={() => navigate(`/outlet/${id}`)}
      className="overflow-hidden rounded-[26px] border border-slate-100 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_18px_42px_rgba(0,0,0,0.1)] cursor-pointer"
    >
      <div className="relative p-2 pb-0">
        <div className="relative h-36 overflow-hidden rounded-[20px] bg-slate-100">
          <img
            src={image_url || "https://placehold.co/600x400?text=Outlet"}
            alt={name}
            className="h-full w-full object-cover transition duration-700 hover:scale-110"
          />

          <div className="absolute left-2.5 top-2.5 rounded-full bg-slate-900/60 px-2.5 py-1 text-[9px] font-medium text-white backdrop-blur-md">
            {category || "Outlet"}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/outlet/${id}`);
            }}
            className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg backdrop-blur-md transition-all active:scale-90"
          >
            <Heart size={14} fill="currentColor" className="text-pink-500" />
          </button>
        </div>
      </div>

      <div className="p-4 pt-3.5">
        <div className="mb-1.5">
          <h3 className="line-clamp-1 text-[16px] font-semibold tracking-tight text-slate-900">
            {name || "Tanpa Nama Toko"}
          </h3>
        </div>

        <div className="mb-2.5 flex items-center gap-1.5 text-slate-500">
          <MapPinned size={12} className="shrink-0 text-emerald-500" />
          <div className="line-clamp-1 text-[11px] font-medium">
            <AddressText
              address={address}
              onClick={(e) => {
                e.stopPropagation();
                setOpenMaps(true);
              }}
            />
          </div>
        </div>

        <div className="mb-4 flex items-center gap-1.5 overflow-hidden">
          <div className="flex h-6 items-center rounded-full border border-amber-100 bg-amber-50 px-2">
            <span className="text-[8px] font-medium leading-none text-amber-700">
              {promoLabel}
            </span>
          </div>
          <div className="flex h-6 items-center rounded-full border border-slate-100 bg-slate-50 px-2">
            <span className="truncate text-[8px] font-medium leading-none text-slate-500">
              Hemat 10%
            </span>
          </div>
          <div className="ml-auto flex h-6 items-center gap-1 rounded-full border border-slate-100 bg-white px-2 text-[8px] font-semibold text-slate-700 shadow-sm">
            <Star size={8} className="fill-amber-400 text-amber-400" />
            {outlet.rating || "0.0"}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="flex h-7 items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-1.5 pr-2 shadow-sm">
              <div className="h-4.5 w-4.5 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200">
                {owner?.avatar_url ? (
                  <img
                    src={owner.avatar_url}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-500">
                    <User size={8} />
                  </div>
                )}
              </div>
              <span className="max-w-[56px] truncate text-[9px] font-medium text-slate-700">
                {owner?.name?.split(" ")[0] || "Owner"}
              </span>
            </div>
            <div className="flex h-7 items-center rounded-full border border-blue-100/50 bg-blue-50 px-2">
              <span className="whitespace-nowrap text-[8px] font-medium leading-none text-[#4e73df]">
                {keteranganByStatus()}
              </span>
            </div>
          </div>

          <div className="flex shrink-0">
            {status !== "milik" ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenRoute(true);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100/60 bg-blue-50 text-[#4e73df] shadow-sm shadow-blue-100/50 transition-all active:scale-90 hover:bg-blue-100"
              >
                <Route size={16} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMaps(true);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100/60 bg-blue-50 text-[#4e73df] shadow-sm shadow-blue-100/50 transition-all active:scale-90 hover:bg-blue-100"
              >
                <MapPinned size={16} strokeWidth={2.5} />
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
