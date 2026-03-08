import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AreaMap } from "@/components/AreaMap";
import { geocodeAddress } from "@/lib/geocode";
import { Fan, Wind, Calendar, Clock, Search, Map, Loader2 } from "lucide-react";

type Status = "pending" | "in-progress" | "done";

interface EgnaEntry {
  id: string;
  address: string;
  datumPlanerat: string;
  blowStatus: Status;
  sweepStatus: Status;
  ansvarig: string;
  kommentar: string;
  timmar: number;
  lat?: number;
  lng?: number;
}

const INITIAL_DATA: EgnaEntry[] = [
  { id: "e1", address: "Furumossen sektion 1, Göteborg", datumPlanerat: "2026-03-16", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "blåsa samt kratta flis från gräset, jobba i sektioner", timmar: 8 },
  { id: "e2", address: "Furumossen sektion 2, Göteborg", datumPlanerat: "2026-03-17", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "kolla kartan", timmar: 8 },
  { id: "e3", address: "Furumossen sektion 3, Göteborg", datumPlanerat: "2026-03-18", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 4 },
  { id: "e4", address: "Sigalett Furulund", datumPlanerat: "2026-03-18", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 4 },
  { id: "e5", address: "Kruthusgatan 17-19, Göteborg", datumPlanerat: "2026-03-19", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 6 },
  { id: "e6", address: "Kalkylvägen 3, Mölnlycke", datumPlanerat: "2026-03-19", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 2 },
  { id: "e7", address: "Gastorp/Rantorp, Göteborg", datumPlanerat: "2026-03-20", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 3 },
  { id: "e8", address: "Kåltorp Bygg, Göteborg", datumPlanerat: "2026-03-20", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 3 },
  { id: "e9", address: "Åby Travet, Mölndal", datumPlanerat: "2026-03-23", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 8 },
  { id: "e10", address: "Bergsjödalen 60-62, Göteborg", datumPlanerat: "2026-03-24", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "första på högersida", timmar: 3 },
  { id: "e11", address: "Bergsjödalen, Göteborg", datumPlanerat: "2026-03-24", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "Magnussons Fisk - längst in till vänster på gatan", timmar: 2 },
  { id: "e12", address: "Bergsjödalen 45, Göteborg", datumPlanerat: "2026-03-24", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "Österberg - innan Magnussons Fisk", timmar: 2 },
  { id: "e13", address: "Konstruktionsvägen 3, Göteborg", datumPlanerat: "2026-03-25", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 4 },
  { id: "e14", address: "Fraktvägen 7b, Göteborg", datumPlanerat: "2026-03-25", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 4 },
  { id: "e15", address: "Åkarevägen 3a, Göteborg", datumPlanerat: "2026-03-26", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 4 },
  { id: "e16", address: "Mediavägen, Göteborg", datumPlanerat: "2026-03-26", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 4 },
  { id: "e17", address: "DHL Flyget, Göteborg Landvetter", datumPlanerat: "2026-03-30", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 2 },
  { id: "e18", address: "Ambulansflyg, Göteborg Landvetter", datumPlanerat: "2026-03-30", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e19", address: "Flygfrakt, Göteborg Landvetter", datumPlanerat: "2026-03-30", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 3 },
  { id: "e20", address: "OKQ8, Göteborg", datumPlanerat: "2026-03-30", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e21", address: "Mjuk Biltvätt Sisjön, Göteborg", datumPlanerat: "2026-03-31", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e22", address: "Mjuk Biltvätt Marconimotet, Göteborg", datumPlanerat: "2026-03-31", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e23", address: "Mjuk Biltvätt Backaplan, Göteborg", datumPlanerat: "2026-03-31", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e24", address: "Mjuk Biltvätt, Kungsbacka", datumPlanerat: "2026-03-31", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e25", address: "Mjuk Biltvätt, Kungälv", datumPlanerat: "2026-03-31", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e26", address: "Mjuk Biltvätt Sävedalen, Göteborg", datumPlanerat: "2026-03-31", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e27", address: "Norra Ågatan, Mölndal", datumPlanerat: "2026-03-31", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "Mjuk Biltvätt", timmar: 1 },
  { id: "e28", address: "Eken Center, Kållered", datumPlanerat: "2026-03-16 kvällstid 21:00", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 0 },
  { id: "e29", address: "Ekenleden 11-15, Kållered", datumPlanerat: "2026-03-16 kvällstid 21:00", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 0 },
  { id: "e30", address: "Norra Ågatan 36, Mölndal", datumPlanerat: "2026-03-17 kvällstid", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 0 },
  { id: "e31", address: "Topasgatan 3, Göteborg", datumPlanerat: "2026-03-17 kvällstid", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 0 },
  { id: "e32", address: "Kryptongatan 6, Göteborg", datumPlanerat: "2026-03-17 dagtid", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 0 },
  { id: "e33", address: "Järnvägsgatan 6, Göteborg", datumPlanerat: "2026-03-17 dagtid", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "/ Torggatan 5", timmar: 0 },
];

const STORAGE_KEY = "clc_egna_omraden";

function loadEntries(): EgnaEntry[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed: EgnaEntry[] = JSON.parse(stored);
    // Migrate: ensure lat/lng fields exist
    if (parsed.length > 0 && !("lat" in parsed[0])) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    }
    return parsed;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
  return INITIAL_DATA;
}

function saveEntries(entries: EgnaEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function getMarkerColor(blow: Status, sweep: Status): "green" | "orange" | "red" {
  if (blow === "done" && sweep === "done") return "green";
  if (blow === "pending" && sweep === "pending") return "red";
  return "orange";
}

export default function EgnaOmradenPage() {
  const [entries, setEntries] = useState<EgnaEntry[]>(loadEntries);
  const [search, setSearch] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState("");

  const updateEntry = (id: string, updates: Partial<EgnaEntry>) => {
    const updated = entries.map((e) => (e.id === id ? { ...e, ...updates } : e));
    setEntries(updated);
    saveEntries(updated);
  };

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.address.toLowerCase().includes(q) ||
        e.ansvarig.toLowerCase().includes(q) ||
        e.datumPlanerat.toLowerCase().includes(q) ||
        e.kommentar.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const mapMarkers = useMemo(
    () =>
      entries
        .filter((e) => e.lat != null && e.lng != null)
        .map((e) => ({
          lat: e.lat!,
          lng: e.lng!,
          label: e.address,
          color: getMarkerColor(e.blowStatus, e.sweepStatus),
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
        current = current.map((e) =>
          e.id === entry.id ? { ...e, lat: coords.lat, lng: coords.lng } : e
        );
      }
      // Nominatim rate limit: 1 req/sec
      if (i < toGeocode.length - 1) {
        await new Promise((r) => setTimeout(r, 1100));
      }
    }

    setEntries(current);
    saveEntries(current);
    setGeocoding(false);
    setGeocodeProgress("");
  }, [entries]);

  const blowDone = entries.filter((e) => e.blowStatus === "done").length;
  const sweepDone = entries.filter((e) => e.sweepStatus === "done").length;
  const total = entries.length;
  const geocodedCount = entries.filter((e) => e.lat != null).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Egna Områden</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Blåsning: {blowDone}/{total} klara · Maskinsopning: {sweepDone}/{total} klara
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4 text-center">
            <Fan className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-semibold text-primary">{blowDone}/{total}</p>
            <p className="text-xs text-muted-foreground">Framblåsning klart</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4 text-center">
            <Wind className="h-5 w-5 mx-auto mb-1 text-accent-foreground" />
            <p className="text-2xl font-semibold">{sweepDone}/{total}</p>
            <p className="text-xs text-muted-foreground">Maskinsopning klart</p>
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
              <Button
                size="sm"
                variant="outline"
                onClick={handleGeocodeAll}
                disabled={geocoding}
                className="gap-2"
              >
                {geocoding ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Map className="h-3 w-3" />
                )}
                {geocoding ? "Söker..." : "Hämta kartpositioner"}
              </Button>
            )}
          </div>
          {geocoding && geocodeProgress && (
            <p className="text-xs text-muted-foreground">{geocodeProgress}</p>
          )}
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-success inline-block" /> Klart
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-warning inline-block" /> Pågår
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-destructive inline-block" /> Ej påbörjad
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {mapMarkers.length > 0 ? (
            <AreaMap
              className="h-72 md:h-96 w-full rounded-lg overflow-hidden"
              markers={mapMarkers}
            />
          ) : (
            <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Tryck "Hämta kartpositioner" för att visa områden på kartan
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök adress, ansvarig, datum..."
          className="pl-10"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredEntries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Inga resultat för "{search}"</p>
        )}
        {filteredEntries.map((entry) => (
          <Card key={entry.id} className="glass-card">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{entry.address}</p>
                  {entry.lat != null && (
                    <span className="text-[10px] text-success">📍</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {entry.datumPlanerat}
                  </span>
                  {entry.timmar > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {entry.timmar}h
                    </span>
                  )}
                </div>
                {entry.kommentar && (
                  <p className="text-xs text-muted-foreground/70 italic mt-1">{entry.kommentar}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Fan className="h-3 w-3 text-primary" />
                    Framblåsning
                    <StatusBadge status={entry.blowStatus} />
                  </div>
                  <Select
                    value={entry.blowStatus}
                    onValueChange={(v) => updateEntry(entry.id, { blowStatus: v as Status })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Ej påbörjad</SelectItem>
                      <SelectItem value="in-progress">Pågår</SelectItem>
                      <SelectItem value="done">Klart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Wind className="h-3 w-3 text-accent-foreground" />
                    Maskinsopning
                    <StatusBadge status={entry.sweepStatus} />
                  </div>
                  <Select
                    value={entry.sweepStatus}
                    onValueChange={(v) => updateEntry(entry.id, { sweepStatus: v as Status })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Ej påbörjad</SelectItem>
                      <SelectItem value="in-progress">Pågår</SelectItem>
                      <SelectItem value="done">Klart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Input
                value={entry.ansvarig}
                onChange={(e) => updateEntry(entry.id, { ansvarig: e.target.value })}
                placeholder="Ansvarig"
                className="h-8 text-xs"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}