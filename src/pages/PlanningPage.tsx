import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarDays, ChevronLeft, ChevronRight, Wind, Home, FolderOpen, Clock, CalendarIcon, Plus, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { geocodeAddress } from "@/lib/geocode";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

type EntryType = "tidx" | "egna" | "project" | "time" | "optimal";

interface PlanningItem {
  id: string;
  type: EntryType;
  title: string;
  date: string; // YYYY-MM-DD
  status: string;
  extra?: string;
}

const typeConfig: Record<EntryType, { label: string; icon: typeof Wind; color: string }> = {
  tidx: { label: "Tidx", icon: Wind, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  egna: { label: "Egna", icon: Home, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  project: { label: "Projekt", icon: FolderOpen, color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  time: { label: "Tid", icon: Clock, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  optimal: { label: "Optimal", icon: Truck, color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
};

function normalizeDate(raw: string): string | null {
  if (!raw) return null;
  const m = raw.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

export default function PlanningPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [items, setItems] = useState<PlanningItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<EntryType | "all">("all");
  const [changingDate, setChangingDate] = useState<PlanningItem | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectDate, setNewProjectDate] = useState<Date | undefined>(undefined);
  const [newProjectForm, setNewProjectForm] = useState({ name: "", address: "", description: "", project_number: "" });

  // Admin check
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const loadItems = useCallback(async () => {
    if (!user) return;

    const [tidxRes, egnaRes, projRes, timeRes, optimalRes] = await Promise.all([
      supabase.from("tidx_entries").select("id, omrade, address, datum_planerat, status"),
      supabase.from("egna_entries").select("id, address, datum_planerat, blow_status, sweep_status"),
      supabase.from("projects").select("id, name, address, status, created_at, datum_planerat"),
      supabase.from("user_time_entries").select("id, date, project, start_time, end_time, hours, user_id"),
      supabase.from("optimal_entries").select("id, name, datum_start, datum_end, status"),
    ]);

    const result: PlanningItem[] = [];

    (tidxRes.data ?? []).forEach((r) => {
      const d = normalizeDate(r.datum_planerat);
      if (d) result.push({ id: r.id, type: "tidx", title: `${r.omrade} – ${r.address}`, date: d, status: r.status });
    });

    (egnaRes.data ?? []).forEach((r) => {
      const d = normalizeDate(r.datum_planerat);
      const s = r.blow_status === "done" && r.sweep_status === "done" ? "done" : r.blow_status === "pending" && r.sweep_status === "pending" ? "pending" : "in-progress";
      if (d) result.push({ id: r.id, type: "egna", title: r.address, date: d, status: s });
    });

    (projRes.data ?? []).forEach((r) => {
      const d = normalizeDate(r.datum_planerat) || r.created_at?.split("T")[0];
      if (d) result.push({ id: r.id, type: "project", title: r.name, date: d, status: r.status });
    });

    (timeRes.data ?? []).forEach((r) => {
      if (r.date) result.push({
        id: r.id, type: "time", title: r.project || "Tidsrapport",
        date: r.date, status: r.end_time ? "done" : "active",
        extra: r.hours ? `${Number(r.hours).toFixed(1)}h` : undefined,
      });
    });

    // Optimal entries – add for each day in the range
    (optimalRes.data ?? []).forEach((r: any) => {
      const startD = r.datum_start;
      const endD = r.datum_end || r.datum_start;
      // Add entry for start date (calendar will show it)
      if (startD) {
        const days = eachDayOfInterval({ start: parseISO(startD), end: parseISO(endD) });
        days.forEach((day) => {
          result.push({
            id: r.id,
            type: "optimal",
            title: r.name,
            date: format(day, "yyyy-MM-dd"),
            status: r.status,
          });
        });
      }
    });

    setItems(result);
  }, [user]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad to start on Monday
  const startDay = monthStart.getDay();
  const padBefore = (startDay === 0 ? 6 : startDay - 1);

  const filteredItems = useMemo(() =>
    filterType === "all" ? items : items.filter((i) => i.type === filterType),
    [items, filterType]
  );

  const itemsByDate = useMemo(() => {
    const map = new Map<string, PlanningItem[]>();
    filteredItems.forEach((item) => {
      const existing = map.get(item.date) ?? [];
      existing.push(item);
      map.set(item.date, existing);
    });
    return map;
  }, [filteredItems]);

  const selectedDayItems = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, "yyyy-MM-dd");
    return itemsByDate.get(key) ?? [];
  }, [selectedDay, itemsByDate]);

  const handleChangeDate = async (item: PlanningItem, newDate: Date) => {
    const newDateStr = format(newDate, "yyyy-MM-dd");

    try {
      if (item.type === "tidx") {
        await supabase.from("tidx_entries").update({ datum_planerat: newDateStr }).eq("id", item.id);
      } else if (item.type === "egna") {
        await supabase.from("egna_entries").update({ datum_planerat: newDateStr }).eq("id", item.id);
      } else if (item.type === "time") {
        await supabase.from("user_time_entries").update({ date: newDateStr }).eq("id", item.id);
      }
      toast({ title: "Datum uppdaterat!" });
      setChangingDate(null);
      loadItems();
    } catch {
      toast({ title: "Kunde inte uppdatera datum", variant: "destructive" });
    }
  };

  if (isAdmin === null) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const weekDays = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Planering
        </h1>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={(v) => setFilterType(v as EntryType | "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla typer</SelectItem>
              <SelectItem value="tidx">Tidx Sopningar</SelectItem>
              <SelectItem value="egna">Egna Områden</SelectItem>
              <SelectItem value="project">Projekt</SelectItem>
              <SelectItem value="optimal">Optimal</SelectItem>
              <SelectItem value="time">Tidsrapporter</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { setNewProjectDate(selectedDay ?? new Date()); setShowNewProject(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Nytt projekt
          </Button>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: sv })}
        </h2>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Calendar grid */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((d) => (
              <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {/* Padding cells */}
            {Array.from({ length: padBefore }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[100px] border-b border-r border-border/50 bg-muted/20" />
            ))}

            {daysInMonth.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayItems = itemsByDate.get(key) ?? [];
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const today = isToday(day);

              return (
                <div
                  key={key}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "min-h-[100px] border-b border-r border-border/50 p-1.5 cursor-pointer transition-colors hover:bg-accent/30",
                    isSelected && "bg-accent/50 ring-1 ring-primary/50",
                  )}
                >
                  <div className={cn(
                    "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                    today && "bg-primary text-primary-foreground",
                  )}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayItems.slice(0, 3).map((item) => {
                      const cfg = typeConfig[item.type];
                      return (
                        <div key={`${item.type}-${item.id}`} className={cn("text-[10px] leading-tight px-1 py-0.5 rounded border truncate", cfg.color)}>
                          {item.title}
                        </div>
                      );
                    })}
                    {dayItems.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">+{dayItems.length - 3} till</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day detail */}
      {selectedDay && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              {format(selectedDay, "EEEE d MMMM yyyy", { locale: sv })}
              <Badge variant="secondary" className="ml-auto text-xs">{selectedDayItems.length} poster</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Inga planerade uppdrag denna dag.</p>
            ) : (
              <div className="space-y-2">
                {selectedDayItems.map((item) => {
                  const cfg = typeConfig[item.type];
                  const Icon = cfg.icon;
                  return (
                    <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={cn("text-[10px] border", cfg.color)}>{cfg.label}</Badge>
                          <span className="text-[10px] text-muted-foreground capitalize">{item.status}</span>
                          {item.extra && <span className="text-[10px] text-muted-foreground">{item.extra}</span>}
                        </div>
                      </div>
                      {(
                        <Popover
                          open={changingDate?.id === item.id && changingDate?.type === item.type}
                          onOpenChange={(open) => setChangingDate(open ? item : null)}
                        >
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-xs gap-1 shrink-0">
                              <CalendarIcon className="h-3 w-3" /> Ändra datum
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={parseISO(item.date)}
                              onSelect={(d) => d && handleChangeDate(item, d)}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* New project dialog */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nytt projekt i planeringen</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Projektnamn *</Label>
              <Input value={newProjectForm.name} onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })} placeholder="T.ex. Vinterunderhåll" />
            </div>
            <div className="space-y-2">
              <Label>Adress *</Label>
              <Input value={newProjectForm.address} onChange={(e) => setNewProjectForm({ ...newProjectForm, address: e.target.value })} placeholder="Gatuadress, stad" />
            </div>
            <div className="space-y-2">
              <Label>Projektnummer (lämna tomt för auto)</Label>
              <Input value={newProjectForm.project_number} onChange={(e) => setNewProjectForm({ ...newProjectForm, project_number: e.target.value })} placeholder="T.ex. P-2026-0001" />
            </div>
            <div className="space-y-2">
              <Label>Beskrivning</Label>
              <Textarea value={newProjectForm.description} onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Planerat datum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newProjectDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newProjectDate ? format(newProjectDate, "d MMMM yyyy", { locale: sv }) : "Välj datum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newProjectDate}
                    onSelect={setNewProjectDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProject(false)}>Avbryt</Button>
            <Button onClick={async () => {
              if (!newProjectForm.name.trim() || !newProjectForm.address.trim()) {
                toast({ title: "Fyll i namn och adress", variant: "destructive" });
                return;
              }
              const dateStr = newProjectDate ? format(newProjectDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
              const coords = await geocodeAddress(newProjectForm.address);
              const { error } = await supabase.from("projects").insert({
                name: newProjectForm.name,
                address: newProjectForm.address,
                description: newProjectForm.description,
                project_number: newProjectForm.project_number || undefined,
                datum_planerat: dateStr,
                lat: coords?.lat ?? null,
                lng: coords?.lng ?? null,
              });
              if (error) { toast({ title: "Kunde inte skapa projekt", variant: "destructive" }); return; }
              toast({ title: "Projekt skapat!" });
              setShowNewProject(false);
              setNewProjectForm({ name: "", address: "", description: "", project_number: "" });
              setNewProjectDate(undefined);
              loadItems();
            }}>Skapa projekt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
