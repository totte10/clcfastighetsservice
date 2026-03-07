import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for Leaflet + bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MarkerData {
  lat: number;
  lng: number;
  label?: string;
  color?: "blue" | "green" | "orange" | "red";
}

interface AreaMapProps {
  markers: MarkerData[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  blue: "#3b82f6",
  green: "#22c55e",
  orange: "#f59e0b",
  red: "#ef4444",
};

function createColorIcon(color: string = "blue") {
  const hex = STATUS_COLORS[color] || STATUS_COLORS.blue;
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 24px; height: 24px; border-radius: 50% 50% 50% 0;
      background: ${hex}; transform: rotate(-45deg);
      border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}

export function AreaMap({
  markers,
  center,
  zoom = 13,
  className = "h-48 w-full rounded-md overflow-hidden",
}: AreaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const validMarkers = markers.filter(
      (m) => m.lat != null && m.lng != null && !isNaN(m.lat) && !isNaN(m.lng)
    );

    if (validMarkers.length === 0) return;

    const mapCenter = center || [validMarkers[0].lat, validMarkers[0].lng];
    const map = L.map(mapRef.current).setView(mapCenter as L.LatLngExpression, zoom);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    const markerGroup = L.featureGroup();

    validMarkers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], {
        icon: createColorIcon(m.color),
      });
      if (m.label) {
        marker.bindPopup(`<strong>${m.label}</strong>`);
      }
      marker.addTo(markerGroup);
    });

    markerGroup.addTo(map);

    if (validMarkers.length > 1) {
      map.fitBounds(markerGroup.getBounds().pad(0.15));
    }

    // Force resize after render
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [markers, center, zoom]);

  const hasValidMarkers = markers.some(
    (m) => m.lat != null && m.lng != null && !isNaN(m.lat) && !isNaN(m.lng)
  );

  if (!hasValidMarkers) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <p className="text-xs text-muted-foreground">Ingen kartposition</p>
      </div>
    );
  }

  return <div ref={mapRef} className={className} />;
}
