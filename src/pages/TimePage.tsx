import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TimeEntry {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  hours: number | null;
  project: string;
  project_number: string;
  notes: string;
}

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  start_time: "",
  end_time: "",
  project: "",
  project_number: "",
  notes: "",
};

export default function TimePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const loadEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("user_time_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });
    if (error) {
      console.error("loadEntries error:", error);
      toast({ title: "Kunde inte ladda tidsrapporter", variant: "destructive" });
    }
    setEntries(
      (data ?? []).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        date: r.date,
        start_time: r.start_time,
        end_time: r.end_time,
        hours: r.hours ? Number(r.hours) : null,
        project: r.project,
        project_number: r.project_number ?? "",
        notes: r.notes,
      }))
    );
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("user_time_entries_personal")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_time_entries", filter: `user_id=eq.${user.id}` }, () => {
        loadEntries();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadEntries]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (entry: TimeEntry) => {
    setEditingId(entry.id);
    setForm({
      date: entry.date,
      start_time: entry.start_time?.slice(0, 5) ?? "",
      end_time: entry.end_time?.slice(0, 5) ?? "",
      project: entry.project,
      notes: entry.notes,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!user || !form.start_time || !form.date) {
      toast({ title: "Fyll i datum och starttid", variant: "destructive" });
      return;
    }

    const payload = {
      user_id: user.id,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time || null,
      project: form.project,
      notes: form.notes,
    };

    if (editingId) {
      const { error } = await supabase.from("user_time_entries").update(payload).eq("id", editingId);
      if (error) { toast({ title: "Kunde inte uppdatera", variant: "destructive" }); return; }
      toast({ title: "Tidspost uppdaterad!" });
    } else {
      const { error } = await supabase.from("user_time_entries").insert(payload);
      if (error) { toast({ title: "Kunde inte spara", variant: "destructive" }); return; }
      toast({ title: "Tidspost tillagd!" });
    }

    setShowDialog(false);
    loadEntries();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("user_time_entries").delete().eq("id", id);
    if (error) { toast({ title: "Kunde inte ta bort", variant: "destructive" }); return; }
    toast({ title: "Tidspost borttagen!" });
    loadEntries();
  };

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("sv-SE"); } catch { return d; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Tidrapport
        </h1>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Ny tidspost
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Mina tidsregistreringar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Laddar...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga tidsregistreringar än. Klicka "Ny tidspost" för att lägga till.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>Slut</TableHead>
                    <TableHead className="text-right">Timmar</TableHead>
                    <TableHead>Projekt</TableHead>
                    <TableHead>Anteckning</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap">{fmtDate(e.date)}</TableCell>
                      <TableCell>{e.start_time?.slice(0, 5)}</TableCell>
                      <TableCell>{e.end_time?.slice(0, 5) ?? "—"}</TableCell>
                      <TableCell className="text-right">{e.hours?.toFixed(2) ?? "—"}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{e.project || "—"}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-muted-foreground text-xs">{e.notes || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ta bort tidspost?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Denna åtgärd kan inte ångras.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(e.id)}>Ta bort</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Redigera tidspost" : "Ny tidspost"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Starttid</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sluttid</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Projekt / Uppdrag</Label>
              <Input value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} placeholder="T.ex. Tidx Sopning Centrum" />
            </div>
            <div className="space-y-2">
              <Label>Anteckning</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Valfri anteckning..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="h-4 w-4 mr-1" /> Avbryt
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" /> {editingId ? "Spara" : "Lägg till"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
