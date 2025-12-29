// AutoLocate.jsx
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function AutoLocate({ onLocationFound }) {
  const map = useMap();

  useEffect(() => {
    // Otomatis minta lokasi user saat map pertama kali dimuat
    map.locate({
      setView: true,   // map akan otomatis pindah & zoom ke lokasi user
      maxZoom: 15,     // zoom maksimal saat locate
      watch: false,    // false = hanya sekali locate (bukan terus-menerus track)
      enableHighAccuracy: true,
    });

    const handleLocationFound = (e) => {
      const { lat, lng } = e.latlng;

      // Update state location di parent (misalnya setLocation)
      if (onLocationFound) {
        onLocationFound({
          lat,
          lng,
          name: "Lokasi Saat Ini",
          address: "Posisi GPS Anda",
        });
      }

      // Optional: tambah marker + lingkaran akurasi
      // L.marker(e.latlng)
      //   .addTo(map)
      //   .bindPopup("Anda berada di sini")
      //   .openPopup();

      // L.circle(e.latlng, e.accuracy / 2, {
      //   weight: 2,
      //   color: "blue",
      //   fillOpacity: 0.15,
      // }).addTo(map);
    };

    const handleLocationError = (e) => {
      console.warn("Gagal mendapatkan lokasi:", e.message);
      // Bisa tambah notifikasi ke user kalau mau
      // Misalnya: alert("Tidak bisa mendeteksi lokasi. Menggunakan lokasi default.");
    };

    map.on("locationfound", handleLocationFound);
    map.on("locationerror", handleLocationError);

    // Cleanup event listener saat component unmount
    return () => {
      map.off("locationfound", handleLocationFound);
      map.off("locationerror", handleLocationError);
    };
  }, [map, onLocationFound]);

  // Component ini tidak render apa-apa ke DOM
  return null;
}