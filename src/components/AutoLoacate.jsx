import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function AutoLocate({ onLocationFound }) {
  const map = useMap();

  useEffect(() => {
    // Otomatis locate saat map siap
    map.locate({ setView: true, maxZoom: 15 });

    const handleLocationFound = (e) => {
      const { lat, lng } = e.latlng;

      // Panggil callback untuk update state location di parent
      if (onLocationFound) {
        onLocationFound({
          lat,
          lng,
          // Optional: coba reverse geocode untuk nama/address (tapi butuh extra)
          name: 'Lokasi Saat Ini',
          address: 'Posisi GPS Anda',
        });
      }

      // Optional: tambah marker + circle accuracy
      // L.marker(e.latlng).addTo(map).bindPopup("Anda di sini").openPopup();
      // L.circle(e.latlng, e.accuracy).addTo(map);
    };

    const handleLocationError = (e) => {
      console.warn('Gagal deteksi lokasi:', e.message);
      // Kalau gagal, tetap pakai default Jakarta
    };

    map.on('locationfound', handleLocationFound);
    map.on('locationerror', handleLocationError);

    return () => {
      map.off('locationfound', handleLocationFound);
      map.off('locationerror', handleLocationError);
    };
  }, [map, onLocationFound]);

  return null;
}