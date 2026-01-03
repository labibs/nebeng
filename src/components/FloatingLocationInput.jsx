import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import AutoLocate from "./AutoLocate";

export default function FloatingLocationInput({
  label = "Lokasi",
  value,
  onChange
}) {
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState(value || null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const hasCoord = (loc) =>
    loc &&
    typeof loc.lat === "number" &&
    typeof loc.lng === "number" &&
    !isNaN(loc.lat) &&
    !isNaN(loc.lng);

  // Update location when value prop changes
  useEffect(() => {
    if (value && hasCoord(value)) {
      setLocation(value);
      setSearchQuery(value.name || "");
    }
  }, [value]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowResults(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
      setSearchQuery(loc.name || "");
    } catch {
      const fallback = {
        name: "Pinned Location",
        address: "",
        lat: _lat,
        lng: _lng
      };

      setLocation(fallback);
      onChange?.(fallback);
      setSearchQuery(fallback.name || "");
    } finally {
      setLoadingAddress(false);
    }
  };

  /* Search functionality */
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=id`
      );
      const data = await res.json();
      setSearchResults(data);
      setShowResults(data.length > 0);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    const loc = {
      lat,
      lng,
      name: result.display_name.split(",")[0].trim() || result.display_name,
      address: result.display_name,
    };

    setLocation(loc);
    onChange?.(loc);
    setSearchQuery(loc.name);
    setShowResults(false);
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

            {/* Search Input - Di atas map */}
            <div className="relative mb-3 search-container">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  handleSearch(value);
                }}
                placeholder="Cari lokasi..."
                className="input input-bordered w-full pr-10"
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              {/* Search Results */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-base-100 border border-base-300 rounded-b-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => selectSearchResult(result)}
                      className="w-full text-left px-4 py-2 hover:bg-base-200 border-b border-base-200 last:border-b-0"
                    >
                      <div className="font-medium text-sm">{result.display_name.split(",")[0]}</div>
                      <div className="text-xs text-base-content/70 truncate">{result.display_name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-90 rounded-2xl overflow-hidden border">
              <MapContainer
                center={
                  hasCoord(location)
                    ? [location.lat, location.lng]
                    : [-6.2, 106.8]  // fallback kalau belum ada lokasi
                }
                zoom={12}
                className="h-full w-full"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {/* Tambahkan ini untuk auto locate saat load */}
                <AutoLocate onLocationFound={(loc) => {
                  setLocation(loc);
                  onChange?.(loc);
                  setSearchQuery(loc.name || "");
                }} />

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
