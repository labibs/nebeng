import { useMap } from "react-leaflet";
import { OpenStreetMapProvider, GeoSearchControl } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";
import { useEffect } from 'react'
import L from "leaflet";

export default function SearchControl({ onSelect }) {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
      provider,
      style: "bar",
      showMarker: true,
      showPopup: true,
      marker: {
        icon: L.icon({
          iconUrl:
            "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        }),
      },
    });

    map.addControl(searchControl);

    map.on("geosearch/showlocation", (result) => {
      console.log("Geosearch result:", result);
      const { x: lng, y: lat, label } = result.location;

      const locationData = {
        lat,
        lng,
        name: label.split(",")[0].trim() || label,
        address: label,
      };
      
      console.log("Calling onSelect with:", locationData);
      onSelect(locationData);
    });

    return () => map.removeControl(searchControl);
  }, [map, onSelect]);

  return null;
}
