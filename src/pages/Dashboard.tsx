import { useState, useEffect, useCallback, useMemo } from "react";
import { getTidxEntries, getEgnaEntries, updateTidxEntry, updateEgnaEntry, type TidxEntry, type EgnaEntry } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Fan, Wind, Check, Clock, Play, ListFilter, CalendarDays, ArrowUpRight, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format, addDays, isToday, isTomorrow, isAfter, parseISO } from "date-fns";
import { sv } from "date-fns/locale";

type Status = "pending" | "in-progress" | "done";
type ServiceType = "blow" | "sweep";

interface DailyTask {
  id: string;
  realId: string;
  address: string;
  projectName: string;
  serviceType: ServiceType;
  serviceLabel: string;
  status: Status;
  assignedUser: string;
  scheduledDate: string;
  source: "tidx" | "egna";
  sourceField: "status" | "blowStatus" | "sweepStatus";
}

function parseDateSafe(dateStr: string): Date | null {
  if (!dateStr) return null;
  try {
    // Try ISO format first
    const d = parseISO(dateStr);
    if (!isNaN(d.getTime())) return d;
    return null;
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [tidxEntries, setTidxEntries] = useState<TidxEntry[]>([]);
  const [egnaEntries, setEgnaEntries] = useState<EgnaEntry[]>([]);
  const [filterService, setFilterService] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  // Check admin
  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const refresh = useCallback(async () => {
    const [tidx, egna] = await Promise.all([getTidxEntries(), getEgnaEntries()]);
    setTidxEntries(tidx);
    setEgnaEntries(egna);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Build unified task list
  const allTasks: DailyTask[] = useMemo(() => {
    const tasks: DailyTask[] = [];

    tidxEntries.forEach((e) => {
      tasks.push({
        id: `tidx-sweep-${e.id}`,
        realId: e.id,
        address: e.address,
        projectName: e.omrade || "Tidx Sopning",
        serviceType: "sweep",
        serviceLabel: "Maskinsopning",
        status: e.status,
        assignedUser: e.ansvarig,
        scheduledDate: e.datumPlanerat,
        source: "tidx",
        sourceField: "status",
      });
    });

    egnaEntries.forEach((e) => {
      tasks.push({
        id: `egna-blow-${e.id}`,
        realId: e.id,
        address: e.address,
        projectName: "Egna Områden",
        serviceType: "blow",
        serviceLabel: "Framblåsning",
        status: e.blowStatus,
        assignedUser: e.ansvarig,
        scheduledDate: e.datumPlanerat,
        source: "egna",
        sourceField: "blowStatus",
      });
      tasks.push({
        id: `egna-sweep-${e.id}`,
        realId: e.id,
        address: e.address,
        projectName: "Egna Områden",
        serviceType: "sweep",
        serviceLabel: "Maskinsopning",
        status: e.sweepStatus,
        assignedUser: e.ansvarig,
        scheduledDate: e.datumPlanerat,
        source: "egna",
        sourceField: "sweepStatus",
      });
    });

    // Sort by scheduled date
    tasks.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    return tasks;
  }, [tidxEntries, egnaEntries]);

  // Extract just the date part (first 10 chars) from datum_planerat which may contain "2026-03-16 kvällstid 21:00"
  const getDatePart = (s: string) => (s || "").slice(0, 10);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const filterTasks = useCallback((tasks: DailyTask[]) => {
    return tasks.filter((t) => {
      if (filterService !== "all" && t.serviceType !== filterService) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterUser !== "all" && t.assignedUser !== filterUser) return false;
      return true;
    });
  }, [filterService, filterStatus, filterUser]);

  const todayTasks = filterTasks(allTasks.filter((t) => getDatePart(t.scheduledDate) === todayStr));
  const tomorrowTasks = filterTasks(allTasks.filter((t) => getDatePart(t.scheduledDate) === tomorrowStr));
  const upcomingTasks = filterTasks(allTasks.filter((t) => {
    const dp = getDatePart(t.scheduledDate);
    return dp > tomorrowStr;
  }));

  // Stats
  const todayTotal = todayTasks.length;
  const todayStarted = todayTasks.filter((t) => t.status === "in-progress").length;
  const todayDone = todayTasks.filter((t) => t.status === "done").length;

  // Unique users for filter
  const allUsers = useMemo(() =>
    Array.from(new Set(allTasks.map((t) => t.assignedUser).filter(Boolean))).sort()
  , [allTasks]);

  // Status update
  const handleStatusUpdate = async (task: DailyTask, newStatus: Status) => {
    setUpdating(task.id);
    try {
      if (task.source === "tidx") {
        await updateTidxEntry(task.realId, { status: newStatus });
      } else {
        if (task.sourceField === "blowStatus") {
          await updateEgnaEntry(task.realId, { blowStatus: newStatus });
        } else {
          await updateEgnaEntry(task.realId, { sweepStatus: newStatus });
        }
      }
      await refresh();
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Arbete idag</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: sv })}
          </p>
        </div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:text-primary/80 transition-colors group"
        >
          Visa alla projekt
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card-primary animate-slide-up" style={{ animationDelay: "0ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Totalt jobb idag</p>
              <p className="text-5xl font-bold mt-2 text-foreground tracking-tight">{todayTotal}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: "80ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Påbörjade</p>
              <p className="text-4xl font-bold mt-2 text-foreground tracking-tight">{todayStarted}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-warning/15 flex items-center justify-center">
              <Play className="h-4 w-4 text-warning" />
            </div>
          </div>
          {todayTotal > 0 && (
            <div className="mt-4">
              <div className="progress-track">
                <div className="progress-fill bg-warning" style={{ width: `${Math.round((todayStarted / todayTotal) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: "160ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Klara</p>
              <p className="text-4xl font-bold mt-2 text-foreground tracking-tight">{todayDone}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-success/15 flex items-center justify-center">
              <Check className="h-4 w-4 text-success" />
            </div>
          </div>
          {todayTotal > 0 && (
            <div className="mt-4">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${Math.round((todayDone / todayTotal) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ListFilter className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Filter</span>
        </div>
        <Select value={filterService} onValueChange={setFilterService}>
          <SelectTrigger className="w-[160px] h-9 text-xs bg-card border-border/50">
            <SelectValue placeholder="Tjänst" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla tjänster</SelectItem>
            <SelectItem value="blow">Framblåsning</SelectItem>
            <SelectItem value="sweep">Maskinsopning</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-9 text-xs bg-card border-border/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla statusar</SelectItem>
            <SelectItem value="pending">Ej påbörjad</SelectItem>
            <SelectItem value="in-progress">Påbörjad</SelectItem>
            <SelectItem value="done">Klar</SelectItem>
          </SelectContent>
        </Select>
        {allUsers.length > 0 && (
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-[160px] h-9 text-xs bg-card border-border/50">
              <SelectValue placeholder="Ansvarig" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla ansvariga</SelectItem>
              {allUsers.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Today's Tasks */}
      <TaskSection title="Arbete idag" tasks={todayTasks} onStatusUpdate={handleStatusUpdate} updating={updating} />

      {/* Admin: Tomorrow & Upcoming */}
      {isAdmin && (
        <>
          {tomorrowTasks.length > 0 && (
            <TaskSection title="Arbete imorgon" tasks={tomorrowTasks} onStatusUpdate={handleStatusUpdate} updating={updating} />
          )}
          {upcomingTasks.length > 0 && (
            <TaskSection title="Kommande uppdrag" tasks={upcomingTasks} onStatusUpdate={handleStatusUpdate} updating={updating} showDate />
          )}
        </>
      )}
    </div>
  );
}

// --- Task Section ---
function TaskSection({
  title,
  tasks,
  onStatusUpdate,
  updating,
  showDate = false,
}: {
  title: string;
  tasks: DailyTask[];
  onStatusUpdate: (task: DailyTask, status: Status) => void;
  updating: string | null;
  showDate?: boolean;
}) {
  if (tasks.length === 0) {
    return (
      <div className="glass-card p-8 text-center animate-fade-in">
        <p className="text-muted-foreground text-sm">{title === "Arbete idag" ? "Inga uppdrag planerade idag" : `Inga ${title.toLowerCase()}`}</p>
        {title === "Arbete idag" && (
          <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium mt-4 hover:text-primary/80 transition-colors">
            Visa alla projekt <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <div className="grid gap-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onStatusUpdate={onStatusUpdate} updating={updating} showDate={showDate} />
        ))}
      </div>
    </div>
  );
}

// --- Task Card ---
function TaskCard({
  task,
  onStatusUpdate,
  updating,
  showDate,
}: {
  task: DailyTask;
  onStatusUpdate: (task: DailyTask, status: Status) => void;
  updating: string | null;
  showDate?: boolean;
}) {
  const isUpdating = updating === task.id;
  const isDone = task.status === "done";
  const ServiceIcon = task.serviceType === "blow" ? Fan : Wind;

  return (
    <div className={`glass-card p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-300 ${isDone ? "opacity-60" : ""} ${isUpdating ? "animate-pulse" : ""}`}>
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${task.serviceType === "blow" ? "bg-primary/15" : "bg-accent/30"}`}>
        <ServiceIcon className={`h-5 w-5 ${task.serviceType === "blow" ? "text-primary" : "text-accent-foreground"}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground/90 truncate">{task.address}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{task.serviceLabel}</span>
          {task.assignedUser && (
            <>
              <span className="text-border">·</span>
              <span className="text-xs text-muted-foreground">{task.assignedUser}</span>
            </>
          )}
          {showDate && task.scheduledDate && (
            <>
              <span className="text-border">·</span>
              <span className="text-xs text-muted-foreground">{task.scheduledDate}</span>
            </>
          )}
          <Link
            to={task.source === "tidx" ? "/tidx" : "/egna"}
            className="inline-flex items-center gap-0.5 text-[11px] text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {task.source === "tidx" ? "Tidx" : "Egna"}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Status */}
      <div className="shrink-0">
        <StatusBadge status={task.status} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {task.status === "pending" && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-warning/30 text-warning hover:bg-warning/10 hover:text-warning"
            onClick={() => onStatusUpdate(task, "in-progress")}
            disabled={isUpdating}
          >
            <Play className="h-3 w-3" />
            Starta
          </Button>
        )}
        {task.status !== "done" && (
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => onStatusUpdate(task, "done")}
            disabled={isUpdating}
          >
            <Check className="h-3 w-3" />
            Klar
          </Button>
        )}
      </div>
    </div>
  );
}
