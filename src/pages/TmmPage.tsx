import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brush, Plus, CalendarIcon, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TmmEntry {
  id: string;
  datum: string;
  beskrivning: string;
  ansvarig: string;
  tid: string;
  maskiner: number;
  status: string;
  notes: string;
}

const statusOptions = [
  { value: "pending", label: "Ej påbörjad" },
  { value: "in-progress", label: "Pågår" },
  { value: "done", label: "Klar" },
];

export default function TmmPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<TmmEntry[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<TmmEntry | null>(null);
  const [form, setForm] = useState({ beskrivning: "Sopning", ansvarig: "", tid: "07-16", maskiner: "2", notes: "" });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("tmm_entries")
      .select("*")
      .order("datum", { ascending: true });
    setEntries((data as TmmEntry[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ beskrivning: "Sopning", ansvarig: "", tid: "07-16", maskiner: "2", notes: "" });
    setSelectedDate(undefined);
    setShowDialog(true);
  };

  const openEdit = (e: TmmEntry) => {
    setEditing(e);
    setForm({
      beskrivning: e.beskrivning,
      ansvarig: e.ansvarig,
      tid: e.tid,
      maskiner: String(e.maskiner),
      notes: e.notes,
    });
    setSelectedDate(parseISO(e.datum));
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!selectedDate || !form.ansvarig.trim()) {
      toast({ title: "Fyll i datum och ansvarig", variant: "destructive" });
      return;
    }
    const payload = {
      datum: format(selectedDate, "yyyy-MM-dd"),
      beskrivning: form.beskrivning,
      ansvarig: form.ansvarig.trim(),
      tid: form.tid,
      maskiner: parseInt(form.maskiner) || 1,
      notes: form.notes,
    };

    if (editing) {
      const { error } = await supabase.from("tmm_entries").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Kunde inte uppdatera", variant: "destructive" }); return; }
      toast({ title: "Uppdaterad!" });
    } else {
      const { error } = await supabase.from("tmm_entries").insert(payload);
      if (error) { toast({ title: "Kunde inte skapa", variant: "destructive" }); return; }
      toast({ title: "Tillagd!" });
    }
    setShowDialog(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("tmm_entries").delete().eq("id", id);
    toast({ title: "Borttagen" });
    load();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from("tmm_entries").update({ status }).eq("id", id);
    load();
  };

  const stats = {
    total: entries.length,
    done: entries.filter(e => e.status === "done").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brush className="h-6 w-6 text-primary" />
          Sopningar för TMM
        </h1>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Lägg till sopning
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Totalt</p>
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
          <CardTitle className="text-base">Planerade sopningar</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Inga sopningar tillagda ännu.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Beskrivning</TableHead>
                    <TableHead>Ansvarig</TableHead>
                    <TableHead>Tid</TableHead>
                    <TableHead>Maskiner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm whitespace-nowrap font-medium">
                        {format(parseISO(entry.datum), "yyyy-MM-dd")}
                      </TableCell>
                      <TableCell>{entry.beskrivning}</TableCell>
                      <TableCell>{entry.ansvarig}</TableCell>
                      <TableCell>{entry.tid}</TableCell>
                      <TableCell className="text-center">{entry.maskiner}</TableCell>
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
            <DialogTitle>{editing ? "Redigera sopning" : "Lägg till sopning"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Datum *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "d MMM yyyy", { locale: sv }) : "Välj datum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Beskrivning</Label>
              <Input value={form.beskrivning} onChange={(e) => setForm({ ...form, beskrivning: e.target.value })} placeholder="T.ex. Sopning" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ansvarig *</Label>
                <Input value={form.ansvarig} onChange={(e) => setForm({ ...form, ansvarig: e.target.value })} placeholder="T.ex. Emelie" />
              </div>
              <div className="space-y-2">
                <Label>Tid</Label>
                <Input value={form.tid} onChange={(e) => setForm({ ...form, tid: e.target.value })} placeholder="T.ex. 07-16" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Antal maskiner</Label>
              <Input type="number" min="1" value={form.maskiner} onChange={(e) => setForm({ ...form, maskiner: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Anteckningar</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
