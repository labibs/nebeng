import React from "react";
import { X, MapPin } from "lucide-react";
import FloatingLocationInput from "../FloatingLocationInput";

export default function LocationModal({ isOpen, onClose, onSend }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[200]" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[200] isolate">
        <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 pb-2 flex items-center justify-between flex-shrink-0">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <MapPin size={20} />
              Pilih Lokasi Ketemuan
            </h3>
            <button
              onClick={onClose}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <LocationForm onSend={onSend} onClose={onClose} />
        </div>
      </div>
    </>
  );
}

// Form terpisah agar lebih rapi
function LocationForm({ onSend, onClose }) {
  const [location, setLocation] = React.useState({
    name: "",
    address: "",
    lat: null,
    lng: null,
  });

  const handleSend = () => {
    if (location.lat && location.lng) {
      const message = `[deal_lokasi_ketemuan]\n\n📍 Lokasi ketemuan: ${location.name || "Lokasi Terpilih"}\n📝 Alamat: ${location.address}\n🗺️ Koordinat: ${location.lat}, ${location.lng}\n\nKonfirmasi lokasi penjemputan titipan ya kak? 🙏`;
      onSend(message);
      onClose();
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <FloatingLocationInput
          label="Lokasi Ketemuan"
          name="location"
          value={location}
          onChange={setLocation}
        />

        {location.lat && location.lng && (
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-sm text-blue-700 whitespace-pre-wrap">
              📍 Lokasi ketemuan: {location.name || "Lokasi Terpilih"}
              {"\n"}
              📝 Alamat: ${location.address}
              {"\n"}
              🗺️ Koordinat: ${location.lat}, ${location.lng}
              {"\n\n"}
              Konfirmasi lokasi penjemputan titipan ya kak? 🙏
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 flex-shrink-0 bg-white pb-8">
        <button
          onClick={handleSend}
          disabled={!location.lat || !location.lng}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4e73df] text-white py-3 text-[13px] font-semibold hover:bg-[#3d64c7] transition-colors shadow-sm disabled:opacity-50"
        >
          Kirim Lokasi
        </button>
      </div>
    </>
  );
}
