import { useState } from "react";
import { Route } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import GoogleMapsPointViewer from "../GoogleMapsViewer";
import AddressText from "./AddressText";
import OutletRouteViewer from "./OutletRouteViewer";

export default function MarketOutletCard({ outlet }) {
  const [openRoute, setOpenRoute] = useState(false);
  const [openMaps, setOpenMaps] = useState(false);
  const navigate = useNavigate();
  const onBack = () => navigate(-1);
  const location = useLocation();
  const isOutletPage = location.pathname === "/outlet";

  const {
    name,
    id,
    category,
    image_url,
    address,
    status,
    owner,
    latitude,
    longitude
  } = outlet;

  // console.log("Outlet di MarketOutletCard:", outlet);

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
    <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg group">

      <img
        src={
          image_url ||
          "https://placehold.co/600x400?text=Outlet"
        }
        alt={name}
        className="absolute inset-0 w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-300"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent dark:from-black/90" />

      <div className="relative">
        {/* badge kiri */}
        <div className="absolute top-3 left-3 z-10 text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur capitalize">
          {category || "Makanan"}
        </div>

        {/* menu kanan */}
        {/* {isOutletPage && (
          <OutletActionMenu
            onEdit={() => navigate(`/outlet/${id}/edit`)}
            onDelete={() => handleDeleteOutlet(id)}
          />
        )} */}
          
      </div>


      <div className="absolute bottom-0 z-10 p-3 w-full text-white">
        <div className="flex items-center gap-1 cursor-pointer " >
          <div
              onClick={() => navigate(`/outlet/${id}`)}
              className="
                w-9 h-9
                rounded-full
                bg-black/60
                text-white
                backdrop-blur
                flex items-center justify-center
                font-bold
                overflow-hidden
                cursor-pointer
                active:scale-95
                transition
              "
            >
              {owner?.avatar_url ? (
                <img
                  src={owner?.avatar_url}
                  alt="Avatar Pemilik"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="capitalize">
                  {owner?.full_name?.charAt(0) || "?"}
                </span>
              )}
            </div>
          <div className="flex-1">
            <h3
              className={`
                font-bold text-sm leading-tightcursor-pointer hover:underline
              `}
              onClick={() => {
              navigate(`/outlet/${id}`);
            
          }}
            >
              {name || "Tanpa Nama"}
            </h3>
            {address && (
              <AddressText address={address} onClick={() => setOpenMaps(true)} />

            )}
            </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">

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

          {/* ===== BUTTON MAPS ===== */}
          {status !== 'milik' && (
            <button
                onClick={() => setOpenRoute(true)}
                className="btn btn-xs rounded-full bg-white text-black flex items-center gap-1 px-2.5"
            >
                <Route size={14} className="opacity-80" />
                <span>Rute</span>
            </button>
            )}


          

        {status === 'milik' && (<button
            onClick={() => setOpenMaps(true)}
            className="btn btn-xs rounded-full bg-white text-black flex items-center gap-1"
            >
            <span className="text-sm">📍</span>
            Maps
            </button>
            )}
            

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

