import { getAreas, getTimeEntries, getActiveClock } from "@/lib/store";
import { MapPin, Fan, Wind, Clock, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useMemo } from "react";
import { Link } from "react-router-dom";

type Status = "pending" | "in-progress" | "done";

interface DashboardArea {
  id: string;
  address: string;
  blowStatus: Status;
  sweepStatus: Status;
  source: "admin" | "tidx" | "egna";
}

function loadTidxEntries(): DashboardArea[] {
  const stored = localStorage.getItem("clc_tidx_sopningar");
  if (!stored) return [];
  const entries = JSON.parse(stored);
  return entries.map((e: any) => ({
    id: `tidx-${e.id}`,
    address: e.address,
    blowStatus: "pending" as Status,
    sweepStatus: e.status as Status,
    source: "tidx" as const,
  }));
}

function loadEgnaEntries(): DashboardArea[] {
  const stored = localStorage.getItem("clc_egna_omraden");
  if (!stored) return [];
  const entries = JSON.parse(stored);
  return entries.map((e: any) => ({
    id: `egna-${e.id}`,
    address: e.address,
    blowStatus: e.blowStatus as Status,
    sweepStatus: e.sweepStatus as Status,
    source: "egna" as const,
  }));
}

export default function Dashboard() {
  const adminAreas = useMemo(() => getAreas(), []);
  const timeEntries = useMemo(() => getTimeEntries(), []);
  const activeClock = getActiveClock();

  const tidxAreas = useMemo(() => loadTidxEntries(), []);
  const egnaAreas = useMemo(() => loadEgnaEntries(), []);

  const allAreas: DashboardArea[] = useMemo(() => {
    const fromAdmin: DashboardArea[] = adminAreas.map((a) => ({
      id: `admin-${a.id}`,
      address: `${a.name} - ${a.address}`,
      blowStatus: a.blowStatus,
      sweepStatus: a.sweepStatus,
      source: "admin" as const,
    }));
    return [...fromAdmin, ...tidxAreas, ...egnaAreas];
  }, [adminAreas, tidxAreas, egnaAreas]);

  const blowDone = allAreas.filter((a) => a.blowStatus === "done").length;
  const sweepDone = allAreas.filter((a) => a.sweepStatus === "done").length;
  const total = allAreas.length;
  const todayEntries = timeEntries.filter(
    (t) => t.date === new Date().toISOString().split("T")[0]
  );

  const sourceLabels: Record<string, { label: string; path: string }> = {
    admin: { label: "Områden", path: "/areas" },
    tidx: { label: "Tidx", path: "/tidx" },
    egna: { label: "Egna", path: "/egna" },
  };

  const stats = [
    { label: "Totalt områden", value: total, icon: MapPin, color: "text-primary" },
    { label: "Framblåsning klart", value: `${blowDone}/${total}`, icon: Fan, color: "text-primary" },
    { label: "Maskinsopning klart", value: `${sweepDone}/${total}`, icon: Wind, color: "text-accent-foreground" },
    { label: "Tidsreg. idag", value: todayEntries.length, icon: Clock, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Översikt — alla områden samlade
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeClock && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse-slow" />
              <p className="text-sm font-medium">
                <span className="font-bold">{activeClock.employeeName}</span> är
                instämplad sedan{" "}
                {new Date(activeClock.clockIn).toLocaleTimeString("sv-SE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All areas table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Alla områden ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Adress</th>
                  <th className="pb-2 font-medium">Källa</th>
                  <th className="pb-2 font-medium">Framblåsning</th>
                  <th className="pb-2 font-medium">Maskinsopning</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allAreas.map((area) => (
                  <tr key={area.id} className="hover:bg-muted/30">
                    <td className="py-2.5 pr-3 max-w-[200px] truncate">{area.address}</td>
                    <td className="py-2.5 pr-3">
                      <Link
                        to={sourceLabels[area.source].path}
                        className="text-xs text-primary hover:underline"
                      >
                        {sourceLabels[area.source].label}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3">
                      <StatusBadge status={area.blowStatus} />
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={area.sweepStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}