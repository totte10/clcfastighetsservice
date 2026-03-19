import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PlannerUI from "@/components/PlannerUI";

interface UnifiedJob {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  date: string | null;
  status: string;
  type: "project" | "tidx" | "egna" | "tmm" | "optimal";
  workers: string[];
}

function normalizeDate(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length >= 10 ? value.slice(0, 10) : null;
}

function normalizeNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function PlanningPage() {
  const { user, loading } = useAuth();
  const [jobs, setJobs] = useState<UnifiedJob[]>([]);
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setJobs([]);
      setPageLoading(false);
      return;
    }

    let mounted = true;

    const load = async () => {
      setPageLoading(true);
      setError("");

      try {
        const [
          projectsResult,
          tidxResult,
          egnaResult,
          tmmResult,
          optimalResult,
          assignmentsResult,
          profilesResult,
        ] = await Promise.all([
          supabase.from("projects").select("id, name, address, lat, lng, datum_planerat, status"),
          supabase.from("tidx_entries").select("id, omrade, address, lat, lng, datum_planerat, status"),
          supabase.from("egna_entries").select("id, address, lat, lng, datum_planerat, blow_status, sweep_status"),
          supabase.from("tmm_entries").select("id, beskrivning, address, lat, lng, datum, status"),
          supabase.from("optimal_entries").select("id, name, address, lat, lng, datum_start, status"),
          supabase.from("project_assignments").select("entry_id, entry_type, user_id"),
          supabase.from("profiles").select("id, full_name, username"),
        ]);

        [projectsResult, tidxResult, egnaResult, tmmResult, optimalResult, assignmentsResult, profilesResult].forEach((result) => {
          if (result.error) console.error(result.error);
        });

        const profileMap = new Map<string, string>();
        (profilesResult.data ?? []).forEach((profile) => {
          profileMap.set(profile.id, profile.full_name || profile.username || "Användare");
        });

        const assignmentMap = new Map<string, string[]>();
        (assignmentsResult.data ?? []).forEach((assignment) => {
          const key = `${assignment.entry_type}:${assignment.entry_id}`;
          const current = assignmentMap.get(key) ?? [];
          current.push(profileMap.get(assignment.user_id) ?? "Användare");
          assignmentMap.set(key, current);
        });

        const normalized: UnifiedJob[] = [
          ...((projectsResult.data ?? []).map((row) => ({
            id: row.id,
            name: row.name || "Projekt",
            address: row.address || "",
            lat: normalizeNumber(row.lat),
            lng: normalizeNumber(row.lng),
            date: normalizeDate(row.datum_planerat),
            status: row.status || "pending",
            type: "project" as const,
            workers: assignmentMap.get(`project:${row.id}`) ?? [],
          })) ?? []),
          ...((tidxResult.data ?? []).map((row) => ({
            id: row.id,
            name: row.omrade || "TIDX",
            address: row.address || "",
            lat: normalizeNumber(row.lat),
            lng: normalizeNumber(row.lng),
            date: normalizeDate(row.datum_planerat),
            status: row.status || "pending",
            type: "tidx" as const,
            workers: assignmentMap.get(`tidx:${row.id}`) ?? [],
          })) ?? []),
          ...((egnaResult.data ?? []).map((row) => ({
            id: row.id,
            name: "Egna område",
            address: row.address || "",
            lat: normalizeNumber(row.lat),
            lng: normalizeNumber(row.lng),
            date: normalizeDate(row.datum_planerat),
            status:
              row.blow_status === "done" && row.sweep_status === "done"
                ? "done"
                : row.blow_status === "in-progress" || row.sweep_status === "in-progress"
                  ? "in-progress"
                  : "pending",
            type: "egna" as const,
            workers: assignmentMap.get(`egna:${row.id}`) ?? [],
          })) ?? []),
          ...((tmmResult.data ?? []).map((row) => ({
            id: row.id,
            name: row.beskrivning || "TMM",
            address: row.address || "",
            lat: normalizeNumber(row.lat),
            lng: normalizeNumber(row.lng),
            date: normalizeDate(row.datum),
            status: row.status || "pending",
            type: "tmm" as const,
            workers: assignmentMap.get(`tmm:${row.id}`) ?? [],
          })) ?? []),
          ...((optimalResult.data ?? []).map((row) => ({
            id: row.id,
            name: row.name || "Optimal",
            address: row.address || "",
            lat: normalizeNumber(row.lat),
            lng: normalizeNumber(row.lng),
            date: normalizeDate(row.datum_start),
            status: row.status || "pending",
            type: "optimal" as const,
            workers: assignmentMap.get(`optimal:${row.id}`) ?? [],
          })) ?? []),
        ];

        if (!mounted) return;
        setJobs(normalized);
      } catch (e) {
        console.error("PlanningPage crash:", e);
        if (!mounted) return;
        setError("Kunde inte ladda planeringen.");
        setJobs([]);
      } finally {
        if (mounted) setPageLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [user, loading]);

  const todayLabel = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  if (loading || pageLoading) {
    return <div className="glass-card p-5 text-sm text-muted-foreground">Laddar planering...</div>;
  }

  if (!user) {
    return <div className="glass-card p-5 text-sm text-muted-foreground">Du behöver logga in för att se planeringen.</div>;
  }

  if (error) {
    return <div className="glass-card p-5 text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-4 pb-bottom-nav">
      <div className="glass-card p-4 text-sm text-muted-foreground">
        Alla jobb är nu samlade i en gemensam planeringsvy. Idag: <span className="text-foreground">{todayLabel}</span>
      </div>
      <PlannerUI jobs={jobs} />
    </div>
  );
}
