import { useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"

function LocationMarker({ onPick }) {
  const [position, setPosition] = useState(null)

  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      onPick(e.latlng)
    },
  })

  return position ? <Marker position={position} /> : null
}

export default function LocationPicker({ label, value, onSelect }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchAddress = async ({ lat, lng }) => {
    setLoading(true)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    )
    const data = await res.json()

    onSelect({
      lat,
      lng,
      address: data.display_name,
      name: data.name || data.display_name,
    })

    setLoading(false)
    setOpen(false)
  }

  return (
    <>
      {/* Trigger */}
      <div
        onClick={() => setOpen(true)}
        className="
          p-4 rounded-2xl border cursor-pointer
          bg-white/70 dark:bg-white/5
          hover:border-emerald-400 transition
        "
      >
        <p className="text-xs opacity-60 mb-1">{label}</p>
        <p className="font-medium text-sm">
          {value?.address || "Pilih lokasi dari peta"}
        </p>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div
            className="
              bg-white dark:bg-slate-900
              w-full h-[70vh] rounded-t-3xl
              overflow-hidden
            "
          >
            {/* Header */}
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="font-semibold">Pilih Lokasi</h3>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>

            {/* Map */}
            <MapContainer
              center={[-6.2, 106.8]}
              zoom={13}
              className="h-full w-full"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <LocationMarker
                onPick={(latlng) =>
                  fetchAddress({
                    lat: latlng.lat,
                    lng: latlng.lng,
                  })
                }
              />
            </MapContainer>

            {loading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                Mengambil alamat...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
