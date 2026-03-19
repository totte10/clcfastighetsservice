import { useMemo, useState } from "react";
import { addDays, format, isValid, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users } from "lucide-react";

interface Job {
  id: string;
  name: string;
  address: string;
  date?: string | null;
  status?: string | null;
  workers?: string[];
  type?: string | null;
}

function safeDate(value?: string | null) {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function getStatusLabel(status?: string | null) {
  if (status === "done") return "Klar";
  if (status === "in-progress") return "Pågår";
  return "Planerad";
}

function getSourceLabel(type?: string | null) {
  switch (type) {
    case "project":
      return "Projekt";
    case "tidx":
      return "TIDX";
    case "egna":
      return "Egna";
    case "tmm":
      return "TMM";
    case "optimal":
      return "Optimal";
    default:
      return "Jobb";
  }
}

export default function PlannerUI({ jobs }: { jobs: Job[] }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const days = useMemo(
    () => Array.from({ length: 9 }, (_, i) => addDays(new Date(), i - 4)),
    []
  );

  const selectedKey = format(selectedDate, "yyyy-MM-dd");

  const filteredJobs = useMemo(
    () =>
      (jobs ?? []).filter((job) => {
        const parsed = safeDate(job?.date);
        return parsed ? format(parsed, "yyyy-MM-dd") === selectedKey : false;
      }),
    [jobs, selectedKey]
  );

  return (
    <div className="space-y-6 text-foreground">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Planering</p>
        <h1 className="text-3xl font-bold leading-tight">Dina uppdrag</h1>
        <p className="text-sm text-muted-foreground">Välj dag och se alla planerade jobb i en enhetlig vy.</p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex gap-3 min-w-max">
          {days.map((day) => {
            const isActive = format(day, "yyyy-MM-dd") === selectedKey;
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={isActive ? "glass-pill-active min-w-[74px] py-3" : "glass-pill min-w-[74px] py-3"}
              >
                <span className="block text-[10px] uppercase tracking-wide opacity-80">
                  {format(day, "EEE", { locale: sv })}
                </span>
                <span className="mt-1 block text-lg font-semibold">{format(day, "d")}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="glass-card p-5 text-sm text-muted-foreground">Inga jobb för vald dag.</div>
        ) : (
          filteredJobs.map((job, index) => (
            <article
              key={job.id || `${job.name}-${index}`}
              className="glass-card p-5 animate-fade-up"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{getSourceLabel(job?.type)}</Badge>
                    <Badge variant={job?.status === "done" ? "default" : "outline"}>{getStatusLabel(job?.status)}</Badge>
                  </div>
                  <h2 className="text-lg font-semibold leading-tight">{job?.name || "Namnlöst jobb"}</h2>
                </div>
                <Button type="button" size="sm" variant="secondary" className="shrink-0">
                  {format(selectedDate, "d MMM", { locale: sv })}
                </Button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{job?.address || "Adress saknas"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-primary" />
                  <span>
                    {job?.workers && job.workers.length > 0 ? job.workers.join(", ") : "Inga tilldelade medarbetare"}
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
