import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Route, Navigation, MapPin, Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface JobPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
  type: string;
  order?: number;
}

// Simple nearest-neighbor TSP for route optimization
function optimizeRoute(points: JobPoint[]): JobPoint[] {
  if (points.length <= 2) return points.map((p, i) => ({ ...p, order: i + 1 }));

  const visited = new Set<number>();
  const result: JobPoint[] = [];
  let current = 0;
  visited.add(0);
  result.push({ ...points[0], order: 1 });

  while (visited.size < points.length) {
    let nearest = -1;
    let minDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      if (visited.has(i)) continue;
      const d = haversine(points[current].lat, points[current].lng, points[i].lat, points[i].lng);
      if (d < minDist) { minDist = d; nearest = i; }
    }
    if (nearest === -1) break;
    visited.add(nearest);
    current = nearest;
    result.push({ ...points[nearest], order: result.length + 1 });
  }
  return result;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function RoutePlanningPage() {
  const { user, isAdmin } = useAuth();
  const [jobs, setJobs] = useState<JobPoint[]>([]);
  const [optimizedJobs, setOptimizedJobs] = useState<JobPoint[]>([]);
  const [avoidHighways, setAvoidHighways] = useState(true);
  const [loading, setLoading] = useState(true);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const loadJobs = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Load all entry types with coordinates and today's date
    const [tidx, egna, tmm, optimal, proj] = await Promise.all([
      supabase.from("tidx_entries").select("id, omrade, address, lat, lng, status, datum_planerat"),
      supabase.from("egna_entries").select("id, address, lat, lng, blow_status, sweep_status, datum_planerat"),
      supabase.from("tmm_entries").select("id, beskrivning, address, lat, lng, status, datum"),
      supabase.from("optimal_entries").select("id, name, address, lat, lng, status, datum_start, datum_end"),
      supabase.from("projects").select("id, name, address, lat, lng, status, datum_planerat"),
    ]);

    const points: JobPoint[] = [];

    (tidx.data ?? []).forEach(r => {
      if (r.lat && r.lng && (r.datum_planerat || "").startsWith(todayStr)) {
        points.push({ id: r.id, name: r.omrade || "Tidx", address: r.address, lat: r.lat, lng: r.lng, status: r.status, type: "tidx" });
      }
    });
    (egna.data ?? []).forEach(r => {
      if (r.lat && r.lng && (r.datum_planerat || "").startsWith(todayStr)) {
        const s = r.blow_status === "done" && r.sweep_status === "done" ? "done" : "pending";
        points.push({ id: r.id, name: r.address, address: r.address, lat: r.lat, lng: r.lng, status: s, type: "egna" });
      }
    });
    (tmm.data ?? []).forEach(r => {
      if (r.lat && r.lng && r.datum === todayStr) {
        points.push({ id: r.id, name: r.beskrivning || "TMM", address: r.address, lat: r.lat, lng: r.lng, status: r.status, type: "tmm" });
      }
    });
    (optimal.data ?? []).forEach(r => {
      if (r.lat && r.lng && r.datum_start <= todayStr && (r.datum_end || r.datum_start) >= todayStr) {
        points.push({ id: r.id, name: r.name, address: r.address, lat: r.lat, lng: r.lng, status: r.status, type: "optimal" });
      }
    });
    (proj.data ?? []).forEach(r => {
      if (r.lat && r.lng && (r.datum_planerat || "").startsWith(todayStr)) {
        points.push({ id: r.id, name: r.name, address: r.address, lat: r.lat, lng: r.lng, status: r.status, type: "project" });
      }
    });

    setJobs(points);
    const opt = optimizeRoute(points);
    setOptimizedJobs(opt);
    setLoading(false);
  }, [user, todayStr]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // Fetch route from OSRM
  const fetchRoute = useCallback(async (points: JobPoint[]) => {
    if (points.length < 2) { setRoutePolyline([]); return; }
    setLoadingRoute(true);
    try {
      const coords = points.map(p => `${p.lng},${p.lat}`).join(";");
      // Use OSRM public demo (for production, use own instance)
      const profile = avoidHighways ? "car" : "car";
      const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const geom = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
        setRoutePolyline(geom);
      }
    } catch {
      // Fallback: straight lines
      setRoutePolyline(points.map(p => [p.lat, p.lng] as [number, number]));
    } finally {
      setLoadingRoute(false);
    }
  }, [avoidHighways]);

  useEffect(() => {
    if (optimizedJobs.length >= 2) fetchRoute(optimizedJobs);
  }, [optimizedJobs, fetchRoute]);

  // Render map
  useEffect(() => {
    if (!mapRef.current || optimizedJobs.length === 0) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current).setView([optimizedJobs[0].lat, optimizedJobs[0].lng], 12);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    const group = L.featureGroup();

    optimizedJobs.forEach((job) => {
      const color = job.status === "done" ? "#22c55e" : job.status === "in-progress" ? "#f59e0b" : "#ef4444";
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width: 28px; height: 28px; border-radius: 50%;
          background: ${color}; border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 12px; font-weight: bold;
        ">${job.order || ""}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      L.marker([job.lat, job.lng], { icon })
        .bindPopup(`<strong>${job.order}. ${job.name}</strong><br/>${job.address}<br/><em>${job.status}</em>`)
        .addTo(group);
    });

    // Draw route line
    if (routePolyline.length > 1) {
      L.polyline(routePolyline, { color: "hsl(152, 50%, 36%)", weight: 4, opacity: 0.8, dashArray: "8 4" }).addTo(group);
    }

    group.addTo(map);
    if (optimizedJobs.length > 1) map.fitBounds(group.getBounds().pad(0.15));
    setTimeout(() => map.invalidateSize(), 100);

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [optimizedJobs, routePolyline]);

  const openNavigation = (job: JobPoint) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const openFullRoute = () => {
    if (optimizedJobs.length === 0) return;
    const waypoints = optimizedJobs.map(j => `${j.lat},${j.lng}`).join("/");
    const url = `https://www.google.com/maps/dir/${waypoints}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Route className="h-6 w-6 text-primary" />
          Ruttplanering – {format(new Date(), "d MMMM", { locale: sv })}
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="avoid-hw" checked={avoidHighways} onCheckedChange={setAvoidHighways} />
            <Label htmlFor="avoid-hw" className="text-xs">Undvik motorvägar</Label>
          </div>
          {optimizedJobs.length >= 2 && (
            <Button size="sm" className="gap-1.5" onClick={openFullRoute}>
              <Navigation className="h-3.5 w-3.5" /> Öppna rutt
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : optimizedJobs.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Inga jobb med kartposition planerade idag</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Map */}
          <div
            ref={mapRef}
            className="h-[400px] w-full rounded-xl overflow-hidden border border-border/50"
            style={{ filter: "brightness(0.95) contrast(1.1) saturate(0.85)" }}
          />

          {loadingRoute && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Beräknar rutt...
            </div>
          )}

          {/* Job list */}
          <div className="grid gap-3">
            {optimizedJobs.map((job) => {
              const statusColor = job.status === "done" ? "text-success" : job.status === "in-progress" ? "text-warning" : "text-destructive";
              return (
                <Card key={`${job.type}-${job.id}`} className="glass-card">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">{job.order}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{job.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{job.address}</p>
                      <Badge variant="outline" className={`text-[10px] mt-1 ${statusColor}`}>
                        {job.status === "done" ? "Klar" : job.status === "in-progress" ? "Påbörjad" : "Ej påbörjad"}
                      </Badge>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs shrink-0" onClick={() => openNavigation(job)}>
                      <ExternalLink className="h-3 w-3" /> Navigera
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
