import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Download, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, getISOWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { sv } from "date-fns/locale";

interface TimeEntry {
  user_id: string;
  date: string;
  hours: number | null;
  start_time: string;
  end_time: string | null;
  project: string;
}

interface UserSummary {
  userId: string;
  name: string;
  days: Record<string, number>; // "yyyy-MM-dd" -> hours
  total: number;
}

export default function PayrollPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [weekDate, setWeekDate] = useState(new Date());
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [filterUser, setFilterUser] = useState("all");

  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekNum = getISOWeek(weekDate);

  const load = useCallback(async () => {
    const startStr = format(weekStart, "yyyy-MM-dd");
    const endStr = format(weekEnd, "yyyy-MM-dd");

    const { data } = await supabase
      .from("user_time_entries")
      .select("user_id, date, hours, start_time, end_time, project")
      .gte("date", startStr)
      .lte("date", endStr);

    setEntries(data ?? []);

    const userIds = Array.from(new Set((data ?? []).map(e => e.user_id)));
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      const map: Record<string, string> = {};
      (profs ?? []).forEach(p => { map[p.id] = p.full_name || "Okänd"; });
      setProfiles(map);
    }
  }, [weekStart.toISOString(), weekEnd.toISOString()]);

  useEffect(() => { load(); }, [load]);

  const summaries: UserSummary[] = useMemo(() => {
    const map = new Map<string, UserSummary>();
    entries.forEach(e => {
      if (filterUser !== "all" && e.user_id !== filterUser) return;
      if (!map.has(e.user_id)) {
        map.set(e.user_id, { userId: e.user_id, name: profiles[e.user_id] || "Okänd", days: {}, total: 0 });
      }
      const s = map.get(e.user_id)!;
      const h = Number(e.hours) || 0;
      s.days[e.date] = (s.days[e.date] || 0) + h;
      s.total += h;
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [entries, profiles, filterUser]);

  const totalHours = summaries.reduce((s, u) => s + u.total, 0);

  const dayLabels = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];

  const exportCSV = () => {
    const rows = [["Namn", ...dayLabels, "Totalt"]];
    summaries.forEach(s => {
      const row = [s.name];
      weekDays.forEach(d => {
        const key = format(d, "yyyy-MM-dd");
        row.push((s.days[key] || 0).toFixed(1));
      });
      row.push(s.total.toFixed(1));
      rows.push(row);
    });
    rows.push(["TOTALT", ...weekDays.map(d => {
      const key = format(d, "yyyy-MM-dd");
      return summaries.reduce((sum, s) => sum + (s.days[key] || 0), 0).toFixed(1);
    }), totalHours.toFixed(1)]);

    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lonerapport-vecka-${weekNum}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exporterad" });
  };

  const exportFortnox = () => {
    // Fortnox-compatible format: one row per user per day
    const rows = [["Anställd", "Datum", "Projekt", "Timmar"]];
    entries.forEach(e => {
      if (filterUser !== "all" && e.user_id !== filterUser) return;
      rows.push([
        profiles[e.user_id] || "Okänd",
        e.date,
        e.project || "",
        (Number(e.hours) || 0).toFixed(2),
      ]);
    });
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fortnox-tid-vecka-${weekNum}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Fortnox-export klar" });
  };

  if (!isAdmin) return <Navigate to="/" replace />;

  const allUsers = Array.from(new Set(entries.map(e => e.user_id)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          Lönerapport
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}>
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel/CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportFortnox}>
            <Download className="h-3.5 w-3.5" /> Fortnox
          </Button>
        </div>
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekDate(subWeeks(weekDate, 1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Vecka {weekNum}</h2>
          <p className="text-xs text-muted-foreground">
            {format(weekStart, "d MMM", { locale: sv })} – {format(weekEnd, "d MMM yyyy", { locale: sv })}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setWeekDate(addWeeks(weekDate, 1))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Filter */}
      {allUsers.length > 1 && (
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Alla anställda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla anställda</SelectItem>
            {allUsers.map(uid => (
              <SelectItem key={uid} value={uid}>{profiles[uid] || "Okänd"}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Summary */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Totalt denna vecka: {totalHours.toFixed(1)}h</CardTitle>
        </CardHeader>
      </Card>

      {/* Per user */}
      {summaries.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground text-sm">Inga tidsregistreringar denna vecka</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {summaries.map(s => (
            <Card key={s.userId} className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{s.name}</span>
                  <span className="text-primary font-bold">{s.total.toFixed(1)}h</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((d, i) => {
                    const key = format(d, "yyyy-MM-dd");
                    const h = s.days[key] || 0;
                    return (
                      <div key={key} className="text-center">
                        <p className="text-[10px] text-muted-foreground font-medium">{dayLabels[i].slice(0, 3)}</p>
                        <p className="text-xs text-muted-foreground">{format(d, "d/M")}</p>
                        <p className={`text-sm font-bold mt-1 ${h > 0 ? "text-foreground" : "text-muted-foreground/30"}`}>
                          {h > 0 ? `${h.toFixed(1)}h` : "–"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
