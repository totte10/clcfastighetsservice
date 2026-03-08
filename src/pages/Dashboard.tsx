import { getAreas, getTimeEntries, getActiveClock } from "@/lib/store";
import { MapPin, Fan, Wind, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";

export default function Dashboard() {
  const areas = useMemo(() => getAreas(), []);
  const timeEntries = useMemo(() => getTimeEntries(), []);
  const activeClock = getActiveClock();

  const snowDone = areas.filter((a) => a.snowStatus === "done").length;
  const sweepDone = areas.filter((a) => a.sweepStatus === "done").length;
  const todayEntries = timeEntries.filter(
    (t) => t.date === new Date().toISOString().split("T")[0]
  );

  const stats = [
    {
      label: "Totalt områden",
      value: areas.length,
      icon: MapPin,
      color: "text-primary",
    },
    {
      label: "Snöröjning klart",
      value: `${snowDone}/${areas.length}`,
      icon: Snowflake,
      color: "text-primary",
    },
    {
      label: "Maskinsopning klart",
      value: `${sweepDone}/${areas.length}`,
      icon: Wind,
      color: "text-accent",
    },
    {
      label: "Tidsregistreringar idag",
      value: todayEntries.length,
      icon: Clock,
      color: "text-success",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Översikt av snöröjning och maskinsopning
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
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
    </div>
  );
}
