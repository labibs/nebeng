import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import SearchControl from "./SearchControl";
import AutoLocate from "./AutoLocate";

export default function FloatingLocationInput({
  label = "Lokasi",
  value,
  onChange
}) {
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState(value || null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const hasCoord = (loc) =>
    loc &&
    typeof loc.lat === "number" &&
    typeof loc.lng === "number" &&
    !isNaN(loc.lat) &&
    !isNaN(loc.lng);

  /* Reverse Geocode */
  const fetchAddress = async (lat, lng) => {
    if (!lat || !lng) return;

    const _lat = Number(lat);
    const _lng = Number(lng);

    try {
      setLoadingAddress(true);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${_lat}&lon=${_lng}`
      );

      const data = await res.json();

      const loc = {
        name: data.name || data.display_name?.split(",")[0] || "Pinned Location",
        address: data.display_name || "",
        lat: _lat,
        lng: _lng
      };

      setLocation(loc);
      console.log("Location updated:", loc);
      onChange?.(loc);
    } catch {
      const fallback = {
        name: "Pinned Location",
        address: "",
        lat: _lat,
        lng: _lng
      };

      setLocation(fallback);
      onChange?.(fallback);
    } finally {
      setLoadingAddress(false);
    }
  };

  

  /* Handle click di peta */
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        fetchAddress(e.latlng.lat, e.latlng.lng);
      }
    });
    return null;
  };

  return (
    <>
      {/* Floating Field */}
      <div
        className="relative border rounded-2xl bg-base-100/60 backdrop-blur p-3 cursor-pointer"
        onClick={() => setShowMap(true)}
      >
        <div className="text-xs text-base-content/60">{label}</div>

        <div className="mt-1 font-medium">
          {hasCoord(location) ? (
            <>
              {location.name} — {location.lat.toFixed(4)},{" "}
              {location.lng.toFixed(4)}
            </>
          ) : (
            "Pilih lokasi di peta"
          )}
        </div>
      </div>

      {/* Modal */}
      {showMap && (
        <dialog className="modal modal-open">
          <div className="modal-box w-95 max-w-3xl">
            <h3 className="font-bold text-lg mb-3">{label}</h3>

            <div className="h-[360px] rounded-2xl overflow-hidden border">
              <MapContainer
                center={
                  hasCoord(location)
                    ? [location.lat, location.lng]
                    : [-6.2, 106.8]  // fallback kalau belum ada lokasi
                }
                zoom={12}
                className="h-full w-full"
              >
                <SearchControl onSelect={setLocation} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {/* Tambahkan ini untuk auto locate saat load */}
                <AutoLocate onLocationFound={setLocation} />

                <MapClickHandler />

                {hasCoord(location) && (
                  <Marker position={[location.lat, location.lng]} />
                )}
              </MapContainer>
            </div>

            {loadingAddress && (
              <div className="mt-3 text-sm opacity-70">
                Mengambil nama & alamat lokasi…
              </div>
            )}

            {hasCoord(location) && !loadingAddress && (
              <div className="mt-3 text-sm">
                <div className="font-semibold">{location.name}</div>
                <div className="opacity-70">{location.address}</div>
              </div>
            )}

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowMap(false)}
              >
                Ambil
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
