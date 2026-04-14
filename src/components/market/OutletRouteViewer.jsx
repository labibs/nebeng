import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [points]);

  return null;
}

export default function OutletRouteViewer({
  open,
  setOpen,
  outletId,
  customRoute,
}) {
  const [route, setRoute] = useState(null);
  const [outlet, setOutlet] = useState(null);
  const [loading, setLoading] = useState(false);

  // ===== AMBIL DATA OUTLET =====
  useEffect(() => {
    if (!open) return;

    // Kalau ada customRoute, pakai itu langsung
    if (customRoute) {
      setOutlet({
        name: `${customRoute.from_city || "Asal"} → ${customRoute.to_city || "Tujuan"}`,
        address: `Rute perjalanan`,
        from_lat: customRoute.from_lat,
        from_lng: customRoute.from_lng,
        to_lat: customRoute.to_lat,
        to_lng: customRoute.to_lng,
      });
      getRoute(customRoute);
      return;
    }

    if (!outletId) return;

    const fetchOutlet = async () => {
      const { data } = await supabase
        .from("warungs")
        .select("*")
        .eq("id", outletId)
        .single();

      setOutlet(data);

      // kalau ada rute → ambil dari OSRM
      if (data?.from_lat && data?.to_lat) {
        getRoute(data);
      }
    };

    fetchOutlet();
  }, [outletId, open, customRoute]);

  // ===== AMBIL RUTE DARI OSRM =====
  const getRoute = async (o) => {
    setLoading(true);

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${o.from_lng},${o.from_lat};${o.to_lng},${o.to_lat}` +
      `?overview=full&geometries=geojson`;

    const res = await fetch(url);
    const json = await res.json();

    const coords = json.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);

    setRoute(coords);
    setLoading(false);
  };

  const startPoint = outlet?.from_lat
    ? [outlet.from_lat, outlet.from_lng]
    : null;

  const endPoint = outlet?.to_lat ? [outlet.to_lat, outlet.to_lng] : null;

  const points = [startPoint, endPoint].filter(Boolean);

  // ===== RENDER =====
  return (
    <div
      className={`
        fixed inset-0 z-[11000]
        bg-gradient-to-br from-green-100 to-emerald-200
        dark:from-slate-900 dark:to-slate-800
        transition-transform duration-300 ease-out
        ${open ? "translate-x-0" : "translate-x-full"}
      `}
    >
      <div className="h-full flex flex-col pt-12 pb-20">
        {/* HEADER */}
        <div className="shrink-0">
          <div className="flex items-start gap-3 mb-2 px-4 pb-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              className="bg-white rounded-full p-3 shadow-lg text-black active:scale-95 transition-all hover:bg-slate-50"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex flex-col">
              <h3 className="text-base font-semibold leading-tight">Rute</h3>

              <p className="text-xs opacity-70">Jalur yang akan dilewati</p>
            </div>
          </div>
        </div>

        {/* MAP */}
        <div className="flex-1 relative bg-white border-y">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-[11001] bg-white/50 backdrop-blur-sm">
              <div className="bg-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#4e73df] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Memuat rute...</span>
              </div>
            </div>
          )}

          <MapContainer
            center={startPoint || [-7.5, 109.2]}
            zoom={13}
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {startPoint && <Marker position={startPoint} />}

            {endPoint && <Marker position={endPoint} />}

            {route && (
              <Polyline
                positions={route}
                pathOptions={{
                  color: "#4e73df",
                  weight: 5,
                  opacity: 0.8,
                }}
              />
            )}

            <FitBounds points={points} />
          </MapContainer>
        </div>

        {/* INFO */}
        {outlet && (
          <div className="shrink-0 p-4 bg-white/95 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#4e73df]" />
              <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight">
                Detail Rute
              </h4>
            </div>
            <p className="font-semibold text-xs text-slate-700 leading-snug">
              {outlet.name}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">{outlet.address}</p>
          </div>
        )}
      </div>
    </div>
  );
}
