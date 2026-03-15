import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { format, addDays, subDays, isToday, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { Plus, MapPin, Hash, Pencil, Check, ChevronLeft, ChevronRight, CalendarDays, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type SourceType = "tidx" | "egna" | "tmm" | "optimal" | "project";

interface UnifiedJob {
  id: string;
  source: SourceType;
  name: string;
  address: string;
  datum: string;
  project_number: string;
  status: string;
  serviceLabel: string;
}

interface Worker {
  id: string;
  full_name: string;
}

interface Assignment {
  entry_id: string;
  entry_type: string;
  user_id: string;
}

const PROJECT_TYPES = [
{ value: "maskinsopning", label: "Maskinsopning" },
{ value: "framblasning", label: "Framblåsning" },
{ value: "snorojning", label: "Snöröjning" },
{ value: "halkbekampning", label: "Halkbekämpning" },
{ value: "ovrigt", label: "Övrigt" }];


const SOURCE_LABELS: Record<SourceType, string> = {
  tidx: "Tidx",
  egna: "Egna",
  tmm: "TMM",
  optimal: "Optimal",
  project: "Projekt"
};

const SOURCE_COLORS: Record<SourceType, string> = {
  tidx: "bg-cyan-500/15 text-cyan-400",
  egna: "bg-violet-500/15 text-violet-400",
  tmm: "bg-amber-500/15 text-amber-400",
  optimal: "bg-emerald-500/15 text-emerald-400",
  project: "bg-blue-500/15 text-blue-400"
};

export default function PlanningPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [jobs, setJobs] = useState<UnifiedJob[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editJob, setEditJob] = useState<UnifiedJob | null>(null);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
    project_number: "",
    datum_planerat: "",
    status: "pending",
    selectedWorkers: [] as string[]
  });

  const load = useCallback(async () => {
    const [tidxRes, egnaRes, tmmRes, optRes, projRes, workRes, assignRes] = await Promise.all([
    supabase.from("tidx_entries").select("id,address,omrade,datum_planerat,project_number,status"),
    supabase.from("egna_entries").select("id,address,datum_planerat,project_number,blow_status,sweep_status"),
    supabase.from("tmm_entries").select("id,beskrivning,address,datum,status,typ"),
    supabase.from("optimal_entries").select("id,name,address,datum_start,status,typ"),
    supabase.from("projects").select("id,name,address,datum_planerat,project_number,status"),
    supabase.from("profiles").select("id,full_name"),
    supabase.from("project_assignments").select("entry_id,entry_type,user_id")]
    );

    const unified: UnifiedJob[] = [];

    // Tidx
    (tidxRes.data ?? []).forEach((t: any) => {
      unified.push({
        id: t.id,
        source: "tidx",
        name: t.omrade ? `${t.omrade} – ${t.address}` : t.address,
        address: t.address,
        datum: (t.datum_planerat || "").slice(0, 10),
        project_number: t.project_number || "",
        status: t.status,
        serviceLabel: "Maskinsopning"
      });
    });

    // Egna
    (egnaRes.data ?? []).forEach((e: any) => {
      const blowDone = e.blow_status === "done";
      const sweepDone = e.sweep_status === "done";
      const status = blowDone && sweepDone ? "done" : e.blow_status === "in-progress" || e.sweep_status === "in-progress" ? "in-progress" : "pending";
      unified.push({
        id: e.id,
        source: "egna",
        name: e.address,
        address: e.address,
        datum: (e.datum_planerat || "").slice(0, 10),
        project_number: e.project_number || "",
        status,
        serviceLabel: "Egna områden"
      });
    });

    // TMM
    (tmmRes.data ?? []).forEach((t: any) => {
      unified.push({
        id: t.id,
        source: "tmm",
        name: t.beskrivning || t.address,
        address: t.address,
        datum: (t.datum || "").slice(0, 10),
        project_number: "",
        status: t.status,
        serviceLabel: t.typ === "framblasning" ? "Framblåsning" : "Maskinsopning"
      });
    });

    // Optimal
    (optRes.data ?? []).forEach((o: any) => {
      unified.push({
        id: o.id,
        source: "optimal",
        name: o.name,
        address: o.address,
        datum: (o.datum_start || "").slice(0, 10),
        project_number: "",
        status: o.status,
        serviceLabel: o.typ === "framblasning" ? "Framblåsning" : "Maskinsopning"
      });
    });

    // Projects
    (projRes.data ?? []).forEach((p: any) => {
      unified.push({
        id: p.id,
        source: "project",
        name: p.name,
        address: p.address,
        datum: (p.datum_planerat || "").slice(0, 10),
        project_number: p.project_number || "",
        status: p.status,
        serviceLabel: "Projekt"
      });
    });

    setJobs(unified);
    setWorkers(workRes.data ?? []);
    setAssignments(assignRes.data ?? []);
  }, []);

  useEffect(() => {load();}, [load]);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const filteredJobs = useMemo(() =>
  jobs.filter((j) => j.datum === dateStr),
  [jobs, dateStr]
  );

  const dateStrip = useMemo(() =>
  Array.from({ length: 9 }, (_, i) => addDays(selectedDate, i - 4)),
  [selectedDate]
  );

  function getAssignedWorkers(jobId: string, source: SourceType): string[] {
    return assignments.
    filter((a) => a.entry_id === jobId && a.entry_type === source).
    map((a) => a.user_id);
  }

  function getWorkerNames(jobId: string, source: SourceType): string {
    const ids = getAssignedWorkers(jobId, source);
    if (ids.length === 0) return "Inga tilldelade";
    return ids.map((id) => workers.find((w) => w.id === id)?.full_name || "Okänd").join(", ");
  }

  function openEdit(job: UnifiedJob) {
    setEditJob(job);
    setForm({
      name: job.name,
      address: job.address,
      project_number: job.project_number,
      datum_planerat: job.datum,
      status: job.status,
      selectedWorkers: getAssignedWorkers(job.id, job.source)
    });
  }

  function openCreate() {
    setCreating(true);
    setForm({
      name: "",
      address: "",
      project_number: "",
      datum_planerat: dateStr,
      status: "pending",
      selectedWorkers: []
    });
  }

  async function saveEdit() {
    if (!editJob) return;

    // Update the correct table based on source
    if (editJob.source === "project") {
      await supabase.from("projects").update({
        name: form.name, address: form.address,
        project_number: form.project_number,
        datum_planerat: form.datum_planerat, status: form.status
      }).eq("id", editJob.id);
    } else if (editJob.source === "tidx") {
      await supabase.from("tidx_entries").update({
        address: form.address, datum_planerat: form.datum_planerat,
        project_number: form.project_number, status: form.status
      }).eq("id", editJob.id);
    } else if (editJob.source === "egna") {
      await supabase.from("egna_entries").update({
        address: form.address, datum_planerat: form.datum_planerat,
        project_number: form.project_number
      }).eq("id", editJob.id);
    } else if (editJob.source === "tmm") {
      await supabase.from("tmm_entries").update({
        address: form.address, datum: form.datum_planerat,
        beskrivning: form.name, status: form.status
      }).eq("id", editJob.id);
    } else if (editJob.source === "optimal") {
      await supabase.from("optimal_entries").update({
        name: form.name, address: form.address,
        datum_start: form.datum_planerat, status: form.status
      }).eq("id", editJob.id);
    }

    // Update assignments
    await supabase.from("project_assignments").
    delete().
    eq("entry_id", editJob.id).
    eq("entry_type", editJob.source);

    if (form.selectedWorkers.length > 0) {
      await supabase.from("project_assignments").insert(
        form.selectedWorkers.map((uid) => ({
          entry_id: editJob.id, entry_type: editJob.source, user_id: uid
        }))
      );
    }

    toast({ title: "Uppdrag uppdaterat" });
    setEditJob(null);
    await load();
  }

  async function createProject() {
    const { data, error } = await supabase.from("projects").insert({
      name: form.name, address: form.address,
      project_number: form.project_number,
      datum_planerat: form.datum_planerat, status: form.status
    }).select("id").single();

    if (error || !data) {
      toast({ title: "Fel", description: error?.message, variant: "destructive" });
      return;
    }

    if (form.selectedWorkers.length > 0) {
      await supabase.from("project_assignments").insert(
        form.selectedWorkers.map((uid) => ({
          entry_id: data.id, entry_type: "project", user_id: uid
        }))
      );
    }

    toast({ title: "Uppdrag skapat" });
    setCreating(false);
    await load();
  }

  function toggleWorker(workerId: string) {
    setForm((prev) => ({
      ...prev,
      selectedWorkers: prev.selectedWorkers.includes(workerId) ?
      prev.selectedWorkers.filter((id) => id !== workerId) :
      [...prev.selectedWorkers, workerId]
    }));
  }

  // Count jobs per day for date strip dots
  const jobCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    jobs.forEach((j) => {map[j.datum] = (map[j.datum] || 0) + 1;});
    return map;
  }, [jobs]);

  const dialogOpen = !!editJob || creating;

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060b16] to-[#0c1324] text-[#f5faf7]/[0.02] bg-zinc-200">
      <div className="max-w-md mx-auto px-4 pt-6 space-y-5 bg-zinc-800 py-0 border-2 border-zinc-600 pb-[260px]">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">Planering</h1>
          <p className="text-sm text-white/40">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: sv })}
          </p>
        </div>

        {/* Date strip */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedDate((d) => subDays(d, 1))}
            className="p-1.5 rounded-xl text-white/40 hover:text-white/70 transition-colors">
            
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-hide">
            {dateStrip.map((day) => {
              const ds = format(day, "yyyy-MM-dd");
              const active = isSameDay(day, selectedDate);
              const today = isToday(day);
              const dayJobs = jobCountByDate[ds] || 0;
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    flex-1 min-w-[44px] py-2 rounded-xl text-center transition-all
                    ${active ?
                  "bg-blue-500 text-white shadow-lg shadow-blue-500/25" :
                  today ?
                  "bg-white/[0.08] text-white border border-white/10" :
                  "text-white/50 hover:bg-white/[0.04]"}
                  `
                  }>
                  
                  <p className="text-[9px] font-medium uppercase tracking-wider">
                    {format(day, "EEE", { locale: sv })}
                  </p>
                  <p className={`text-sm font-bold ${active ? "text-white" : ""}`}>
                    {format(day, "d")}
                  </p>
                  {dayJobs > 0 &&
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-0.5 ${active ? "bg-white" : "bg-blue-400"}`} />
                  }
                </button>);

            })}
          </div>

          <button
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            className="p-1.5 rounded-xl text-white/40 hover:text-white/70 transition-colors">
            
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Selected date label */}
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-white/70">
            {format(selectedDate, "EEEE d MMMM", { locale: sv })}
          </span>
          <span className="ml-auto text-xs text-white/30">
            {filteredJobs.length} uppdrag
          </span>
        </div>

        {/* Job cards */}
        <div className="space-y-3">
          {filteredJobs.length === 0 ?
          <div className="rounded-2xl border border-white/5 p-8 text-center shadow-xl bg-zinc-900">
              <CalendarDays className="h-8 w-8 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">Inga uppdrag denna dag</p>
              <p className="text-xs text-white/15 mt-1">Tryck + för att skapa</p>
            </div> :

          filteredJobs.map((job) => {
            const workerNames = getWorkerNames(job.id, job.source);
            const statusColor = job.status === "done" ?
            "bg-emerald-500/15 text-emerald-400" :
            job.status === "in-progress" ?
            "bg-amber-500/15 text-amber-400" :
            "bg-white/5 text-white/40";

            return (
              <div
                key={`${job.source}-${job.id}`}
                className="rounded-2xl bg-[#111827] border border-white/5 p-4 shadow-xl">
                
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${SOURCE_COLORS[job.source]}`}>
                          {SOURCE_LABELS[job.source]}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${statusColor}`}>
                          {job.status === "done" ? "Klar" : job.status === "in-progress" ? "Pågår" : "Planerad"}
                        </span>
                        {job.project_number &&
                      <span className="text-[10px] text-white/25 flex items-center gap-0.5">
                            <Hash className="h-2.5 w-2.5" />
                            {job.project_number}
                          </span>
                      }
                      </div>

                      <h3 className="font-semibold text-white text-sm leading-tight truncate">
                        {job.name}
                      </h3>

                      {job.address && job.address !== job.name &&
                    <p className="text-xs text-white/35 flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{job.address}</span>
                        </p>
                    }

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/20">{job.serviceLabel}</span>
                        <span className="text-[10px] text-white/10">•</span>
                        <p className="text-[11px] text-white/25 truncate">{workerNames}</p>
                      </div>
                    </div>

                    <button
                    onClick={() => openEdit(job)}
                    className="shrink-0 mt-1 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/5 text-xs text-white/60 hover:text-white transition-all flex items-center gap-1.5">
                    
                      <Pencil className="h-3 w-3" />
                      Ändra
                    </button>
                  </div>
                </div>);

          })
          }
        </div>

        {/* Floating create button */}
        <button
          onClick={openCreate}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-400 shadow-2xl shadow-blue-500/30 flex items-center justify-center transition-all active:scale-95">
          
          <Plus className="h-7 w-7 text-white" />
        </button>

        {/* Edit / Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (!open) {setEditJob(null);setCreating(false);}
        }}>
          <DialogContent className="bg-[#111827] border-white/5 text-white max-w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                {creating ? "Nytt uppdrag" :
                <>
                    Redigera uppdrag
                    {editJob &&
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${SOURCE_COLORS[editJob.source]}`}>
                        {SOURCE_LABELS[editJob.source]}
                      </span>
                  }
                  </>
                }
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs text-white/40 font-medium">Namn</label>
                <Input
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 rounded-xl"
                  placeholder="Projektnamn"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
                
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-white/40 font-medium">Adress</label>
                <Input
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 rounded-xl"
                  placeholder="Gatuadress"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} />
                
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/40 font-medium">Projektnummer</label>
                  <Input
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 rounded-xl"
                    placeholder="P-2026-001"
                    value={form.project_number}
                    onChange={(e) => setForm({ ...form, project_number: e.target.value })} />
                  
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/40 font-medium">Datum</label>
                  <Input
                    type="date"
                    className="bg-white/[0.04] border-white/10 text-white rounded-xl [color-scheme:dark]"
                    value={form.datum_planerat}
                    onChange={(e) => setForm({ ...form, datum_planerat: e.target.value })} />
                  
                </div>
              </div>

              {(creating || editJob?.source === "project") &&
              <div className="space-y-1.5">
                  <label className="text-xs text-white/40 font-medium">Projekttyp</label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="bg-white/[0.04] border-white/10 text-white rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2234] border-white/10">
                      {PROJECT_TYPES.map((pt) =>
                    <SelectItem key={pt.value} value={pt.value} className="text-white">{pt.label}</SelectItem>
                    )}
                    </SelectContent>
                  </Select>
                </div>
              }

              {!creating && editJob && editJob.source !== "project" &&
              <div className="space-y-1.5">
                  <label className="text-xs text-white/40 font-medium">Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="bg-white/[0.04] border-white/10 text-white rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2234] border-white/10">
                      <SelectItem value="pending" className="text-white">Planerad</SelectItem>
                      <SelectItem value="in-progress" className="text-white">Pågår</SelectItem>
                      <SelectItem value="done" className="text-white">Klar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              }

              {/* Workers */}
              <div className="space-y-2">
                <label className="text-xs text-white/40 font-medium">Tilldelade arbetare</label>
                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 space-y-2 max-h-48 overflow-y-auto">
                  {workers.length === 0 ?
                  <p className="text-xs text-white/20">Inga arbetare hittade</p> :

                  workers.map((w) =>
                  <label
                    key={w.id}
                    className="flex items-center gap-3 py-1.5 px-1 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors">
                    
                        <Checkbox
                      checked={form.selectedWorkers.includes(w.id)}
                      onCheckedChange={() => toggleWorker(w.id)}
                      className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" />
                    
                        <span className="text-sm text-white/80">{w.full_name || "Okänd"}</span>
                      </label>
                  )
                  }
                </div>
              </div>

              <Button
                onClick={creating ? createProject : saveEdit}
                disabled={!form.name.trim() && !form.address.trim()}
                className="w-full bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-xl h-11">
                
                <Check className="h-4 w-4 mr-2" />
                {creating ? "Skapa uppdrag" : "Spara ändringar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>);

}