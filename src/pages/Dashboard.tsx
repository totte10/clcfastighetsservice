import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Check,
  Play,
  CalendarDays,
  Timer,
  Trophy,
  Medal,
  ArrowUpRight
} from "lucide-react";
import { AdminTimeReminder } from "@/components/AdminTimeReminder";
import { DashboardWorkerMap } from "@/components/DashboardWorkerMap";
import {
  DashboardTaskCard,
  type DailyTask,
  type Status,
  type CompletionData
} from "@/components/dashboard/DashboardTaskCard";
import { Link } from "react-router-dom";
import { format, getISOWeek } from "date-fns";
import { sv } from "date-fns/locale";

interface LeaderboardEntry {
  userId: string;
  name: string;
  totalHours: number;
}

export default function Dashboard() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const loadTasks = useCallback(async () => {

    const { data: projects } = await supabase
      .from("projects")
      .select("*");

    const mapped: DailyTask[] = (projects ?? []).map((p: any) => ({
      id: `project-${p.id}`,
      realId: p.id,
      address: p.address,
      projectName: p.name,
      serviceLabel: p.description || "Projekt",
      status: p.status as Status,
      scheduledDate: p.datum_planerat,
      source: "project",
      sourceField: "status",
      lat: p.lat,
      lng: p.lng
    }));

    setTasks(mapped);

  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {

    async function loadHours() {

      const { data } = await supabase
        .from("user_time_entries")
        .select("hours");

      const total =
        (data ?? []).reduce(
          (s, r) => s + (Number(r.hours) || 0),
          0
        );

      setWeeklyHours(total);
    }

    loadHours();

  }, []);

  useEffect(() => {

    async function loadLeaderboard() {

      const { data } = await supabase
        .from("user_time_entries")
        .select("user_id,hours");

      if (!data) return;

      const map = new Map<string, number>();

      data.forEach((r: any) => {
        map.set(
          r.user_id,
          (map.get(r.user_id) ?? 0) + (Number(r.hours) || 0)
        );
      });

      const ids = Array.from(map.keys());

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", ids);

      const nameMap = new Map<string, string>();

      profiles?.forEach((p: any) =>
        nameMap.set(p.id, p.full_name)
      );

      setLeaderboard(
        ids
          .map((id) => ({
            userId: id,
            name: nameMap.get(id) || "Okänd",
            totalHours: map.get(id) ?? 0
          }))
          .sort((a, b) => b.totalHours - a.totalHours)
      );
    }

    loadLeaderboard();

  }, []);

  const todayTasks = tasks.filter(
    (t) => (t.scheduledDate || "").slice(0, 10) === todayStr
  );

  const done = todayTasks.filter(
    (t) => t.status === "done"
  ).length;

  const started = todayTasks.filter(
    (t) => t.status === "in-progress"
  ).length;

  const mapJobs = useMemo(
    () =>
      todayTasks
        .filter((t) => t.lat && t.lng)
        .map((t) => ({
          id: t.realId,
          name: t.projectName,
          address: t.address,
          lat: t.lat!,
          lng: t.lng!,
          status: t.status,
          type: t.source
        })),
    [todayTasks]
  );

  return (
    <div className="space-y-4 pb-24">

      {/* Header */}

      <div className="flex items-end justify-between">

        <div>

          <h1 className="text-xl font-bold">
            Arbete idag
          </h1>

          <p className="text-xs text-muted-foreground">
            {format(new Date(), "EEEE d MMMM yyyy", {
              locale: sv
            })}
          </p>

        </div>

        <div className="flex items-center gap-2">

          <AdminTimeReminder />

          <Link
            to="/projects"
            className="text-xs text-primary flex items-center gap-1"
          >
            Alla projekt
            <ArrowUpRight className="h-3 w-3" />
          </Link>

        </div>

      </div>

      {/* Stats */}

      <div className="grid grid-cols-2 gap-3">

        <Stat
          label="Totalt"
          value={todayTasks.length}
          icon={<CalendarDays size={16} />}
        />

        <Stat
          label="Påbörjade"
          value={started}
          icon={<Play size={16} />}
        />

        <Stat
          label="Klara"
          value={done}
          icon={<Check size={16} />}
        />

        <Stat
          label={`Vecka ${getISOWeek(new Date())}`}
          value={`${weeklyHours.toFixed(1)}h`}
          icon={<Timer size={16} />}
        />

      </div>

      {/* Map */}

      {mapJobs.length > 0 && (

        <div>

          <h2 className="text-xs font-semibold mb-2">
            Dagens jobb
          </h2>

          <DashboardWorkerMap jobs={mapJobs} />

        </div>

      )}

      {/* Leaderboard */}

      {leaderboard.length > 0 && (

        <div className="rounded-xl border border-border/40 bg-card/80 p-3">

          <div className="flex items-center gap-2 mb-2">

            <Trophy className="h-4 w-4 text-primary" />

            <p className="text-xs font-semibold">
              Topplista – Timmar
            </p>

          </div>

          {leaderboard.slice(0, 5).map((u, i) => (

            <div
              key={u.userId}
              className="flex items-center justify-between py-1 text-xs"
            >

              <div className="flex items-center gap-2">

                {i < 3 ? (
                  <Medal className="h-3 w-3 text-yellow-400" />
                ) : (
                  <span className="text-muted-foreground">
                    {i + 1}
                  </span>
                )}

                {u.name}

              </div>

              <span className="font-semibold">
                {u.totalHours.toFixed(1)}h
              </span>

            </div>

          ))}

        </div>

      )}

      {/* Tasks */}

      <div className="space-y-2">

        {todayTasks.length === 0 && (

          <div className="text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl p-6">
            Inga uppdrag planerade idag
          </div>

        )}

        {todayTasks.map((task) => (

          <DashboardTaskCard
            key={task.id}
            task={task}
            updating={updating}
            onStart={() => {}}
            onComplete={() => {}}
          />

        ))}

      </div>

    </div>
  );
}

function Stat({
  label,
  value,
  icon
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (

    <div className="rounded-xl border border-border/40 bg-card/80 p-3 flex justify-between items-center">

      <div>

        <p className="text-[10px] uppercase text-muted-foreground">
          {label}
        </p>

        <p className="text-xl font-bold">
          {value}
        </p>

      </div>

      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        {icon}
      </div>

    </div>

  );
}
