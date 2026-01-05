import React from 'react';
import FloatingLocationInput from '../FloatingLocationInput';

export default function DeliveryModal({ isOpen, onClose, onSend }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-100" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-100 isolate">
        <div className="bg-base-100 rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-base-300 rounded-full" />
          </div>

          <div className="px-6 pt-2 pb-4 text-center">
            <h3 className="text-xl font-bold">Pilih Lokasi Pengantaran</h3>
            <p className="text-sm text-base-content/70 mt-1">Tentukan tempat pengantaran barang</p>
          </div>

          <DeliveryForm onSend={onSend} onClose={onClose} />
        </div>
      </div>
    </>
  );
}

// Form terpisah agar lebih rapi
function DeliveryForm({ onSend, onClose }) {
  const [location, setLocation] = React.useState({
    name: "",
    address: "",
    lat: null,
    lng: null
  });

  const handleSend = () => {
    if (location.lat && location.lng) {
      const message = `[deal_lokasi_pengantaran]\n\n📍 Lokasi pengantaran: ${location.name || "Lokasi Terpilih"}\n📝 Alamat: ${location.address}\n🗺️ Koordinat: ${location.lat}, ${location.lng}\n\nKonfirmasi lokasi pengantaran ya kak? 🙏`;
      onSend(message);
      onClose();
    }
  };
  

  return (
    <>
      <div className="px-6 pb-6">
        <FloatingLocationInput
          label="Lokasi Pengantaran"
          name="delivery"
          value={location}
          onChange={setLocation}
        />

        {location.lat && location.lng && (
          <div className="mt-4 p-4 bg-cyan-50 dark:bg-cyan-900/30 rounded-2xl border border-cyan-200 dark:border-cyan-800">
            <p className="text-sm text-base-content/80 whitespace-pre-wrap">
              📍 Lokasi pengantaran: {location.name || "Lokasi Terpilih"}{'\n'}
              📝 Alamat: ${location.address}{'\n'}
              🗺️ Koordinat: ${location.lat}, ${location.lng}{'\n\n'}
              Konfirmasi lokasi pengantaran ya kak? 🙏
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