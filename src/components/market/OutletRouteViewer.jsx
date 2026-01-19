import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap
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

export default function OutletRouteViewer({ open, setOpen, outletId }) {

  const [route, setRoute] = useState(null);
  const [outlet, setOutlet] = useState(null);
  const [loading, setLoading] = useState(false);

  // ===== AMBIL DATA OUTLET =====
  useEffect(() => {
    if (!outletId || !open) return;

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
  }, [outletId, open]);

  // ===== AMBIL RUTE DARI OSRM =====
  const getRoute = async (o) => {
    setLoading(true);

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${o.from_lng},${o.from_lat};${o.to_lng},${o.to_lat}` +
      `?overview=full&geometries=geojson`;

    const res = await fetch(url);
    const json = await res.json();

    const coords = json.routes[0].geometry.coordinates.map(c => [
      c[1],
      c[0],
    ]);

    setRoute(coords);
    setLoading(false);
  };

  const startPoint =
    outlet?.from_lat
      ? [outlet.from_lat, outlet.from_lng]
      : null;

  const endPoint =
    outlet?.to_lat
      ? [outlet.to_lat, outlet.to_lng]
      : null;

  const points = [startPoint, endPoint].filter(Boolean);

  // ===== RENDER =====
  return (
    <div
      className={`
        fixed inset-0 z-[9999]
        bg-gradient-to-br from-green-100 to-emerald-200
        dark:from-slate-900 dark:to-slate-800
        transition-transform duration-300 ease-out
        ${open ? "translate-x-0" : "translate-x-full"}
      `}
    >

      <div className="fixed inset-0 flex flex-col">

        {/* HEADER */}
        <div className="shrink-0">
          <div className="pointer-events-auto flex items-start gap-3 mb-2 pt-6 px-4 pb-2">
            <button
              onClick={() => setOpen(false)}
              className="bg-white rounded-full p-3 shadow-lg text-black"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex flex-col">
              <h3 className="text-base font-semibold leading-tight">
                Rute 
              </h3>

              <p className="text-xs opacity-70">
                Jalur yang akan dilewati 
              </p>
            </div>
          </div>
        </div>

        {/* MAP */}
        <div className="flex-1">

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
              <div className="bg-white px-4 py-2 rounded-xl shadow">
                Memuat rute...
              </div>
            </div>
          )}

          <MapContainer
            center={startPoint || [-7.5, 109.2]}
            zoom={13}
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {startPoint && (
              <Marker position={startPoint} />
            )}

            {endPoint && (
              <Marker position={endPoint} />
            )}

            {route && (
              <Polyline
                positions={route}
                pathOptions={{
                  color: "blue",
                  weight: 4,
                }}
              />
            )}

            <FitBounds points={points} />
          </MapContainer>
        </div>

        {/* INFO */}
        {outlet && (
          <div className="shrink-0 p-4 bg-white/80 backdrop-blur">
            <h4 className="font-semibold">
              {outlet.name}
            </h4>

            <p className="text-xs opacity-70">
              {outlet.address}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
