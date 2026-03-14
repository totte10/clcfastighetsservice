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
  ArrowUpRight } from
"lucide-react";
import { AdminTimeReminder } from "@/components/AdminTimeReminder";
import { DashboardWorkerMap } from "@/components/DashboardWorkerMap";
import {
  DashboardTaskCard,
  type DailyTask,
  type Status } from
"@/components/dashboard/DashboardTaskCard";
import { Link } from "react-router-dom";
import { format, getISOWeek, addDays } from "date-fns";
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

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const loadTasks = useCallback(async () => {

    const { data } = await supabase.
    from("projects").
    select("*");

    const mapped: DailyTask[] = (data ?? []).map((p: any) => ({

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

  useEffect(() => {loadTasks();}, [loadTasks]);

  useEffect(() => {

    async function loadHours() {

      const { data } = await supabase.
      from("user_time_entries").
      select("hours");

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

      const { data } = await supabase.
      from("user_time_entries").
      select("user_id,hours");

      if (!data) return;

      const map = new Map<string, number>();

      data.forEach((r: any) => {
        map.set(
          r.user_id,
          (map.get(r.user_id) ?? 0) + (Number(r.hours) || 0)
        );
      });

      const ids = Array.from(map.keys());

      const { data: profiles } = await supabase.
      from("profiles").
      select("id,full_name").
      in("id", ids);

      const nameMap = new Map<string, string>();

      profiles?.forEach((p: any) => {
        nameMap.set(p.id, p.full_name);
      });

      setLeaderboard(

        ids.
        map((id) => ({
          userId: id,
          name: nameMap.get(id) || "Okänd",
          totalHours: map.get(id) ?? 0
        })).
        sort((a, b) => b.totalHours - a.totalHours)

      );

    }

    loadLeaderboard();

  }, []);

  const todayTasks = tasks.filter(
    (t) => (t.scheduledDate || "").slice(0, 10) === todayStr
  );

  const done = todayTasks.filter((t) => t.status === "done").length;
  const started = todayTasks.filter((t) => t.status === "in-progress").length;

  const mapJobs = useMemo(() => {

    return todayTasks.
    filter((t) => t.lat && t.lng).
    map((t) => ({

      id: t.realId,
      name: t.projectName,
      address: t.address,
      lat: t.lat!,
      lng: t.lng!,
      status: t.status,
      type: t.source

    }));

  }, [todayTasks]);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {

    const date = addDays(new Date(), i - 3);

    const dateStr = format(date, "yyyy-MM-dd");

    const dayTasks = tasks.filter(
      (t) => (t.scheduledDate || "").slice(0, 10) === dateStr
    );

    return {
      date,
      count: dayTasks.length
    };

  });

  return (

    <div className="relative min-h-screen pb-28 px-[5px] mx-0 border-4 border-muted border-solid rounded-md shadow my-[10px] py-[10px]">

      {/* gradient */}

      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#020617] to-[#022c22]" />

      <div className="space-y-4">

        {/* header */}

        <div className="flex items-end justify-between">

          <div>

            <h1 className="text-xl font-semibold">
              Arbete idag
            </h1>

            <p className="text-[11px] text-muted-foreground">
              {format(new Date(), "EEEE d MMMM", { locale: sv })}
            </p>

          </div>

          <div className="flex items-center gap-2">

            <AdminTimeReminder />

            <Link
              to="/projects"
              className="text-xs text-primary flex items-center gap-1">
              
              Alla projekt
              <ArrowUpRight className="h-3 w-3" />
            </Link>

          </div>

        </div>

        {/* stats */}

        <div className="grid grid-cols-2 gap-3">

          <Stat label="Totalt" value={todayTasks.length} icon={<CalendarDays size={16} />} />
          <Stat label="Påbörjade" value={started} icon={<Play size={16} />} />
          <Stat label="Klara" value={done} icon={<Check size={16} />} />
          <Stat label={`v.${getISOWeek(new Date())}`} value={`${weeklyHours.toFixed(1)}h`} icon={<Timer size={16} />} />

        </div>

        {/* week planner */}

        <div className="flex gap-2 overflow-x-auto pb-1">

          {weekDays.map((d, i) =>

          <div
            key={i}
            className="
              min-w-[60px]
              rounded-xl
              border border-white/5
              bg-white/[0.04]
              px-2
              py-2
              text-center
              ">
            

              <p className="text-[9px] text-muted-foreground">
                {format(d.date, "EEE", { locale: sv })}
              </p>

              <p className="text-sm font-semibold">
                {format(d.date, "d")}
              </p>

              <p className="text-[10px] text-primary">
                {d.count}
              </p>

            </div>

          )}

        </div>

        {/* map */}

        {mapJobs.length > 0 &&

        <DashboardWorkerMap jobs={mapJobs} />

        }

        {/* leaderboard */}

        {leaderboard.length > 0 &&

        <div className="rounded-xl border border-white/5 bg-white/[0.04] backdrop-blur-xl p-3">

            <div className="flex items-center gap-2 mb-2">

              <Trophy className="h-4 w-4 text-primary" />

              <p className="text-xs font-semibold">
                Topplista – Timmar
              </p>

            </div>

            {leaderboard.slice(0, 5).map((u, i) =>

          <div
            key={u.userId}
            className="flex items-center justify-between text-xs py-1">
            

                <div className="flex items-center gap-2">

                  {i < 3 ?
              <Medal className="h-3 w-3 text-yellow-400" /> :
              <span className="text-muted-foreground">{i + 1}</span>
              }

                  {u.name}

                </div>

                <span className="font-semibold">
                  {u.totalHours.toFixed(1)}h
                </span>

              </div>

          )}

          </div>

        }

        {/* tasks */}

        <div className="space-y-2">

          {todayTasks.length === 0 &&

          <div className="text-center text-xs text-muted-foreground border border-white/10 rounded-xl p-5">
              Inga uppdrag planerade idag
            </div>

          }

          {todayTasks.map((task) =>
          <DashboardTaskCard
            key={task.id}
            task={task}
            updating={null}
            onStart={() => {}}
            onComplete={() => {}} />

          )}

        </div>

      </div>

    </div>);



}

function Stat({
  label,
  value,
  icon




}: {label: string;value: string | number;icon: React.ReactNode;}) {

  return (

    <div className="
    rounded-xl
    border border-white/5
    bg-white/[0.04]
    backdrop-blur-xl
    px-3
    py-2.5
    flex
    items-center
    justify-between
    ">

      <div>

        <p className="text-[9px] uppercase text-muted-foreground">
          {label}
        </p>

        <p className="text-lg font-semibold leading-none mt-1">
          {value}
        </p>

      </div>

      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        {icon}
      </div>

    </div>);



}