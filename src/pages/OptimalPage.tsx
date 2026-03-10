import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AreaMap } from "@/components/AreaMap";
import { EntryImageUpload } from "@/components/EntryImageUpload";
import { AddressTimeLog } from "@/components/AddressTimeLog";
import { geocodeAddress } from "@/lib/geocode";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Truck, Plus, Calendar, CalendarIcon, Search, Map, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Status = "pending" | "planned" | "done";

interface OptimalEntry {
  id: string;
  name: string;
  datum_start: string;
  datum_end: string | null;
  status: string;
  notes: string;
  foretag: string;
  typ: string;
  address: string;
  lat: number | null;
  lng: number | null;
  images: string[];
}

const statusOptions = [
  { value: "pending", label: "Ej planerad" },
  { value: "planned", label: "Planerad" },
  { value: "done", label: "Klar" },
];

const typOptions = [
  { value: "maskinsopning", label: "Maskinsopning" },
  { value: "blasning", label: "Blåsning" },
];

function getMarkerColor(status: string): "green" | "orange" | "red" {
  if (status === "done") return "green";
  if (status === "planned") return "orange";
  return "red";
}

export default function OptimalPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<OptimalEntry[]>([]);
  const [search, setSearch] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<OptimalEntry | null>(null);
  const [form, setForm] = useState({ name: "", notes: "", foretag: "", typ: "maskinsopning", address: "" });
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("optimal_entries")
      .select("*")
      .order("datum_start", { ascending: true });
    setEntries((data as OptimalEntry[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (id: string, updates: Partial<OptimalEntry>) => {
    const dbUpdates: Record<string, unknown> = { ...updates };
    await supabase.from("optimal_entries").update(dbUpdates).eq("id", id);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", notes: "", foretag: "", typ: "maskinsopning", address: "" });
    setStartDate(undefined);
    setEndDate(undefined);
    setShowDialog(true);
  };

  const openEdit = (e: OptimalEntry) => {
    setEditing(e);
    setForm({ name: e.name, notes: e.notes, foretag: e.foretag, typ: e.typ, address: e.address });
    setStartDate(parseISO(e.datum_start));
    setEndDate(e.datum_end ? parseISO(e.datum_end) : undefined);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !startDate) {
      toast({ title: "Fyll i namn och startdatum", variant: "destructive" });
      return;
    }
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      datum_start: format(startDate, "yyyy-MM-dd"),
      datum_end: endDate ? format(endDate, "yyyy-MM-dd") : null,
      notes: form.notes,
      foretag: form.foretag.trim(),
      typ: form.typ,
      address: form.address.trim(),
    };

    // Geocode if address provided
    if (form.address.trim()) {
      const coords = await geocodeAddress(form.address.trim());
      if (coords) {
        payload.lat = coords.lat;
        payload.lng = coords.lng;
      }
    }

    if (editing) {
      const { error } = await supabase.from("optimal_entries").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Kunde inte uppdatera", variant: "destructive" }); return; }
      toast({ title: "Uppdaterad!" });
    } else {
      const { error } = await supabase.from("optimal_entries").insert(payload as any);
      if (error) { toast({ title: "Kunde inte skapa", variant: "destructive" }); return; }
      toast({ title: "Område tillagt!" });
    }
    setShowDialog(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("optimal_entries").delete().eq("id", id);
    toast({ title: "Borttaget" });
    load();
  };

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.address.toLowerCase().includes(q) ||
        e.foretag.toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const mapMarkers = useMemo(
    () => entries.filter((e) => e.lat != null && e.lng != null).map((e) => ({
      lat: e.lat!, lng: e.lng!, label: e.name + (e.address ? ` - ${e.address}` : ""), color: getMarkerColor(e.status),
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
        await supabase.from("optimal_entries").update({ lat: coords.lat, lng: coords.lng }).eq("id", entry.id);
        current = current.map((e) => e.id === entry.id ? { ...e, lat: coords.lat, lng: coords.lng } : e);
      }
      if (i < toGeocode.length - 1) await new Promise((r) => setTimeout(r, 1100));
    }
    setEntries(current);
    setGeocoding(false);
    setGeocodeProgress("");
  }, [entries]);

  const done = entries.filter((e) => e.status === "done").length;
  const planned = entries.filter((e) => e.status === "planned").length;
  const total = entries.length;
  const geocodedCount = entries.filter((e) => e.lat != null).length;

  const formatDateRange = (start: string, end: string | null) => {
    const s = start;
    if (!end) return s;
    return `${s} → ${end}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Optimal Områden
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {done}/{total} klara · {planned} planerade
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Lägg till område
        </Button>
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
            <p className="text-2xl font-semibold text-warning">{planned}</p>
            <p className="text-xs text-muted-foreground">Planerade</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-semibold text-destructive">{total - done - planned}</p>
            <p className="text-xs text-muted-foreground">Ej planerade</p>
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
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-warning inline-block" /> Planerad</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-destructive inline-block" /> Ej planerad</span>
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
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sök namn, adress, företag..." className="pl-10" />
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {filteredEntries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {search ? `Inga resultat för "${search}"` : "Inga områden tillagda ännu."}
          </p>
        )}
        {filteredEntries.map((entry) => (
          <Card key={entry.id} className="glass-card">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">{entry.name}</p>
                  <Badge variant="outline" className={entry.typ === "blasning" ? "border-sky-500/30 text-sky-400 text-[10px]" : "border-amber-500/30 text-amber-400 text-[10px]"}>
                    {entry.typ === "blasning" ? "Blåsning" : "Maskinsopning"}
                  </Badge>
                  <StatusBadge status={entry.status === "planned" ? "in-progress" : entry.status as "pending" | "done"} />
                  {entry.lat != null && <span className="text-[10px] text-success">📍</span>}
                </div>
                {entry.address && <p className="text-xs text-muted-foreground">{entry.address}</p>}
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDateRange(entry.datum_start, entry.datum_end)}</span>
                  {entry.foretag && <span>🏢 {entry.foretag}</span>}
                </div>
                {entry.notes && <p className="text-xs text-muted-foreground/70 italic mt-1">{entry.notes}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-medium">Status</span>
                  <Select value={entry.status} onValueChange={(v) => handleUpdate(entry.id, { status: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input value={entry.address} onChange={(e) => handleUpdate(entry.id, { address: e.target.value })} placeholder="Adress" className="h-8 text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input value={entry.foretag} onChange={(e) => handleUpdate(entry.id, { foretag: e.target.value })} placeholder="Företag" className="h-8 text-xs" />
                <Input value={entry.notes} onChange={(e) => handleUpdate(entry.id, { notes: e.target.value })} placeholder="Kommentar" className="h-8 text-xs" />
              </div>

              <EntryImageUpload
                images={entry.images}
                onImagesChange={(imgs) => handleUpdate(entry.id, { images: imgs })}
              />
              <AddressTimeLog entryId={entry.id} entryType="optimal" entryLabel={entry.name} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Redigera område" : "Lägg till område"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Namn *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="T.ex. Brf Sisjödal" />
            </div>
            <div className="space-y-2">
              <Label>Adress</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="T.ex. Storgatan 1, Göteborg" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Företag</Label>
                <Input value={form.foretag} onChange={(e) => setForm({ ...form, foretag: e.target.value })} placeholder="T.ex. Optimal AB" />
              </div>
              <div className="space-y-2">
                <Label>Typ</Label>
                <Select value={form.typ} onValueChange={(v) => setForm({ ...form, typ: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {typOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Startdatum *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "d MMM yyyy", { locale: sv }) : "Välj datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Slutdatum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "d MMM yyyy", { locale: sv }) : "Välj datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Anteckningar</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Avbryt</Button>
            <Button onClick={handleSave}>{editing ? "Spara" : "Lägg till"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
