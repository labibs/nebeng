import { useEffect, useState } from "react";
import { X, MapPin } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";
import { motion, AnimatePresence } from "framer-motion";

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
    if (map && points && points.length > 1) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40] });
      } catch (err) {
        console.warn(err);
      }
    }
  }, [points, map]);

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
      try {
        const data = await apiFetch(`/warungs/${outletId}`);
        setOutlet(data);
        if (data?.from_lat && data?.to_lat) {
          getRoute(data);
        }
      } catch (error) {
        console.error("Error fetching outlet:", error);
      }
    };

    fetchOutlet();
  }, [outletId, open, customRoute]);

  const getRoute = async (o) => {
    setLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${o.from_lng},${o.from_lat};${o.to_lng},${o.to_lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.routes?.[0]) {
        const coords = json.routes[0].geometry.coordinates.map((c) => [
          c[1],
          c[0],
        ]);
        setRoute(coords);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startPoint = outlet?.from_lat
    ? [outlet.from_lat, outlet.from_lng]
    : null;
  const endPoint = outlet?.to_lat ? [outlet.to_lat, outlet.to_lng] : null;
  const points = [startPoint, endPoint].filter(Boolean);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg rounded-[32px] bg-white overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-5 flex items-center justify-between border-b border-slate-50 bg-white/80 backdrop-blur-md z-10">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Preview Rute
                </h3>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Jalur Perjalanan
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-90 transition-transform"
              >
                <X size={18} />
              </button>
            </div>

            {/* Map Container */}
            <div className="h-[45vh] w-full relative bg-slate-50">
              {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                  <div className="w-8 h-8 border-3 border-[#4e73df] border-t-transparent rounded-full animate-spin" />
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
                    pathOptions={{ color: "#4e73df", weight: 5, opacity: 0.8 }}
                  />
                )}
                <FitBounds points={points} />
              </MapContainer>
            </div>

            {/* Info Footer */}
            {outlet && (
              <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#4e73df] flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                    <MapPin size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-[15px] text-slate-900 truncate">
                      {outlet.name}
                    </h4>
                    <p className="text-[12px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                      {outlet.address}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
