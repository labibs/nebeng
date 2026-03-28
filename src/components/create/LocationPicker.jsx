import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, ZoomControl, useMap } from "react-leaflet"
import { ArrowLeft } from "lucide-react";
import L from "leaflet"

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function PickableMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
    },
  })

  if (!position) return null

  return (
    <Marker
      position={position}
      icon={markerIcon}
      draggable
      eventHandlers={{
        dragend: (e) => {
          setPosition(e.target.getLatLng())
        },
      }}
    />
  )
}

export default function LocationPicker({ label, value, onSelect }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      if (value) {
        setPosition(value)
      } else if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setPosition({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            })
          },
          (err) => console.error("Error getting location for map center:", err)
        )
      }
    }
  }, [open, value])

  const searchLocation = async (q) => {
    setQuery(q)
    if (q.length < 3) return

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${q}`
    )
    const data = await res.json()
    setResults(data)
  }

  const confirmLocation = async () => {
    if (!position) return
    setLoading(true)

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`
    )
    const data = await res.json()

    onSelect({
      lat: position.lat,
      lng: position.lng,
      address: data.display_name,
      name: data.name || data.display_name,
    })

    setLoading(false)
    setOpen(false)
  }

  function MapAutoFocus({ position }) {
    const map = useMap()

    if (!position) return null

    map.setView(position, map.getZoom(), {
      animate: true,
    })

    return null
  }

  return (
    <>
      {/* Trigger */}
      <div
        onClick={() => setOpen(true)}
        className="p-4 rounded-2xl border cursor-pointer bg-white/70 dark:bg-white/5"
      >
        <p className="text-xs opacity-60">{label}</p>
        <p className="font-medium text-sm">
          {value?.address || "Pilih lokasi dari peta"}
        </p>
      </div>

      {/* Slide Page */}
      <div
        className={`
          fixed inset-0 z-[9999] bg-white dark:bg-slate-900
          transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* MAP */}
        <MapContainer
          center={[-6.2, 106.8]}
          zoom={13}
          zoomControl={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomControl position="bottomright" />

          <PickableMarker position={position} setPosition={setPosition} />
          <MapAutoFocus position={position} />

        </MapContainer>


        {/* OVERLAY UI (FIXED & SAFE) */}
        <div className="pointer-events-none fixed inset-0 z-[10000]">
          {/* HEADER */}
          <div className="pointer-events-auto absolute top-4 left-4 right-4 flex items-center gap-3">
            <button
              onClick={() => setOpen(false)}
              className="bg-white rounded-full p-3 shadow-lg text-black text-lg"
            >
              <ArrowLeft />
            </button>

            <input
              value={query}
              onChange={(e) => searchLocation(e.target.value)}
              placeholder="Cari lokasi..."
              className="flex-1 px-5 py-3 rounded-full bg-white shadow-lg text-black placeholder:text-gray-500 focus:outline-none"
            />
          </div>

          {/* RESULTS */}
          {results.length > 0 && (
            <div className="pointer-events-auto absolute top-20 left-4 right-4 bg-white rounded-2xl shadow-xl max-h-64 overflow-auto">
              {results.map((r) => (
                <button
                  key={r.place_id}
                  onClick={() => {
                    setPosition({ lat: +r.lat, lng: +r.lon })
                    setResults([])
                  }}
                  className="block w-full text-left px-4 py-3 text-black text-sm hover:bg-gray-100"
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}

          {/* CONFIRM */}
          {position && (
            <div className="pointer-events-auto absolute bottom-20 left-0 right-0 px-4">
              <button
                onClick={confirmLocation}
                className="w-full py-4 rounded-full bg-emerald-600 text-white font-semibold shadow-xl"
              >
                {loading ? "Mengambil alamat..." : "Pilih Lokasi Ini"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
