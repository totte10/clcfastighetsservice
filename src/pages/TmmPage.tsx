import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AreaMap } from "@/components/AreaMap";
import { EntryImageUpload } from "@/components/EntryImageUpload";
import { AddressTimeLog } from "@/components/AddressTimeLog";
import { geocodeAddress } from "@/lib/geocode";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Brush, Calendar, Clock, Search, Map, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

type Status = "pending" | "in-progress" | "done";

interface TmmEntry {
  id: string;
  datum: string;
  beskrivning: string;
  ansvarig: string;
  tid: string;
  maskiner: number;
  status: string;
  notes: string;
  foretag: string;
  typ: string;
  address: string;
  lat: number | null;
  lng: number | null;
  images: string[];
}

function getMarkerColor(status: string): "green" | "orange" | "red" {
  if (status === "done") return "green";
  if (status === "in-progress") return "orange";
  return "red";
}

export default function TmmPage() {
  const [entries, setEntries] = useState<TmmEntry[]>([]);
  const [search, setSearch] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("tmm_entries")
      .select("*")
      .order("datum", { ascending: true });
    setEntries((data as TmmEntry[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (id: string, updates: Partial<TmmEntry>) => {
    const dbUpdates: Record<string, unknown> = { ...updates };
    await supabase.from("tmm_entries").update(dbUpdates).eq("id", id);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.beskrivning.toLowerCase().includes(q) ||
        e.address.toLowerCase().includes(q) ||
        e.ansvarig.toLowerCase().includes(q) ||
        e.foretag.toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q) ||
        e.datum.includes(q)
    );
  }, [entries, search]);

  const mapMarkers = useMemo(
    () => entries.filter((e) => e.lat != null && e.lng != null).map((e) => ({
      lat: e.lat!, lng: e.lng!, label: e.beskrivning + (e.address ? ` - ${e.address}` : ""), color: getMarkerColor(e.status),
    })),
    [entries]
  );

  const handleGeocodeAll = useCallback(async () => {
    const toGeocode = entries.filter((e) => (e.lat == null || e.lng == null) && e.address.trim());
    if (toGeocode.length === 0) return;
    setGeocoding(true);
    let current = [...entries];
    for (let i = 0; i < toGeocode.length; i++) {
      const entry = toGeocode[i];
      setGeocodeProgress(`${i + 1}/${toGeocode.length}: ${entry.address}`);
      const coords = await geocodeAddress(entry.address);
      if (coords) {
        await supabase.from("tmm_entries").update({ lat: coords.lat, lng: coords.lng }).eq("id", entry.id);
        current = current.map((e) => e.id === entry.id ? { ...e, lat: coords.lat, lng: coords.lng } : e);
      }
      if (i < toGeocode.length - 1) await new Promise((r) => setTimeout(r, 1100));
    }
    setEntries(current);
    setGeocoding(false);
    setGeocodeProgress("");
  }, [entries]);

  const done = entries.filter((e) => e.status === "done").length;
  const inProgress = entries.filter((e) => e.status === "in-progress").length;
  const total = entries.length;
  const geocodedCount = entries.filter((e) => e.lat != null).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brush className="h-6 w-6 text-primary" />
          Sopningar för TMM
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {done}/{total} klara · {inProgress} pågår
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-semibold text-primary">{done}</p>
            <p className="text-xs text-muted-foreground">Klara</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-semibold text-warning">{inProgress}</p>
            <p className="text-xs text-muted-foreground">Pågår</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-semibold text-destructive">{total - done - inProgress}</p>
            <p className="text-xs text-muted-foreground">Ej påbörjad</p>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Karta ({geocodedCount}/{total} positioner)
            </CardTitle>
            {geocodedCount < total && (
              <Button size="sm" variant="outline" onClick={handleGeocodeAll} disabled={geocoding} className="gap-2">
                {geocoding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Map className="h-3 w-3" />}
                {geocoding ? "Söker..." : "Hämta kartpositioner"}
              </Button>
            )}
          </div>
          {geocoding && geocodeProgress && <p className="text-xs text-muted-foreground">{geocodeProgress}</p>}
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-success inline-block" /> Klart</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-warning inline-block" /> Pågår</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-destructive inline-block" /> Ej påbörjad</span>
          </div>
        </CardHeader>
        <CardContent>
          {mapMarkers.length > 0 ? (
            <AreaMap className="h-72 md:h-96 w-full rounded-lg overflow-hidden" markers={mapMarkers} />
          ) : (
            <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Fyll i adresser och tryck "Hämta kartpositioner"</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sök beskrivning, adress, ansvarig, företag..." className="pl-10" />
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {filteredEntries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {search ? `Inga resultat för "${search}"` : "Inga sopningar tillagda ännu."}
          </p>
        )}
        {filteredEntries.map((entry) => (
          <Card key={entry.id} className="glass-card">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">{entry.beskrivning}</p>
                  <Badge variant="outline" className={entry.typ === "blasning" ? "border-sky-500/30 text-sky-400 text-[10px]" : "border-amber-500/30 text-amber-400 text-[10px]"}>
                    {entry.typ === "blasning" ? "Blåsning" : "Maskinsopning"}
                  </Badge>
                  <StatusBadge status={entry.status as Status} />
                  {entry.lat != null && <span className="text-[10px] text-success">📍</span>}
                </div>
                {entry.address && <p className="text-xs text-muted-foreground">{entry.address}</p>}
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{entry.datum}</span>
                  {entry.foretag && <span>🏢 {entry.foretag}</span>}
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{entry.tid}</span>
                  <span>{entry.maskiner} maskiner</span>
                </div>
                {entry.notes && <p className="text-xs text-muted-foreground/70 italic mt-1">{entry.notes}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-medium">Status</span>
                  <Select value={entry.status} onValueChange={(v) => handleUpdate(entry.id, { status: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Ej påbörjad</SelectItem>
                      <SelectItem value="in-progress">Pågår</SelectItem>
                      <SelectItem value="done">Klart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input value={entry.address} onChange={(e) => handleUpdate(entry.id, { address: e.target.value })} placeholder="Adress" className="h-8 text-xs" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Input value={entry.ansvarig} onChange={(e) => handleUpdate(entry.id, { ansvarig: e.target.value })} placeholder="Ansvarig" className="h-8 text-xs" />
                <Input value={entry.foretag} onChange={(e) => handleUpdate(entry.id, { foretag: e.target.value })} placeholder="Företag" className="h-8 text-xs" />
                <Input value={entry.notes} onChange={(e) => handleUpdate(entry.id, { notes: e.target.value })} placeholder="Kommentar" className="h-8 text-xs" />
              </div>

              <EntryImageUpload
                images={entry.images}
                onImagesChange={(imgs) => handleUpdate(entry.id, { images: imgs })}
              />
              <AddressTimeLog entryId={entry.id} entryType="tmm" entryLabel={entry.beskrivning} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
