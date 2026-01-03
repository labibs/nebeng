import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import SearchControl from '../SearchControl';
import AutoLocate from '../AutoLocate';
import "leaflet/dist/leaflet.css";

// Fix icon marker biar muncul (penting!)
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Override leaflet z-index to prevent conflicts
const style = document.createElement('style');
style.textContent = `
  .leaflet-control-container,
  .leaflet-popup,
  .leaflet-marker-icon,
  .leaflet-marker-shadow,
  .leaflet-control-geosearch,
  .leaflet-control-geosearch form,
  .leaflet-control-geosearch input,
  .leaflet-control-geosearch button,
  .leaflet-container {
    z-index: 0 !important;
  }
`;
document.head.appendChild(style);

export default function LocationModal({ isOpen, onClose, onSend }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[60] isolate">
        <div className="bg-base-100 rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-base-300 rounded-full" />
          </div>

          <div className="px-6 pt-2 pb-4 text-center">
            <h3 className="text-xl font-bold">Pilih Lokasi Ketemuan</h3>
            <p className="text-sm text-base-content/70 mt-1">Tentukan tempat serah terima</p>
          </div>

          <LocationForm onSend={onSend} onClose={onClose} />
        </div>
      </div>
    </>
  );
}

// Form terpisah agar lebih rapi
function LocationForm({ onSend, onClose }) {
  const [location, setLocation] = useState({
    name: "",
    address: "",
    lat: null,
    lng: null
  });

  const handleLocationChange = (newLocation) => {
    console.log("Location changed:", newLocation);
    setLocation(newLocation);
  };

  const handleSend = () => {
    console.log("Handle send called, location:", location);
    if (location.lat && location.lng) {
      const locationName = location.name || "Lokasi Terpilih";
      const locationAddress = location.address || "Alamat tidak tersedia";
      const message = `[deal_lokasi_ketemuan]\n\n📍 Lokasi ketemuan: ${locationName}\n📝 Alamat: ${locationAddress}\n🗺️ Koordinat: ${location.lat}, ${location.lng}\n\nTempat ini cocok untuk serah terima ya kak? 🙏`;
      onSend(message);
      onClose();
    }
  };

  // Reverse Geocode
  const fetchAddress = async (lat, lng) => {
    if (!lat || !lng) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();

      const loc = {
        name: data.name || data.display_name?.split(",")[0] || "Pinned Location",
        address: data.display_name || "",
        lat,
        lng
      };

      setLocation(loc);
    } catch (error) {
      console.error("Error fetching address:", error);
      const fallback = {
        name: "Pinned Location",
        address: "",
        lat,
        lng
      };
      setLocation(fallback);
    }
  };

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        fetchAddress(lat, lng);
      }
    });
    return null;
  };

  return (
    <>
      <div className="px-6 pb-6">
        <div className="text-sm font-medium mb-3">Pilih lokasi di peta:</div>
        
        <div className="relative w-full h-64 rounded-xl overflow-hidden border border-base-300" style={{ zIndex: 1, isolation: 'isolate' }}>
          <div className="absolute inset-0 z-0">
            <MapContainer
              center={[-6.2, 106.816666]} // Jakarta default
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
              attributionControl={false}
            >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            />
            {/* <SearchControl onSelect={handleLocationChange} /> */}
            <AutoLocate onLocationFound={handleLocationChange} />
            <MapClickHandler />
            {location.lat && location.lng && (
              <Marker position={[location.lat, location.lng]} />
            )}
          </MapContainer>
          </div>
        </div>

        {location.lat && location.lng && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-base-content/80 whitespace-pre-wrap">
              📍 Lokasi ketemuan: {location.name || "Lokasi Terpilih"}{'\n'}
              📝 Alamat: {location.address || "Alamat tidak tersedia"}{'\n'}
              🗺️ Koordinat: {location.lat}, {location.lng}{'\n\n'}
              Tempat ini cocok untuk serah terima ya kak? 🙏
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 px-6 pb-8">
        <button onClick={onClose} className="flex-1 btn btn-ghost btn-lg rounded-2xl">
          Batal
        </button>
        <button
          onClick={handleSend}
          disabled={!location.lat || !location.lng}
          className="flex-1 btn btn-primary btn-lg rounded-2xl text-white font-bold shadow-lg disabled:opacity-50"
        >
          Kirim Lokasi
        </button>
      </div>
    </>
  );
}