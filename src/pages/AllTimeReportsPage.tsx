import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Clock, Filter, Plus, Pencil, Trash2, Save, X, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Navigate } from "react-router-dom";

interface TimeEntry {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  hours: number | null;
  project: string;
  notes: string;
  userName?: string;
}

export default function AllTimeReportsPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formUserId, setFormUserId] = useState("");
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], start_time: "", end_time: "", project: "", notes: "" });
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const { toast } = useToast();

  // Check admin
  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: timeData }, { data: profilesData }] = await Promise.all([
      supabase.from("user_time_entries").select("*").order("date", { ascending: false }),
      supabase.from("profiles").select("id, full_name"),
    ]);

    const nameMap = new Map<string, string>();
    const userList: { id: string; name: string }[] = [];
    profilesData?.forEach((p) => {
      nameMap.set(p.id, p.full_name || p.id.slice(0, 8));
      userList.push({ id: p.id, name: p.full_name || p.id.slice(0, 8) });
    });
    setUsers(userList.sort((a, b) => a.name.localeCompare(b.name)));

    setEntries(
      (timeData ?? []).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        date: r.date,
        start_time: r.start_time,
        end_time: r.end_time,
        hours: r.hours ? Number(r.hours) : null,
        project: r.project,
        notes: r.notes,
        userName: nameMap.get(r.user_id) || r.user_id.slice(0, 8),
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  // Realtime
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("user_time_entries_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_time_entries" }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, loadData]);

  if (isAdmin === null) return <div className="flex items-center justify-center p-12 text-muted-foreground">Kontrollerar behörighet...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const uniqueProjects = Array.from(new Set(entries.map((e) => e.project).filter(Boolean))).sort();

  const filtered = entries.filter((e) => {
    if (filterUser !== "all" && e.user_id !== filterUser) return false;
    if (filterProject !== "all" && e.project !== filterProject) return false;
    if (filterFrom && e.date < filterFrom) return false;
    if (filterTo && e.date > filterTo) return false;
    return true;
  });

  const totalHours = filtered.reduce((s, e) => s + (e.hours ?? 0), 0);
  const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString("sv-SE"); } catch { return d; } };

  const exportCSV = () => {
    const header = "Datum;Användare;Start;Slut;Timmar;Projekt;Anteckning";
    const rows = filtered.map((e) =>
      [fmtDate(e.date), e.userName ?? "", e.start_time?.slice(0, 5), e.end_time?.slice(0, 5) ?? "", e.hours?.toFixed(2) ?? "", e.project, e.notes].join(";")
    );
    const csv = [header, ...rows, `;;;;;;Totalt: ${totalHours.toFixed(2)}h`].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `samlad-tidsrapport-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast({ title: "CSV exporterad!" });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Samlad Tidsrapport", 14, 18);
    doc.setFontSize(10);
    doc.text(`Genererad: ${new Date().toLocaleDateString("sv-SE")}`, 14, 26);
    autoTable(doc, {
      startY: 32,
      head: [["Datum", "Användare", "Start", "Slut", "Timmar", "Projekt", "Anteckning"]],
      body: filtered.map((e) => [
        fmtDate(e.date), e.userName ?? "", e.start_time?.slice(0, 5), e.end_time?.slice(0, 5) ?? "", e.hours?.toFixed(2) ?? "", e.project, e.notes,
      ]),
      foot: [["", "", "", "Totalt", totalHours.toFixed(2) + "h", "", ""]],
      styles: { fontSize: 8 },
    });
    doc.save(`samlad-tidsrapport-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "PDF exporterad!" });
  };

  const openAdd = () => {
    setEditingId(null);
    setFormUserId(users[0]?.id ?? "");
    setForm({ date: new Date().toISOString().split("T")[0], start_time: "", end_time: "", project: "", notes: "" });
    setShowDialog(true);
  };

  const openEdit = (entry: TimeEntry) => {
    setEditingId(entry.id);
    setFormUserId(entry.user_id);
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
    if (!formUserId || !form.start_time || !form.date) {
      toast({ title: "Fyll i användare, datum och starttid", variant: "destructive" });
      return;
    }
    const payload = {
      user_id: formUserId,
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
    loadData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("user_time_entries").delete().eq("id", id);
    if (error) { toast({ title: "Kunde inte ta bort", variant: "destructive" }); return; }
    toast({ title: "Tidspost borttagen!" });
    loadData();
  };

  // Summary by user
  const byUser = new Map<string, { name: string; totalHours: number; count: number }>();
  filtered.forEach((e) => {
    const existing = byUser.get(e.user_id);
    if (existing) { existing.totalHours += e.hours ?? 0; existing.count += 1; }
    else byUser.set(e.user_id, { name: e.userName ?? "", totalHours: e.hours ?? 0, count: 1 });
  });
  const summaryRows = Array.from(byUser.values()).sort((a, b) => b.totalHours - a.totalHours);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Samlad Tidsrapport
        </h1>
        <div className="flex gap-2">
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Lägg till
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={filtered.length === 0}>
            <FileText className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Filter className="h-4 w-4" /> Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Användare</Label>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla</SelectItem>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Projekt</Label>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla</SelectItem>
                  {uniqueProjects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Från datum</Label>
              <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Till datum</Label>
              <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Sammanställning per användare</CardTitle></CardHeader>
        <CardContent>
          {summaryRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga tidsregistreringar att visa.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Användare</TableHead>
                  <TableHead className="text-right">Antal poster</TableHead>
                  <TableHead className="text-right">Totalt (h)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryRows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right">{r.count}</TableCell>
                    <TableCell className="text-right font-semibold">{r.totalHours.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2">
                  <TableCell className="font-bold">Totalt</TableCell>
                  <TableCell className="text-right font-bold">{filtered.length}</TableCell>
                  <TableCell className="text-right font-bold">{totalHours.toFixed(2)}h</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detailed */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Alla tidsregistreringar ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Laddar...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga poster matchar filtret.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Användare</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>Slut</TableHead>
                    <TableHead className="text-right">Timmar</TableHead>
                    <TableHead>Projekt</TableHead>
                    <TableHead>Anteckning</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap">{fmtDate(e.date)}</TableCell>
                      <TableCell>{e.userName}</TableCell>
                      <TableCell>{e.start_time?.slice(0, 5)}</TableCell>
                      <TableCell>{e.end_time?.slice(0, 5) ?? "—"}</TableCell>
                      <TableCell className="text-right">{e.hours?.toFixed(2) ?? "—"}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{e.project || "—"}</TableCell>
                      <TableCell className="max-w-[120px] truncate text-muted-foreground text-xs">{e.notes || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ta bort tidspost?</AlertDialogTitle>
                                <AlertDialogDescription>Denna åtgärd kan inte ångras.</AlertDialogDescription>
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
            <div className="space-y-2">
              <Label>Användare</Label>
              <Select value={formUserId} onValueChange={setFormUserId}>
                <SelectTrigger><SelectValue placeholder="Välj användare" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}><X className="h-4 w-4 mr-1" /> Avbryt</Button>
            <Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> {editingId ? "Spara" : "Lägg till"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
