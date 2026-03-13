import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { geocodeAddress } from "@/lib/geocode";
import { MapPin, Search, Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface MissingEntry {
  id: string;
  type: "tidx" | "egna" | "tmm" | "optimal" | "project" | "area";
  name: string;
  address: string;
  createdAt: string;
}

export default function MissingCoordinatesPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<MissingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState<string | null>(null);
  const [manualCoords, setManualCoords] = useState<Record<string, { lat: string; lng: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const results: MissingEntry[] = [];

    const [tidx, egna, tmm, optimal, proj, areas] = await Promise.all([
      supabase.from("tidx_entries").select("id, omrade, address, created_at, lat, lng"),
      supabase.from("egna_entries").select("id, address, created_at, lat, lng"),
      supabase.from("tmm_entries").select("id, beskrivning, address, created_at, lat, lng"),
      supabase.from("optimal_entries").select("id, name, address, created_at, lat, lng"),
      supabase.from("projects").select("id, name, address, created_at, lat, lng"),
      supabase.from("areas").select("id, name, address, created_at, lat, lng"),
    ]);

    (tidx.data ?? []).filter(r => !r.lat && !r.lng).forEach(r =>
      results.push({ id: r.id, type: "tidx", name: r.omrade || "Tidx", address: r.address, createdAt: r.created_at })
    );
    (egna.data ?? []).filter(r => !r.lat && !r.lng).forEach(r =>
      results.push({ id: r.id, type: "egna", name: "Egna", address: r.address, createdAt: r.created_at })
    );
    (tmm.data ?? []).filter(r => !r.lat && !r.lng).forEach(r =>
      results.push({ id: r.id, type: "tmm", name: r.beskrivning || "TMM", address: r.address, createdAt: r.created_at })
    );
    (optimal.data ?? []).filter(r => !r.lat && !r.lng).forEach(r =>
      results.push({ id: r.id, type: "optimal", name: r.name, address: r.address, createdAt: r.created_at })
    );
    (proj.data ?? []).filter(r => !r.lat && !r.lng).forEach(r =>
      results.push({ id: r.id, type: "project", name: r.name, address: r.address, createdAt: r.created_at })
    );
    (areas.data ?? []).filter(r => !r.lat && !r.lng).forEach(r =>
      results.push({ id: r.id, type: "area", name: r.name, address: r.address, createdAt: r.created_at })
    );

    setEntries(results);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const tableMap: Record<string, string> = {
    tidx: "tidx_entries", egna: "egna_entries", tmm: "tmm_entries",
    optimal: "optimal_entries", project: "projects", area: "areas",
  };

  const handleGeocode = async (entry: MissingEntry) => {
    if (!entry.address) {
      toast({ title: "Ingen adress att geokoda", variant: "destructive" });
      return;
    }
    setGeocoding(entry.id);
    try {
      const coords = await geocodeAddress(entry.address);
      if (!coords) {
        toast({ title: "Kunde inte hitta koordinater för adressen", variant: "destructive" });
        return;
      }
      const table = tableMap[entry.type];
      await supabase.from(table).update({ lat: coords.lat, lng: coords.lng }).eq("id", entry.id);
      toast({ title: `Koordinater sparade för ${entry.name}` });
      load();
    } finally {
      setGeocoding(null);
    }
  };

  const handleManualSave = async (entry: MissingEntry) => {
    const c = manualCoords[entry.id];
    if (!c || !c.lat || !c.lng) {
      toast({ title: "Fyll i latitud och longitud", variant: "destructive" });
      return;
    }
    const lat = parseFloat(c.lat);
    const lng = parseFloat(c.lng);
    if (isNaN(lat) || isNaN(lng)) {
      toast({ title: "Ogiltiga koordinater", variant: "destructive" });
      return;
    }
    const table = tableMap[entry.type];
    await supabase.from(table).update({ lat, lng }).eq("id", entry.id);
    toast({ title: `Koordinater sparade för ${entry.name}` });
    setManualCoords(prev => { const copy = { ...prev }; delete copy[entry.id]; return copy; });
    load();
  };

  const handleGeocodeAll = async () => {
    setGeocoding("all");
    let fixed = 0;
    for (const entry of entries) {
      if (!entry.address) continue;
      try {
        const coords = await geocodeAddress(entry.address);
        if (coords) {
          const table = tableMap[entry.type];
          await supabase.from(table).update({ lat: coords.lat, lng: coords.lng }).eq("id", entry.id);
          fixed++;
        }
      } catch { /* skip */ }
      // Rate limit
      await new Promise(r => setTimeout(r, 1200));
    }
    toast({ title: `Geokodade ${fixed} av ${entries.length} adresser` });
    setGeocoding(null);
    load();
  };

  if (!isAdmin) return <Navigate to="/" replace />;

  const typeLabels: Record<string, string> = {
    tidx: "Tidx", egna: "Egna", tmm: "TMM", optimal: "Optimal", project: "Projekt", area: "Område",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-warning" />
            Adresser utan kartposition
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{entries.length} adresser saknar koordinater</p>
        </div>
        {entries.length > 0 && (
          <Button onClick={handleGeocodeAll} disabled={geocoding === "all"} className="gap-2">
            {geocoding === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Geokoda alla
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : entries.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <MapPin className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-muted-foreground">Alla adresser har kartkoordinater!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {entries.map(entry => (
            <Card key={`${entry.type}-${entry.id}`} className="glass-card">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">{typeLabels[entry.type]}</Badge>
                      <p className="font-medium text-sm truncate">{entry.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.address || "Ingen adress"}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      Skapad: {format(new Date(entry.createdAt), "d MMM yyyy", { locale: sv })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => handleGeocode(entry)}
                      disabled={geocoding === entry.id || geocoding === "all"}
                    >
                      {geocoding === entry.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                      Auto-geokoda
                    </Button>
                    <div className="flex items-center gap-1">
                      <Input
                        placeholder="Lat"
                        className="h-7 text-xs w-20"
                        value={manualCoords[entry.id]?.lat || ""}
                        onChange={e => setManualCoords(prev => ({ ...prev, [entry.id]: { ...prev[entry.id], lat: e.target.value, lng: prev[entry.id]?.lng || "" } }))}
                      />
                      <Input
                        placeholder="Lng"
                        className="h-7 text-xs w-20"
                        value={manualCoords[entry.id]?.lng || ""}
                        onChange={e => setManualCoords(prev => ({ ...prev, [entry.id]: { ...prev[entry.id], lng: e.target.value, lat: prev[entry.id]?.lat || "" } }))}
                      />
                      <Button size="sm" variant="secondary" className="h-7 text-xs px-2" onClick={() => handleManualSave(entry)}>
                        <MapPin className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
