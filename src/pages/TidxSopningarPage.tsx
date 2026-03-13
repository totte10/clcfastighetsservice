import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { AreaMap } from "@/components/AreaMap";
import { EntryImageUpload } from "@/components/EntryImageUpload";
import { AddressTimeLog } from "@/components/AddressTimeLog";
import { geocodeAddress } from "@/lib/geocode";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Wind, Calendar, Clock, Search, Map, Loader2 } from "lucide-react";
import { getTidxEntries, updateTidxEntry, type TidxEntry } from "@/lib/store";
import { WorkerAssignment } from "@/components/WorkerAssignment";

type Status = "pending" | "in-progress" | "done";

function getMarkerColor(status: Status): "green" | "orange" | "red" {
  if (status === "done") return "green";
  if (status === "in-progress") return "orange";
  return "red";
}

export default function TidxSopningarPage() {
  const [entries, setEntries] = useState<TidxEntry[]>([]);
  const [search, setSearch] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState("");

  const refresh = useCallback(async () => {
    setEntries(await getTidxEntries());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleUpdate = async (id: string, updates: Partial<TidxEntry>) => {
    await updateTidxEntry(id, updates);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.address.toLowerCase().includes(q) ||
        e.ansvarig.toLowerCase().includes(q) ||
        e.datumPlanerat.toLowerCase().includes(q) ||
        e.omrade.toLowerCase().includes(q) ||
        e.kommentar.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const mapMarkers = useMemo(
    () => entries.filter((e) => e.lat != null && e.lng != null).map((e) => ({
      lat: e.lat!, lng: e.lng!, label: e.address, color: getMarkerColor(e.status),
    })),
    [entries]
  );

  const handleGeocodeAll = useCallback(async () => {
    const toGeocode = entries.filter((e) => e.lat == null || e.lng == null);
    if (toGeocode.length === 0) return;
    setGeocoding(true);
    let current = [...entries];
    for (let i = 0; i < toGeocode.length; i++) {
      const entry = toGeocode[i];
      setGeocodeProgress(`${i + 1}/${toGeocode.length}: ${entry.address}`);
      const coords = await geocodeAddress(entry.address);
      if (coords) {
        await updateTidxEntry(entry.id, { lat: coords.lat, lng: coords.lng });
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
  const totalHours = entries.reduce((sum, e) => sum + e.timmarMaskin, 0);
  const doneHours = entries.filter((e) => e.status === "done").reduce((sum, e) => sum + e.timmarMaskin, 0);
  const geocodedCount = entries.filter((e) => e.lat != null).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tidx Sopningar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {done}/{entries.length} klara · {inProgress} pågår · {doneHours}/{totalHours} maskintimmar
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
            <p className="text-2xl font-semibold text-destructive">{entries.length - done - inProgress}</p>
            <p className="text-xs text-muted-foreground">Ej påbörjad</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Karta ({geocodedCount}/{entries.length} positioner)
            </CardTitle>
            {geocodedCount < entries.length && (
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
              <p className="text-sm text-muted-foreground">Tryck "Hämta kartpositioner" för att visa på kartan</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sök adress, ansvarig, datum, område..." className="pl-10" />
      </div>

      <div className="space-y-3">
        {filteredEntries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Inga resultat för "{search}"</p>
        )}
        {filteredEntries.map((entry) => (
          <Card key={entry.id} className="glass-card">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] tracking-widest uppercase text-muted-foreground/60 font-medium">Område {entry.omrade}</span>
                    {entry.projectNumber && (
                      <span className="text-[10px] tracking-wider text-primary font-semibold">#{entry.projectNumber}</span>
                    )}
                    <StatusBadge status={entry.status} />
                    {entry.lat != null && <span className="text-[10px] text-success">📍</span>}
                  </div>
                  <p className="text-sm font-medium truncate">{entry.address}</p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{entry.datumPlanerat}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{entry.timmarMaskin}h maskin</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Select value={entry.status} onValueChange={(v) => handleUpdate(entry.id, { status: v as Status })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Ej påbörjad</SelectItem>
                    <SelectItem value="in-progress">Pågår</SelectItem>
                    <SelectItem value="done">Klart</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={entry.projectNumber} onChange={(e) => handleUpdate(entry.id, { projectNumber: e.target.value })} placeholder="Projektnr" className="h-8 text-xs" />
                <Input value={entry.ansvarig} onChange={(e) => handleUpdate(entry.id, { ansvarig: e.target.value })} placeholder="Ansvarig" className="h-8 text-xs" />
                <Input value={entry.kommentar} onChange={(e) => handleUpdate(entry.id, { kommentar: e.target.value })} placeholder="Kommentar" className="h-8 text-xs" />
              </div>
              <EntryImageUpload
                images={entry.images}
                onImagesChange={(imgs) => handleUpdate(entry.id, { images: imgs })}
              />
              <AddressTimeLog entryId={entry.id} entryType="tidx" entryLabel={entry.address} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
