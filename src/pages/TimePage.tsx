import { useState, useEffect, useCallback } from "react";
import {
  getActiveClock,
  setActiveClock,
  addTimeEntry,
  getTimeEntries,
  getAreas,
  type TimeEntry,
  type Area,
} from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Play, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TimePage() {
  const [activeClock, setActiveClockState] = useState<{ employeeName: string; clockIn: string } | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [areas, setAreasState] = useState<Area[]>([]);
  const [name, setName] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0]);
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [manualAreaId, setManualAreaId] = useState("");
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    const [clock, te, ar] = await Promise.all([getActiveClock(), getTimeEntries(), getAreas()]);
    setActiveClockState(clock);
    setEntries(te);
    setAreasState(ar);
    if (clock) setName(clock.employeeName);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleClockIn = async () => {
    if (!name.trim()) { toast({ title: "Ange ditt namn", variant: "destructive" }); return; }
    const clock = { employeeName: name.trim(), clockIn: new Date().toISOString() };
    await setActiveClock(clock);
    setActiveClockState(clock);
    toast({ title: `${name} instämplad!` });
  };

  const handleClockOut = async () => {
    if (!activeClock) return;
    await addTimeEntry({
      employeeName: activeClock.employeeName,
      type: "clock",
      clockIn: activeClock.clockIn,
      clockOut: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
    });
    await setActiveClock(null);
    setActiveClockState(null);
    setEntries(await getTimeEntries());
    toast({ title: "Utstämplad!" });
  };

  const handleManualEntry = async () => {
    if (!manualName.trim() || !manualStart || !manualEnd) {
      toast({ title: "Fyll i alla fält", variant: "destructive" }); return;
    }
    await addTimeEntry({
      employeeName: manualName.trim(),
      type: "manual",
      manualStart,
      manualEnd,
      date: manualDate,
      areaId: manualAreaId || undefined,
    });
    setEntries(await getTimeEntries());
    setManualStart("");
    setManualEnd("");
    toast({ title: "Tid registrerad!" });
  };

  const todayEntries = entries.filter((e) => e.date === new Date().toISOString().split("T")[0]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Tidrapport</h1>

      <Tabs defaultValue="clock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clock">Stämpla in/ut</TabsTrigger>
          <TabsTrigger value="manual">Manuell registrering</TabsTrigger>
        </TabsList>

        <TabsContent value="clock">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Stämpelklocka
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!activeClock ? (
                <>
                  <div className="space-y-2">
                    <Label>Ditt namn</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ange ditt namn" />
                  </div>
                  <Button onClick={handleClockIn} className="gap-2">
                    <Play className="h-4 w-4" /> Stämpla in
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-success animate-pulse-slow" />
                    <p className="text-sm">
                      <span className="font-bold">{activeClock.employeeName}</span> instämplad sedan{" "}
                      {new Date(activeClock.clockIn).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Button onClick={handleClockOut} variant="destructive" className="gap-2">
                    <Square className="h-4 w-4" /> Stämpla ut
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Manuell tidsregistrering</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Namn</Label>
                  <Input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Ditt namn" />
                </div>
                <div className="space-y-2">
                  <Label>Datum</Label>
                  <Input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Starttid</Label>
                  <Input type="time" value={manualStart} onChange={(e) => setManualStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sluttid</Label>
                  <Input type="time" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} />
                </div>
              </div>
              {areas.length > 0 && (
                <div className="space-y-2">
                  <Label>Område (valfritt)</Label>
                  <Select value={manualAreaId} onValueChange={setManualAreaId}>
                    <SelectTrigger><SelectValue placeholder="Välj område" /></SelectTrigger>
                    <SelectContent>
                      {areas.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleManualEntry}>Registrera tid</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Dagens registreringar</CardTitle>
        </CardHeader>
        <CardContent>
          {todayEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga registreringar idag.</p>
          ) : (
            <div className="space-y-2">
              {todayEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{entry.employeeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.type === "clock"
                        ? `${new Date(entry.clockIn!).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })} - ${entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }) : "pågår"}`
                        : `${entry.manualStart} - ${entry.manualEnd}`}
                    </p>
                  </div>
                  <span className="text-xs bg-secondary px-2 py-1 rounded-md text-secondary-foreground">
                    {entry.type === "clock" ? "Stämplad" : "Manuell"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
