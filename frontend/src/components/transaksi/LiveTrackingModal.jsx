import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import { X } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";
import { parseLocation } from "../../lib/parseLocation";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function LiveTrackingModal({ open, onClose, deal }) {
  const [courierPos, setCourierPos] = useState(null);

  const courierIcon = L.icon({
    iconUrl: "/icons/motorr.png", // taruh di public/icons
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
 });

  const pickup = parseLocation(deal.pickup_location);
  const delivery = parseLocation(deal.delivery_location);

  const POLL_INTERVAL = 5000;
  useEffect(() => {
    if (!open || deal.delivery_status !== "running") return;

    const fetchLiveLocation = async () => {
      try {
        const data = await apiFetch(`/deals/${deal.id}/live-location`);
        if (data && data.lat && data.lng) {
          setCourierPos({
            lat: data.lat,
            lng: data.lng,
          });
        }
      } catch (error) {
        console.error("Fetch live location error:", error);
      }
    };

    fetchLiveLocation();
    const interval = setInterval(fetchLiveLocation, POLL_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [open, deal.id, deal.delivery_status]);

  useEffect(() => {
    if (!open || !deal?.id) return;

    const fetchLastPosition = async () => {
      try {
        const data = await apiFetch(`/deals/${deal.id}/live-location`);
        if (data && data.lat && data.lng) {
          setCourierPos({
            lat: data.lat,
            lng: data.lng,
          });
        }
      } catch (error) {
        console.error("Fetch last position error:", error);
      }
    };

    fetchLastPosition();
  }, [open, deal?.id]);


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-base-100 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Live Tracking Pengantaran</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle">
            <X size={16} />
          </button>
        </div>

        {/* Map */}
        <div className="h-[420px]">
          <MapContainer
            center={[pickup.lat, pickup.lng]}
            zoom={13}
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Pickup */}
            <Marker position={[pickup.lat, pickup.lng]} />

            {/* Delivery */}
            <Marker position={[delivery.lat, delivery.lng]} />

            {/* Route Line */}
            <Polyline
              positions={[
                [pickup.lat, pickup.lng],
                [delivery.lat, delivery.lng],
              ]}
              pathOptions={{ color: "blue" }}
            />

            {/* Courier */}
            {courierPos && (
            <Marker
                position={[courierPos.lat, courierPos.lng]}
                icon={courierIcon}
            />
            )}

          </MapContainer>
        </div>

        {/* Footer info */}
        <div className="p-4 text-sm space-y-1">
          <p>
            📍 <b>Pickup:</b> {pickup.address}
          </p>
          <p>
            🏁 <b>Tujuan:</b> {delivery.address}
          </p>
          {courierPos ? (
            <p className="text-emerald-600">
              🛵 Kurir sedang menuju lokasi tujuan
            </p>
          ) : (
            <p className="opacity-60">Menunggu lokasi kurir…</p>
          )}
        </div>
      </div>
    </div>
  );
}
