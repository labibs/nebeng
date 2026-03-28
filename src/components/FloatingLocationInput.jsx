import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents
} from "react-leaflet";

export default function FloatingLocationInput({
  label = "Lokasi",
  value,
  onChange
}) {
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState(value || null);

  const [loadingAddress, setLoadingAddress] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  /* --------------------------
     Helpers
  -------------------------- */
  const hasCoord = (loc) =>
    loc &&
    typeof loc.lat === "number" &&
    typeof loc.lng === "number" &&
    !isNaN(loc.lat) &&
    !isNaN(loc.lng);

  useEffect(() => {
    if (value && hasCoord(value)) {
      setLocation(value);
      setQuery(value.name || "");
    }
  }, [value]);

  /* --------------------------
     Reverse Geocode
  -------------------------- */
  async function fetchAddress(lat, lng) {
    try {
      setLoadingAddress(true);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );

      const data = await res.json();

      const loc = {
        lat,
        lng,
        name: data.name || data.display_name?.split(",")[0] || "Pinned Location",
        address: data.display_name || ""
      };

      setLocation(loc);
      onChange?.(loc);
      setQuery(loc.name);
    } finally {
      setLoadingAddress(false);
    }
  }

  /* --------------------------
     Search API
  -------------------------- */
  async function searchLocation(text) {
    if (!text.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        text
      )}&limit=5&countrycodes=id`
    );

    const data = await res.json();

    setResults(data);
    setShowResults(data.length > 0);
  }

  function selectResult(item) {
    const loc = {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      name: item.display_name.split(",")[0],
      address: item.display_name
    };

    setLocation(loc);
    onChange?.(loc);
    setQuery(loc.name);
    setShowResults(false);
  }

  /* --------------------------
     Map Click Handler
  -------------------------- */
  function MapClickHandler() {
    useMapEvents({
      click(e) {
        fetchAddress(e.latlng.lat, e.latlng.lng);
      }
    });
    return null;
  }

  /* --------------------------
     Recenter Map on Location Change
  -------------------------- */
  function RecenterOnLocation({ location }) {
    const map = useMap();

    useEffect(() => {
      if (location) {
        map.setView([location.lat, location.lng], 16);
      }
    }, [location, map]);

    return null;
  }

  /* --------------------------
     UI
  -------------------------- */
  return (
    <>
      {/* Floating Field */}
      <div
        className="relative border rounded-2xl bg-base-100/60 backdrop-blur p-3 cursor-pointer"
        onClick={() => setShowMap(true)}
      >
        <div className="text-xs text-base-content/60">{label}</div>

        <div className="mt-1 font-medium">
          {hasCoord(location)
            ? `${location.name} — ${location.lat.toFixed(
                4
              )}, ${location.lng.toFixed(4)}`
            : "Pilih lokasi di peta"}
        </div>
      </div>

      {/* Modal */}
      {showMap && (
        <dialog className="modal modal-open">
          <div className="modal-box w-95 max-w-3xl">

            <h3 className="font-bold text-lg mb-3">{label}</h3>

            {/* Search Box */}
            <div className="relative mb-3 search-container">
              <input
                value={query}
                onChange={(e) => {
                  const text = e.target.value;
                  setQuery(text);
                  searchLocation(text);
                }}
                placeholder="Cari lokasi..."
                className="input input-bordered w-full pr-10"
              />

              {/* Dropdown */}
              {showResults && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-base-100 border border-base-300 rounded-b-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {results.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => selectResult(res)}
                      className="w-full text-left px-4 py-2 hover:bg-base-200 border-b last:border-b-0"
                    >
                      <div className="font-medium text-sm">
                        {res.display_name.split(",")[0]}
                      </div>
                      <div className="text-xs opacity-70 truncate">
                        {res.display_name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map */}
            <div className="h-90 rounded-2xl overflow-hidden border relative">
              <MapContainer
                center={
                  hasCoord(location)
                    ? [location.lat, location.lng]
                    : [-6.2, 106.8]
                }
                zoom={12}
                className="h-full w-full z-0"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <MapClickHandler />

                {hasCoord(location) && (
                  <>
                    <Marker position={[location.lat, location.lng]} />
                    <RecenterOnLocation location={location} />
                  </>
                )}
              </MapContainer>
            </div>

            {/* Address Info */}
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
              <button className="btn btn-ghost" onClick={() => setShowMap(false)}>
                Ambil
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
