import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";

interface MapJob {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
  type: string;
}

interface DashboardWorkerMapProps {
  jobs: MapJob[];
}

export function DashboardWorkerMap({ jobs }: DashboardWorkerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const validJobs = jobs.filter(j => j.lat && j.lng && !isNaN(j.lat) && !isNaN(j.lng));

  useEffect(() => {
    if (!mapRef.current || validJobs.length === 0) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const center: L.LatLngExpression = [validJobs[0].lat, validJobs[0].lng];
    const map = L.map(mapRef.current).setView(center, 12);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    const group = L.featureGroup();

    validJobs.forEach((job) => {
      const color = job.status === "done" ? "#22c55e" : job.status === "in-progress" ? "#f59e0b" : "#ef4444";
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width: 24px; height: 24px; border-radius: 50% 50% 50% 0;
          background: ${color}; transform: rotate(-45deg);
          border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24],
      });

      const typeMap: Record<string, string> = {
        tidx: "/tidx", egna: "/egna", tmm: "/tmm", optimal: "/optimal", project: "/projects",
      };
      const statusLabel = job.status === "done" ? "Klar" : job.status === "in-progress" ? "Påbörjad" : "Ej påbörjad";

      L.marker([job.lat, job.lng], { icon })
        .bindPopup(`
          <strong>${job.name}</strong><br/>
          <span style="font-size:12px">${job.address}</span><br/>
          <span style="font-size:11px; color:${color}">${statusLabel}</span>
        `)
        .addTo(group);
    });

    group.addTo(map);
    if (validJobs.length > 1) map.fitBounds(group.getBounds().pad(0.15));
    setTimeout(() => map.invalidateSize(), 100);

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [validJobs]);

  if (validJobs.length === 0) return null;

  return (
    <div
      ref={mapRef}
      className="h-[280px] w-full rounded-xl overflow-hidden border border-border/50"
      style={{ filter: "brightness(0.95) contrast(1.1) saturate(0.85)" }}
    />
  );
}
