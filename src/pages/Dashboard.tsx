import { useState, useEffect, useCallback } from "react";
import { getAreas, getTidxEntries, getEgnaEntries, type Area, type TidxEntry, type EgnaEntry } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Fan, Wind, Clock, ArrowUpRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "react-router-dom";

type Status = "pending" | "in-progress" | "done";

interface DashboardArea {
  id: string;
  address: string;
  blowStatus: Status;
  sweepStatus: Status;
  source: "admin" | "tidx" | "egna";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [allAreas, setAllAreas] = useState<DashboardArea[]>([]);
  const [todayTimeCount, setTodayTimeCount] = useState(0);

  const refresh = useCallback(async () => {
    const [adminAreas, tidxEntries, egnaEntries] = await Promise.all([
      getAreas(), getTidxEntries(), getEgnaEntries(),
    ]);

    const fromAdmin: DashboardArea[] = adminAreas.map((a) => ({
      id: `admin-${a.id}`, address: `${a.name} - ${a.address}`, blowStatus: a.blowStatus, sweepStatus: a.sweepStatus, source: "admin",
    }));
    const fromTidx: DashboardArea[] = tidxEntries.map((e) => ({
      id: `tidx-${e.id}`, address: e.address, blowStatus: "pending", sweepStatus: e.status, source: "tidx",
    }));
    const fromEgna: DashboardArea[] = egnaEntries.map((e) => ({
      id: `egna-${e.id}`, address: e.address, blowStatus: e.blowStatus, sweepStatus: e.sweepStatus, source: "egna",
    }));

    setAllAreas([...fromAdmin, ...fromTidx, ...fromEgna]);

    // Count today's time entries
    if (user) {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("user_time_entries")
        .select("id", { count: "exact", head: true })
        .eq("date", today);
      setTodayTimeCount(count ?? 0);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const blowDone = allAreas.filter((a) => a.blowStatus === "done").length;
  const sweepDone = allAreas.filter((a) => a.sweepStatus === "done").length;
  const total = allAreas.length;
  const blowPct = total > 0 ? Math.round((blowDone / total) * 100) : 0;
  const sweepPct = total > 0 ? Math.round((sweepDone / total) * 100) : 0;

  const sourceLabels: Record<string, { label: string; path: string }> = {
    admin: { label: "Admin", path: "/admin" },
    tidx: { label: "Tidx", path: "/tidx" },
    egna: { label: "Egna", path: "/egna" },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Översikt över alla områden och uppdrag</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Total areas - primary card */}
        <div className="stat-card-primary sm:col-span-2 lg:col-span-1 animate-slide-up" style={{ animationDelay: "0ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Totalt områden</p>
              <p className="text-5xl font-bold mt-2 text-foreground tracking-tight">{total}</p>
              <p className="text-xs text-muted-foreground mt-2">Alla registrerade områden</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Blow status */}
        <div className="stat-card animate-slide-up" style={{ animationDelay: "80ms" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Framblåsning</p>
              <p className="text-3xl font-bold mt-1.5 text-foreground tracking-tight">{blowDone}<span className="text-lg text-muted-foreground font-normal">/{total}</span></p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Fan className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground">{blowPct}% klart</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${blowPct}%` }} />
            </div>
          </div>
        </div>

        {/* Sweep status */}
        <div className="stat-card animate-slide-up" style={{ animationDelay: "160ms" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Maskinsopning</p>
              <p className="text-3xl font-bold mt-1.5 text-foreground tracking-tight">{sweepDone}<span className="text-lg text-muted-foreground font-normal">/{total}</span></p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-accent/30 flex items-center justify-center">
              <Wind className="h-4 w-4 text-accent-foreground" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground">{sweepPct}% klart</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${sweepPct}%` }} />
            </div>
          </div>
        </div>

        {/* Time today */}
        <div className="stat-card animate-slide-up" style={{ animationDelay: "240ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tid idag</p>
              <p className="text-3xl font-bold mt-1.5 text-foreground tracking-tight">{todayTimeCount}</p>
              <p className="text-xs text-muted-foreground mt-2">registreringar idag</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-success" />
            </div>
          </div>
          <Link
            to="/time"
            className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-4 hover:text-primary/80 transition-colors group"
          >
            Visa tidrapport
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>

      {/* Areas Table */}
      <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: "300ms" }}>
        <div className="px-6 py-5 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Alla områden</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{total} totalt registrerade</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th className="pl-6">Adress</th>
                <th>Källa</th>
                <th>Framblåsning</th>
                <th className="pr-6">Maskinsopning</th>
              </tr>
            </thead>
            <tbody>
              {allAreas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="pl-6 text-muted-foreground text-center py-12">
                    Inga områden registrerade ännu.
                  </td>
                </tr>
              ) : (
                allAreas.map((area) => (
                  <tr key={area.id}>
                    <td className="pl-6 max-w-[280px] truncate font-medium text-foreground/90">{area.address}</td>
                    <td>
                      <Link
                        to={sourceLabels[area.source].path}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        {sourceLabels[area.source].label}
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                    <td><StatusBadge status={area.blowStatus} /></td>
                    <td className="pr-6"><StatusBadge status={area.sweepStatus} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
