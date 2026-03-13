import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Check, Clock, Play, ListFilter, CalendarDays, ArrowUpRight, Trophy, Medal, Timer } from "lucide-react";
import { AdminTimeReminder } from "@/components/AdminTimeReminder";
import { DashboardWorkerMap } from "@/components/DashboardWorkerMap";
import { DashboardTaskCard, type DailyTask, type Status, type SourceType, type CompletionData } from "@/components/dashboard/DashboardTaskCard";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, startOfWeek, endOfWeek, getISOWeek } from "date-fns";
import { sv } from "date-fns/locale";

interface LeaderboardEntry {
  userId: string;
  name: string;
  totalHours: number;
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [allTasks, setAllTasks] = useState<DailyTask[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<number>(0);

  // Load all tasks from all sources
  const loadTasks = useCallback(async () => {
    // Load assignments to map user names
    const { data: assignments } = await supabase.from("project_assignments").select("entry_id, entry_type, user_id");
    const { data: profiles } = await supabase.from("profiles").select("id, full_name");
    const nameMap = new Map<string, string>();
    (profiles ?? []).forEach(p => nameMap.set(p.id, p.full_name || "Okänd"));

    // Build assignment lookup: entryType-entryId -> user names[]
    const assignMap = new Map<string, string[]>();
    (assignments ?? []).forEach(a => {
      const key = `${a.entry_type}-${a.entry_id}`;
      const names = assignMap.get(key) ?? [];
      names.push(nameMap.get(a.user_id) || "Okänd");
      assignMap.set(key, names);
    });

    const getAssigned = (type: string, id: string) => assignMap.get(`${type}-${id}`) ?? [];

    const tasks: DailyTask[] = [];

    // Tidx - always sweep
    const { data: tidx } = await supabase.from("tidx_entries").select("*");
    (tidx ?? []).forEach(e => {
      tasks.push({
        id: `tidx-${e.id}`, realId: e.id, address: e.address,
        projectName: e.omrade || "Tidx Sopning", serviceLabel: "Maskinsopning",
        status: e.status as Status, assignedUsers: getAssigned("tidx", e.id),
        scheduledDate: e.datum_planerat, source: "tidx", sourceField: "status",
        lat: e.lat, lng: e.lng, isSweep: true, flisLass: e.flis_lass ?? 0,
      });
    });

    // Egna – two sub-tasks per entry
    const { data: egna } = await supabase.from("egna_entries").select("*");
    (egna ?? []).forEach(e => {
      const assigned = getAssigned("egna", e.id);
      tasks.push({
        id: `egna-blow-${e.id}`, realId: e.id, address: e.address,
        projectName: "Egna Områden", serviceLabel: "Framblåsning",
        status: e.blow_status as Status, assignedUsers: assigned,
        scheduledDate: e.datum_planerat, source: "egna", sourceField: "blowStatus",
        lat: e.lat, lng: e.lng, isSweep: false,
      });
      tasks.push({
        id: `egna-sweep-${e.id}`, realId: e.id, address: e.address,
        projectName: "Egna Områden", serviceLabel: "Maskinsopning",
        status: e.sweep_status as Status, assignedUsers: assigned,
        scheduledDate: e.datum_planerat, source: "egna", sourceField: "sweepStatus",
        lat: e.lat, lng: e.lng, isSweep: true, flisLass: e.flis_lass ?? 0,
      });
    });

    // TMM
    const { data: tmm } = await supabase.from("tmm_entries").select("*");
    (tmm ?? []).forEach(e => {
      const isSweepType = (e.typ || "").toLowerCase().includes("sopning");
      tasks.push({
        id: `tmm-${e.id}`, realId: e.id, address: e.address || e.beskrivning,
        projectName: e.foretag || "TMM", serviceLabel: e.typ || "Maskinsopning",
        status: e.status as Status, assignedUsers: getAssigned("tmm", e.id),
        scheduledDate: e.datum, source: "tmm", sourceField: "status",
        lat: e.lat, lng: e.lng, isSweep: isSweepType, flisLass: e.flis_lass ?? 0,
      });
    });

    // Optimal
    const { data: optimal } = await supabase.from("optimal_entries").select("*");
    (optimal ?? []).forEach(e => {
      const isSweepType = (e.typ || "").toLowerCase().includes("sopning");
      tasks.push({
        id: `optimal-${e.id}`, realId: e.id, address: e.address || e.name,
        projectName: e.foretag || "Optimal", serviceLabel: e.typ || "Maskinsopning",
        status: e.status as Status, assignedUsers: getAssigned("optimal", e.id),
        scheduledDate: e.datum_start, source: "optimal", sourceField: "status",
        lat: e.lat, lng: e.lng, isSweep: isSweepType, flisLass: e.flis_lass ?? 0,
      });
    });

    // Projects
    const { data: projects } = await supabase.from("projects").select("*");
    (projects ?? []).forEach(e => {
      tasks.push({
        id: `project-${e.id}`, realId: e.id, address: e.address || e.name,
        projectName: e.name, serviceLabel: e.description || "Projekt",
        status: e.status as Status, assignedUsers: getAssigned("project", e.id),
        scheduledDate: e.datum_planerat, source: "project", sourceField: "status",
        lat: e.lat, lng: e.lng,
      });
    });

    tasks.sort((a, b) => (a.scheduledDate || "").localeCompare(b.scheduledDate || ""));
    setAllTasks(tasks);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Weekly hours
  useEffect(() => {
    async function loadWeeklyHours() {
      const ws = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const we = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const { data } = await supabase
        .from("user_time_entries").select("hours").gte("date", ws).lte("date", we);
      setWeeklyHours((data ?? []).reduce((s, r) => s + (Number(r.hours) || 0), 0));
    }
    loadWeeklyHours();
  }, []);

  // Leaderboard
  useEffect(() => {
    async function loadLeaderboard() {
      const { data: timeData } = await supabase.from("user_time_entries").select("user_id, hours");
      if (!timeData?.length) { setLeaderboard([]); return; }
      const hoursMap = new Map<string, number>();
      timeData.forEach(r => hoursMap.set(r.user_id, (hoursMap.get(r.user_id) ?? 0) + (Number(r.hours) || 0)));
      const userIds = Array.from(hoursMap.keys());
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const nameMap = new Map<string, string>();
      (profiles ?? []).forEach(p => nameMap.set(p.id, p.full_name || "Okänd"));
      setLeaderboard(
        userIds.map(uid => ({ userId: uid, name: nameMap.get(uid) || "Okänd", totalHours: hoursMap.get(uid) ?? 0 }))
          .filter(e => e.totalHours > 0)
          .sort((a, b) => b.totalHours - a.totalHours)
      );
    }
    loadLeaderboard();
  }, []);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const getDatePart = (s: string) => (s || "").slice(0, 10);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const selectedStr = format(selectedDate, "yyyy-MM-dd");

  // Generate 7-day range: today -3 to today +3
  const dateRange = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => addDays(today, i - 3));
  }, []);

  const filterTasks = useCallback((tasks: DailyTask[]) => {
    return tasks.filter(t => {
      if (filterSource !== "all" && t.source !== filterSource) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      return true;
    });
  }, [filterSource, filterStatus]);

  const selectedDayTasks = filterTasks(allTasks.filter(t => getDatePart(t.scheduledDate) === selectedStr));
  const isToday = selectedStr === todayStr;

  const dayTotal = selectedDayTasks.length;
  const dayStarted = selectedDayTasks.filter(t => t.status === "in-progress").length;
  const dayDone = selectedDayTasks.filter(t => t.status === "done").length;

  const mapJobs = useMemo(() => {
    const seen = new Set<string>();
    return selectedDayTasks
      .filter(t => t.lat && t.lng)
      .filter(t => { if (seen.has(t.realId)) return false; seen.add(t.realId); return true; })
      .map(t => ({ id: t.realId, name: t.projectName + " – " + t.address, address: t.address, lat: t.lat!, lng: t.lng!, status: t.status, type: t.source }));
  }, [selectedDayTasks]);

  const handleStart = async (task: DailyTask) => {
    if (!user) return;
    setUpdating(task.id);
    try {
      // Update status to in-progress
      const field = task.source === "egna"
        ? task.sourceField === "blowStatus" ? "blow_status" : "sweep_status"
        : "status";
      const update = { [field]: "in-progress" };
      if (task.source === "tidx") await supabase.from("tidx_entries").update(update).eq("id", task.realId);
      else if (task.source === "egna") await supabase.from("egna_entries").update(update).eq("id", task.realId);
      else if (task.source === "tmm") await supabase.from("tmm_entries").update(update).eq("id", task.realId);
      else if (task.source === "optimal") await supabase.from("optimal_entries").update(update).eq("id", task.realId);
      else if (task.source === "project") await supabase.from("projects").update(update).eq("id", task.realId);

      // Create a time log entry (start timer)
      await supabase.from("address_time_logs").insert({
        user_id: user.id,
        entry_id: task.realId,
        entry_type: task.source,
        start_time: new Date().toISOString(),
        note: "",
      });

      await loadTasks();
    } finally {
      setUpdating(null);
    }
  };

  const handleComplete = async (task: DailyTask, data: CompletionData) => {
    if (!user) return;
    setUpdating(task.id);
    try {
      const field = task.source === "egna"
        ? task.sourceField === "blowStatus" ? "blow_status" : "sweep_status"
        : "status";
      const statusUpdate: Record<string, any> = { [field]: "done" };
      if (data.flisLass !== undefined && data.flisLass > 0) {
        statusUpdate.flis_lass = data.flisLass;
      }
      // Add comment
      if (task.source === "tidx") {
        statusUpdate.kommentar = data.comment;
        await supabase.from("tidx_entries").update(statusUpdate).eq("id", task.realId);
      } else if (task.source === "egna") {
        statusUpdate.kommentar = data.comment;
        await supabase.from("egna_entries").update(statusUpdate).eq("id", task.realId);
      } else if (task.source === "tmm") {
        statusUpdate.notes = data.comment;
        await supabase.from("tmm_entries").update(statusUpdate).eq("id", task.realId);
      } else if (task.source === "optimal") {
        statusUpdate.notes = data.comment;
        await supabase.from("optimal_entries").update(statusUpdate).eq("id", task.realId);
      } else if (task.source === "project") {
        statusUpdate.description = data.comment;
        await supabase.from("projects").update(statusUpdate).eq("id", task.realId);
      }

      // Save images via project_images
      if (data.images.length > 0) {
        const imageRows = data.images.map(url => ({
          entry_id: task.realId,
          entry_type: task.source,
          image_url: url,
          uploaded_by: user.id,
          uploader_name: "",
        }));
        await supabase.from("project_images").insert(imageRows);
      }

      // Close any active time log and create/update the time entry
      const today = new Date().toISOString().split("T")[0];
      const startIso = new Date(`${today}T${data.startTime}`).toISOString();
      const endIso = new Date(`${today}T${data.endTime}`).toISOString();

      // Try to find and update existing active log
      const { data: activeLog } = await supabase
        .from("address_time_logs")
        .select("id")
        .eq("entry_id", task.realId)
        .eq("entry_type", task.source)
        .eq("user_id", user.id)
        .is("end_time", null)
        .limit(1);

      if (activeLog && activeLog.length > 0) {
        await supabase.from("address_time_logs").update({
          start_time: startIso,
          end_time: endIso,
          note: data.comment,
        }).eq("id", activeLog[0].id);
      } else {
        await supabase.from("address_time_logs").insert({
          user_id: user.id,
          entry_id: task.realId,
          entry_type: task.source,
          start_time: startIso,
          end_time: endIso,
          note: data.comment,
        });
      }

      await loadTasks();
    } finally {
      setUpdating(null);
    }
  };

  const handleUndo = async (task: DailyTask) => {
    if (!user) return;
    setUpdating(task.id);
    try {
      const field = task.source === "egna"
        ? task.sourceField === "blowStatus" ? "blow_status" : "sweep_status"
        : "status";
      const update = { [field]: "pending" };
      if (task.source === "tidx") await supabase.from("tidx_entries").update(update).eq("id", task.realId);
      else if (task.source === "egna") await supabase.from("egna_entries").update(update).eq("id", task.realId);
      else if (task.source === "tmm") await supabase.from("tmm_entries").update(update).eq("id", task.realId);
      else if (task.source === "optimal") await supabase.from("optimal_entries").update(update).eq("id", task.realId);
      else if (task.source === "project") await supabase.from("projects").update(update).eq("id", task.realId);
      await loadTasks();
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Arbete idag</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: sv })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AdminTimeReminder />
          <Link to="/projects" className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:text-primary/80 transition-colors group">
            Alla projekt
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="Totalt" value={dayTotal} icon={<CalendarDays className="h-4 w-4 text-primary" />} delay="0ms" />
        <SummaryCard label="Påbörjade" value={dayStarted} icon={<Play className="h-4 w-4 text-warning" />} delay="60ms" progress={dayTotal > 0 ? dayStarted / dayTotal : 0} progressColor="bg-warning" />
        <SummaryCard label="Klara" value={dayDone} icon={<Check className="h-4 w-4 text-success" />} delay="120ms" progress={dayTotal > 0 ? dayDone / dayTotal : 0} />
        <SummaryCard label={`Vecka ${getISOWeek(new Date())}`} value={`${weeklyHours.toFixed(1)}h`} icon={<Timer className="h-4 w-4 text-primary" />} delay="180ms" subtitle="Registrerade timmar" />
      </div>

      {/* Worker Map */}
      {mapJobs.length > 0 && (
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: "220ms" }}>
          <h2 className="text-sm font-semibold tracking-tight">Dagens jobb på kartan</h2>
          <DashboardWorkerMap jobs={mapJobs} />
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card/80 p-4 animate-slide-up" style={{ animationDelay: "260ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Topplista – Timmar</h2>
          </div>
          <div className="space-y-1.5">
            {leaderboard.map((entry, i) => {
              const medalColors = ["text-yellow-400", "text-gray-400", "text-amber-600"];
              return (
                <div key={entry.userId} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border/30">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {i < 3 ? <Medal className={`h-3.5 w-3.5 ${medalColors[i]}`} /> : <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>}
                  </div>
                  <p className="flex-1 text-xs font-medium truncate">{entry.name}</p>
                  <p className="text-xs font-bold text-foreground shrink-0">{entry.totalHours.toFixed(1)}h</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <ListFilter className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Filter</span>
        </div>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-border/50"><SelectValue placeholder="Källa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla typer</SelectItem>
            <SelectItem value="tidx">Tidx</SelectItem>
            <SelectItem value="egna">Egna</SelectItem>
            <SelectItem value="tmm">TMM</SelectItem>
            <SelectItem value="optimal">Optimal</SelectItem>
            <SelectItem value="project">Projekt</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-border/50"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla statusar</SelectItem>
            <SelectItem value="pending">Ej påbörjad</SelectItem>
            <SelectItem value="in-progress">Pågår</SelectItem>
            <SelectItem value="done">Klar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Today's Tasks */}
      <TaskSection title="Arbete idag" tasks={todayTasks} onStart={handleStart} onComplete={handleComplete} onUndo={handleUndo} updating={updating} />

      {/* Admin: Tomorrow & Upcoming */}
      {isAdmin && (
        <>
          {tomorrowTasks.length > 0 && (
            <TaskSection title="Arbete imorgon" tasks={tomorrowTasks} onStart={handleStart} onComplete={handleComplete} onUndo={handleUndo} updating={updating} />
          )}
          {upcomingTasks.length > 0 && (
            <TaskSection title="Kommande uppdrag" tasks={upcomingTasks} onStart={handleStart} onComplete={handleComplete} onUndo={handleUndo} updating={updating} showDate />
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon, delay, progress, progressColor, subtitle }: {
  label: string; value: string | number; icon: React.ReactNode; delay: string;
  progress?: number; progressColor?: string; subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/80 p-3.5 animate-slide-up" style={{ animationDelay: delay }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1 text-foreground tracking-tight">{value}</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">{icon}</div>
      </div>
      {progress !== undefined && (
        <div className="mt-2.5">
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${progressColor || "bg-success"}`} style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      )}
      {subtitle && <p className="text-[10px] text-muted-foreground mt-1.5">{subtitle}</p>}
    </div>
  );
}

function TaskSection({ title, tasks, onStart, onComplete, onUndo, updating, showDate = false }: {
  title: string; tasks: DailyTask[];
  onStart: (task: DailyTask) => void;
  onComplete: (task: DailyTask, data: CompletionData) => Promise<void>;
  onUndo?: (task: DailyTask) => void;
  updating: string | null; showDate?: boolean;
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/50 p-8 text-center animate-fade-in">
        <p className="text-muted-foreground text-xs">{title === "Arbete idag" ? "Inga uppdrag planerade idag" : `Inga ${title.toLowerCase()}`}</p>
        {title === "Arbete idag" && (
          <Link to="/projects" className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-3 hover:text-primary/80 transition-colors">
            Visa alla projekt <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-2.5 animate-fade-in">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <div className="grid gap-2">
        {tasks.map(task => (
          <DashboardTaskCard key={task.id} task={task} onStart={onStart} onComplete={onComplete} onUndo={onUndo} updating={updating} showDate={showDate} />
        ))}
      </div>
    </div>
  );
}
