// src/components/AutoLocate.jsx
import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function AutoLocate({ onLocationFound }) {
  const map = useMap();

  useEffect(() => {
    map.locate({
      setView: true,
      maxZoom: 15,
      enableHighAccuracy: true,
    });

    const handleLocationFound = (e) => {
      const { lat, lng } = e.latlng;

      if (onLocationFound) {
        onLocationFound({
          lat,
          lng,
          name: "Lokasi Saat Ini",
          address: "Posisi GPS Anda",
        });
      }
    };

    const handleLocationError = (e) => {
      console.warn("Gagal mendeteksi lokasi:", e.message);
    };

    map.on("locationfound", handleLocationFound);
    map.on("locationerror", handleLocationError);

    return () => {
      map.off("locationfound", handleLocationFound);
      map.off("locationerror", handleLocationError);
    };
  }, [map, onLocationFound]);

  return null;
}