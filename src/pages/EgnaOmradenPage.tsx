import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Fan, Wind, Calendar, Clock } from "lucide-react";

type Status = "pending" | "in-progress" | "done";

interface EgnaEntry {
  id: string;
  address: string;
  datumPlanerat: string;
  blowStatus: Status;
  sweepStatus: Status;
  ansvarig: string;
  kommentar: string;
  timmar: number;
}

const INITIAL_DATA: EgnaEntry[] = [
  { id: "e1", address: "Furumossen sektion 1", datumPlanerat: "2026-03-16", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "blåsa samt kratta flis från gräset, jobba i sektioner", timmar: 8 },
  { id: "e2", address: "Furumossen sektion 2", datumPlanerat: "2026-03-17", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "kolla kartan", timmar: 8 },
  { id: "e3", address: "Furumossen sektion 3", datumPlanerat: "2026-03-18", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 4 },
  { id: "e4", address: "Sigalett Furulund", datumPlanerat: "2026-03-18", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 4 },
  { id: "e5", address: "Kruthusgatan 17-19", datumPlanerat: "2026-03-19", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 6 },
  { id: "e6", address: "Kalkylvägen 3, Parea Mölnlycke", datumPlanerat: "2026-03-19", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 2 },
  { id: "e7", address: "Gastorp/Rantorp", datumPlanerat: "2026-03-20", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 3 },
  { id: "e8", address: "Kåltorp Bygg", datumPlanerat: "2026-03-20", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 3 },
  { id: "e9", address: "ÅBY Travet", datumPlanerat: "2026-03-23", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 8 },
  { id: "e10", address: "Bergsjödalen 60-62 Constructor", datumPlanerat: "2026-03-24", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "första på högersida", timmar: 3 },
  { id: "e11", address: "Bergsjödalen Magnussons Fisk", datumPlanerat: "2026-03-24", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "längst in till vänster på gatan", timmar: 2 },
  { id: "e12", address: "Bergsjödalen 45 Österberg", datumPlanerat: "2026-03-24", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "innan Magnussons Fisk", timmar: 2 },
  { id: "e13", address: "Konstruktionsvägen 3", datumPlanerat: "2026-03-25", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 4 },
  { id: "e14", address: "Fraktvägen 7b", datumPlanerat: "2026-03-25", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 4 },
  { id: "e15", address: "Åkarevägen 3a", datumPlanerat: "2026-03-26", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 4 },
  { id: "e16", address: "Mediavägen", datumPlanerat: "2026-03-26", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 4 },
  { id: "e17", address: "DHL Flyget", datumPlanerat: "2026-03-30", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 2 },
  { id: "e18", address: "Ambulansflyg Givet", datumPlanerat: "2026-03-30", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e19", address: "Flygfrakt Givet", datumPlanerat: "2026-03-30", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 3 },
  { id: "e20", address: "OKQ8", datumPlanerat: "2026-03-30", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e21", address: "Mjuk Biltvätt Sisjön", datumPlanerat: "2026-03-31", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e22", address: "Mjuk Biltvätt Marconimotet", datumPlanerat: "2026-03-31", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e23", address: "Mjuk Biltvätt Backaplan", datumPlanerat: "2026-03-31", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e24", address: "Mjuk Biltvätt Kungsbacka", datumPlanerat: "2026-03-31", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e25", address: "Mjuk Biltvätt Kungälv", datumPlanerat: "2026-03-31", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e26", address: "Mjuk Biltvätt Sävedalen", datumPlanerat: "2026-03-31", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e27", address: "Mjuk Biltvätt Norra Ågatan", datumPlanerat: "2026-03-31", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 1 },
  { id: "e28", address: "Eken Center", datumPlanerat: "2026-03-16 kvällstid 21:00", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 0 },
  { id: "e29", address: "Ekenleden 11-15", datumPlanerat: "2026-03-16 kvällstid 21:00", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 0 },
  { id: "e30", address: "Norra Ågatan 36", datumPlanerat: "2026-03-17 kvällstid", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 0 },
  { id: "e31", address: "Topasgatan 3", datumPlanerat: "2026-03-17 kvällstid", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 0 },
  { id: "e32", address: "Kryptongatan 6", datumPlanerat: "2026-03-17 dagtid", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 0 },
  { id: "e33", address: "Järnvägsgatan 6 / Torggatan 5", datumPlanerat: "2026-03-17 dagtid", blowStatus: "pending", sweepStatus: "pending", ansvarig: "", kommentar: "", timmar: 0 },
];

const STORAGE_KEY = "clc_egna_omraden";

function loadEntries(): EgnaEntry[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
  return INITIAL_DATA;
}

function saveEntries(entries: EgnaEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export default function EgnaOmradenPage() {
  const [entries, setEntries] = useState<EgnaEntry[]>(loadEntries);

  const updateEntry = (id: string, updates: Partial<EgnaEntry>) => {
    const updated = entries.map((e) => (e.id === id ? { ...e, ...updates } : e));
    setEntries(updated);
    saveEntries(updated);
  };

  const blowDone = entries.filter((e) => e.blowStatus === "done").length;
  const sweepDone = entries.filter((e) => e.sweepStatus === "done").length;
  const total = entries.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Egna Områden</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Blåsning: {blowDone}/{total} klara · Maskinsopning: {sweepDone}/{total} klara
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4 text-center">
            <Fan className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-semibold text-primary">{blowDone}/{total}</p>
            <p className="text-xs text-muted-foreground">Framblåsning klart</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4 text-center">
            <Wind className="h-5 w-5 mx-auto mb-1 text-accent-foreground" />
            <p className="text-2xl font-semibold">{sweepDone}/{total}</p>
            <p className="text-xs text-muted-foreground">Maskinsopning klart</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <Card key={entry.id} className="glass-card">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div>
                <p className="text-sm font-medium">{entry.address}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {entry.datumPlanerat}
                  </span>
                  {entry.timmar > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {entry.timmar}h
                    </span>
                  )}
                </div>
                {entry.kommentar && (
                  <p className="text-xs text-muted-foreground/70 italic mt-1">{entry.kommentar}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Fan className="h-3 w-3 text-primary" />
                    Framblåsning
                    <StatusBadge status={entry.blowStatus} />
                  </div>
                  <Select
                    value={entry.blowStatus}
                    onValueChange={(v) => updateEntry(entry.id, { blowStatus: v as Status })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Ej påbörjad</SelectItem>
                      <SelectItem value="in-progress">Pågår</SelectItem>
                      <SelectItem value="done">Klart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Wind className="h-3 w-3 text-accent-foreground" />
                    Maskinsopning
                    <StatusBadge status={entry.sweepStatus} />
                  </div>
                  <Select
                    value={entry.sweepStatus}
                    onValueChange={(v) => updateEntry(entry.id, { sweepStatus: v as Status })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Ej påbörjad</SelectItem>
                      <SelectItem value="in-progress">Pågår</SelectItem>
                      <SelectItem value="done">Klart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Input
                  value={entry.ansvarig}
                  onChange={(e) => updateEntry(entry.id, { ansvarig: e.target.value })}
                  placeholder="Ansvarig"
                  className="h-8 text-xs"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}