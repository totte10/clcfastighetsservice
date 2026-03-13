import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Plus, Pencil, Trash2, Save, X, Search, ImagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EntryImageUpload } from "@/components/EntryImageUpload";

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

interface ProjectOption {
  id: string;
  label: string;
  address: string;
  source: string;
  projectNumber: string;
}

const JOB_TYPES = [
  "Maskinsopning",
  "Framblåsning",
  "Snöröjning",
  "Halkbekämpning",
  "Övrigt",
];

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  start_time: "",
  end_time: "",
  project: "",
  project_number: "",
  notes: "",
  job_type: "",
  flis_lass: "",
  images: [] as string[],
};

export default function TimePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  // Project search
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [projectSearchOpen, setProjectSearchOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");

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

  useEffect(() => { loadEntries(); }, [loadEntries]);

  // Load available projects from all sources
  const loadProjectOptions = useCallback(async () => {
    const options: ProjectOption[] = [];

    const [tidx, egna, tmm, optimal, projects] = await Promise.all([
      supabase.from("tidx_entries").select("id, address, omrade, project_number"),
      supabase.from("egna_entries").select("id, address, project_number"),
      supabase.from("tmm_entries").select("id, address, beskrivning, foretag"),
      supabase.from("optimal_entries").select("id, address, name, foretag"),
      supabase.from("projects").select("id, address, name, project_number"),
    ]);

    (tidx.data ?? []).forEach(e => options.push({
      id: e.id, label: `Tidx: ${e.omrade || e.address}`, address: e.address,
      source: "tidx", projectNumber: e.project_number || "",
    }));
    (egna.data ?? []).forEach(e => options.push({
      id: e.id, label: `Egna: ${e.address}`, address: e.address,
      source: "egna", projectNumber: e.project_number || "",
    }));
    (tmm.data ?? []).forEach(e => options.push({
      id: e.id, label: `TMM: ${e.foretag || e.beskrivning} - ${e.address}`, address: e.address,
      source: "tmm", projectNumber: "",
    }));
    (optimal.data ?? []).forEach(e => options.push({
      id: e.id, label: `Optimal: ${e.name} - ${e.address}`, address: e.address,
      source: "optimal", projectNumber: "",
    }));
    (projects.data ?? []).forEach(e => options.push({
      id: e.id, label: `Projekt: ${e.name} - ${e.address}`, address: e.address,
      source: "project", projectNumber: e.project_number || "",
    }));

    setProjectOptions(options);
  }, []);

  useEffect(() => { loadProjectOptions(); }, [loadProjectOptions]);

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

  const filteredProjects = useMemo(() => {
    if (!projectSearch) return projectOptions;
    const q = projectSearch.toLowerCase();
    return projectOptions.filter(p =>
      p.label.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
    );
  }, [projectOptions, projectSearch]);

  const isSweepType = form.job_type.toLowerCase().includes("maskinsopning");

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
      project_number: entry.project_number,
      notes: entry.notes,
      job_type: "",
      flis_lass: "",
      images: [],
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!user || !form.start_time || !form.date) {
      toast({ title: "Fyll i datum och starttid", variant: "destructive" });
      return;
    }
    if (!editingId && !form.job_type) {
      toast({ title: "Välj typ av uppdrag", variant: "destructive" });
      return;
    }
    if (!editingId && isSweepType) {
      if (!form.end_time) {
        toast({ title: "Sluttid är obligatoriskt för maskinsopning", variant: "destructive" });
        return;
      }
      const flis = parseInt(form.flis_lass);
      if (!flis || flis < 1 || flis > 10) {
        toast({ title: "Deponi måste vara mellan 1-10", variant: "destructive" });
        return;
      }
    }

    const projectLabel = form.job_type ? `${form.project} (${form.job_type})` : form.project;
    const noteParts: string[] = [];
    if (form.notes) noteParts.push(form.notes);
    if (isSweepType && form.flis_lass) noteParts.push(`Deponi: ${form.flis_lass} lass`);
    if (form.images.length > 0) noteParts.push(`Bilder: ${form.images.length} st`);

    const payload = {
      user_id: user.id,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time || null,
      project: editingId ? form.project : projectLabel,
      project_number: form.project_number,
      notes: noteParts.join(" | "),
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

  const selectProject = (opt: ProjectOption) => {
    setForm(f => ({ ...f, project: opt.label, project_number: opt.projectNumber }));
    setProjectSearchOpen(false);
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Redigera tidspost" : "Ny tidspost"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Project search - only for new entries */}
            {!editingId && (
              <div className="space-y-2">
                <Label>Sök adress / projekt *</Label>
                <Popover open={projectSearchOpen} onOpenChange={setProjectSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal truncate">
                      <Search className="mr-2 h-4 w-4 shrink-0" />
                      {form.project || "Välj projekt..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Sök adress eller projektnamn..."
                        value={projectSearch}
                        onValueChange={setProjectSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Inga projekt hittades.</CommandEmpty>
                        <CommandGroup>
                          {filteredProjects.slice(0, 20).map(opt => (
                            <CommandItem
                              key={`${opt.source}-${opt.id}`}
                              value={opt.label}
                              onSelect={() => selectProject(opt)}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm">{opt.label}</span>
                                {opt.projectNumber && (
                                  <span className="text-xs text-muted-foreground">{opt.projectNumber}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Job type - only for new entries */}
            {!editingId && (
              <div className="space-y-2">
                <Label>Typ av uppdrag *</Label>
                <Select value={form.job_type} onValueChange={v => setForm(f => ({ ...f, job_type: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj typ..." />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date + time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Datum *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Starttid *</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm(f => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Sluttid {isSweepType && !editingId ? "*" : ""}</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm(f => ({ ...f, end_time: e.target.value }))} />
              </div>
            </div>

            {/* Deponi - only for maskinsopning on new entries */}
            {!editingId && isSweepType && (
              <div className="space-y-2">
                <Label>Deponi (fulla lass med flis) * (1-10)</Label>
                <Select value={form.flis_lass} onValueChange={v => setForm(f => ({ ...f, flis_lass: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj antal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Edit mode: project fields */}
            {editingId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Projekt / Uppdrag</Label>
                  <Input value={form.project} onChange={(e) => setForm(f => ({ ...f, project: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Projektnummer</Label>
                  <Input value={form.project_number} onChange={(e) => setForm(f => ({ ...f, project_number: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Images - only for new entries */}
            {!editingId && (
              <div className="space-y-2">
                <Label>Bilder (valfritt)</Label>
                <EntryImageUpload
                  images={form.images}
                  onImagesChange={(imgs) => setForm(f => ({ ...f, images: imgs }))}
                />
              </div>
            )}

            {/* Comment */}
            <div className="space-y-2">
              <Label>Kommentar (valfritt)</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Valfri anteckning..."
                rows={2}
              />
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
