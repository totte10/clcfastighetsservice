import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardWorkerMap } from "@/components/DashboardWorkerMap";

import {
  CalendarDays,
  Play,
  Check,
  Timer,
  MapPin,
} from "lucide-react";

import { format, addDays, getISOWeek } from "date-fns";
import { sv } from "date-fns/locale";

interface Job {
  id: string;
  name: string;
  address: string;
  date: string;
  status: string;
  lat?: number;
  lng?: number;
  source: string;
  type?: string;
}

type FilterType = "all" | "pending" | "in-progress" | "done";

export default function Dashboard() {

  const navigate = useNavigate();

  const { user, profile } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");

  const today = format(new Date(), "yyyy-MM-dd");

  /* LOAD JOBS */

  const loadJobs = useCallback(async () => {

    const [projects, tidx, egna, tmm, optimal] = await Promise.all([
      supabase.from("projects").select("*"),
      supabase.from("tidx_entries").select("*"),
      supabase.from("egna_entries").select("*"),
      supabase.from("tmm_entries").select("*"),
      supabase.from("optimal_entries").select("*"),
    ]);

    const result: Job[] = [];

    projects.data?.forEach((p: any) => {
      if (!p.datum_planerat) return;

      result.push({
        id: `project-${p.id}`,
        name: p.name,
        address: p.address,
        status: p.status || "pending",
        date: p.datum_planerat.slice(0, 10),
        lat: p.lat,
        lng: p.lng,
        source: "project",
      });
    });

    tidx.data?.forEach((t: any) => {
      if (!t.datum_planerat) return;

      result.push({
        id: `tidx-${t.id}`,
        name: t.omrade || t.address,
        address: t.address,
        status: t.status || "pending",
        date: t.datum_planerat.slice(0, 10),
        lat: t.lat,
        lng: t.lng,
        source: "tidx",
      });
    });

    egna.data?.forEach((e: any) => {
      if (!e.datum_planerat) return;

      result.push({
        id: `egna-${e.id}`,
        name: e.address,
        address: e.address,
        status: "pending",
        date: e.datum_planerat.slice(0, 10),
        lat: e.lat,
        lng: e.lng,
        source: "egna",
      });
    });

    tmm.data?.forEach((t: any) => {
      if (!t.datum) return;

      result.push({
        id: `tmm-${t.id}`,
        name: t.beskrivning || t.address,
        address: t.address,
        status: t.status || "pending",
        date: t.datum.slice(0, 10),
        lat: t.lat,
        lng: t.lng,
        source: "tmm",
      });
    });

    optimal.data?.forEach((o: any) => {
      if (!o.datum_start) return;

      result.push({
        id: `optimal-${o.id}`,
        name: o.name,
        address: o.address,
        status: o.status || "pending",
        date: o.datum_start.slice(0, 10),
        lat: o.lat,
        lng: o.lng,
        source: "optimal",
      });
    });

    setJobs(result);

  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  /* HOURS */

  useEffect(() => {

    async function loadHours() {

      const { data } = await supabase
        .from("user_time_entries")
        .select("hours");

      const total =
        (data ?? []).reduce(
          (s: any, r: any) => s + (Number(r.hours) || 0),
          0
        );

      setWeeklyHours(total);

    }

    loadHours();

  }, []);

  /* TODAY JOBS */

  const todayJobs = jobs.filter((j) => j.date === today);

  const done = todayJobs.filter((j) => j.status === "done").length;
  const started = todayJobs.filter((j) => j.status === "in-progress").length;

  const progress =
    todayJobs.length > 0
      ? Math.round((done / todayJobs.length) * 100)
      : 0;

  const filteredJobs =
    filter === "all"
      ? todayJobs
      : todayJobs.filter((j) => j.status === filter);

  /* ROUTE SORT */

  const mapJobs = useMemo(() => {

    const jobsWithCoords = todayJobs.filter((j) => j.lat && j.lng);

    if (jobsWithCoords.length <= 1) return jobsWithCoords;

    const sorted = [jobsWithCoords[0]];
    const visited = new Set([jobsWithCoords[0].id]);

    while (sorted.length < jobsWithCoords.length) {

      const current = sorted[sorted.length - 1];

      let nearest: any = null;
      let shortest = Infinity;

      for (const j of jobsWithCoords) {

        if (visited.has(j.id)) continue;

        const dx = current.lat! - j.lat!;
        const dy = current.lng! - j.lng!;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < shortest) {
          shortest = dist;
          nearest = j;
        }

      }

      if (nearest) {
        visited.add(nearest.id);
        sorted.push(nearest);
      } else {
        break;
      }

    }

    return sorted;

  }, [todayJobs]);

  const firstName =
    profile?.fullName?.split(" ")[0] || "där";

  const statusDot = (status: string) => {
    if (status === "done") return "bg-emerald-400";
    if (status === "in-progress") return "bg-amber-400";
    return "bg-white/20";
  };

  const statusLabel = (status: string) => {
    if (status === "done") return "Klar";
    if (status === "in-progress") return "Pågående";
    return "Planerad";
  };

  return (

    <div className="space-y-5">

      <div>

        <h1 className="text-2xl font-bold">
          Hej {firstName} 👋
        </h1>

        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE d MMMM", { locale: sv })}
        </p>

      </div>


      {/* MAP */}

      {mapJobs.length > 0 && (
        <div className="glass-card overflow-hidden p-0">
          <DashboardWorkerMap jobs={mapJobs as any} />
        </div>
      )}


      {/* JOB LIST */}

      <div className="space-y-2">

        {(filter === "all" ? mapJobs : filteredJobs).map((job) => (

          <div
            key={job.id}
            onClick={() => navigate(`/job/${job.id}`)}
            className="glass-card p-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition"
          >

            <div className={`w-2.5 h-2.5 rounded-full ${statusDot(job.status)}`} />

            <div className="flex-1 min-w-0">

              <p className="text-sm font-medium truncate">
                {job.name}
              </p>

              <p className="text-xs text-muted-foreground flex items-center gap-1">

                <MapPin size={11} />

                <span className="truncate">
                  {job.address}
                </span>

              </p>

            </div>

            <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.06] text-white/50">

              {statusLabel(job.status)}

            </span>

          </div>

        ))}

      </div>

    </div>

  );

}