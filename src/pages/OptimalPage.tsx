import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Truck, Plus, CalendarIcon, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface OptimalEntry {
  id: string;
  name: string;
  datum_start: string;
  datum_end: string | null;
  status: string;
  notes: string;
  foretag: string;
  typ: string;
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

export default function OptimalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<OptimalEntry[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<OptimalEntry | null>(null);
  const [form, setForm] = useState({ name: "", notes: "", foretag: "", typ: "maskinsopning" });
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

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", notes: "", foretag: "", typ: "maskinsopning" });
    setStartDate(undefined);
    setEndDate(undefined);
    setShowDialog(true);
  };

  const openEdit = (e: OptimalEntry) => {
    setEditing(e);
    setForm({ name: e.name, notes: e.notes, foretag: e.foretag, typ: e.typ });
    setStartDate(parseISO(e.datum_start));
    setEndDate(e.datum_end ? parseISO(e.datum_end) : undefined);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !startDate) {
      toast({ title: "Fyll i namn och startdatum", variant: "destructive" });
      return;
    }
    const payload = {
      name: form.name.trim(),
      datum_start: format(startDate, "yyyy-MM-dd"),
      datum_end: endDate ? format(endDate, "yyyy-MM-dd") : null,
      notes: form.notes,
      foretag: form.foretag.trim(),
      typ: form.typ,
    };

    if (editing) {
      const { error } = await supabase.from("optimal_entries").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Kunde inte uppdatera", variant: "destructive" }); return; }
      toast({ title: "Uppdaterad!" });
    } else {
      const { error } = await supabase.from("optimal_entries").insert(payload);
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

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from("optimal_entries").update({ status }).eq("id", id);
    load();
  };

  const formatDateRange = (start: string, end: string | null) => {
    const s = format(parseISO(start), "yyyy-MM-dd");
    if (!end) return s;
    return `${s} till ${format(parseISO(end), "yyyy-MM-dd")}`;
  };

  const stats = {
    total: entries.length,
    planned: entries.filter(e => e.status === "planned").length,
    done: entries.filter(e => e.status === "done").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          Optimal Områden
        </h1>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Lägg till område
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Totalt</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.planned}</p>
            <p className="text-xs text-muted-foreground">Planerade</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.done}</p>
            <p className="text-xs text-muted-foreground">Klara</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Områden för sopmaskin</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Inga områden tillagda ännu.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Område</TableHead>
                    <TableHead>Företag</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Anteckningar</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDateRange(entry.datum_start, entry.datum_end)}
                      </TableCell>
                      <TableCell className="font-medium">{entry.name}</TableCell>
                      <TableCell className="text-sm">{entry.foretag || "–"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={entry.typ === "blasning" ? "border-sky-500/30 text-sky-400" : "border-amber-500/30 text-amber-400"}>
                          {entry.typ === "blasning" ? "Blåsning" : "Maskinsopning"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={entry.status} onValueChange={(v) => handleStatusChange(entry.id, v)}>
                          <SelectTrigger className="w-[130px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(o => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {entry.notes || "–"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(entry)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(entry.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
              <Label>Företag</Label>
              <Input value={form.foretag} onChange={(e) => setForm({ ...form, foretag: e.target.value })} placeholder="T.ex. Optimal AB" />
            </div>
            <div className="space-y-2">
              <Label>Typ</Label>
              <Select value={form.typ} onValueChange={(v) => setForm({ ...form, typ: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Slutdatum (valfritt)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "d MMM yyyy", { locale: sv }) : "Välj datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="p-3 pointer-events-auto" />
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
