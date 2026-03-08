import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Wind, Calendar, Clock, User } from "lucide-react";

type Status = "pending" | "in-progress" | "done";

interface TidxEntry {
  id: string;
  område: string;
  address: string;
  datumPlanerat: string;
  status: Status;
  ansvarig: string;
  kommentar: string;
  timmarMaskin: number;
}

const INITIAL_DATA: TidxEntry[] = [
  { id: "1", område: "1", address: "Kållered - Ekenleden 3", datumPlanerat: "2026-03-16 kvällstid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 15 },
  { id: "2", område: "1", address: "Kållered - Ekenleden 11-15", datumPlanerat: "2026-03-16 kvällstid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 15 },
  { id: "3", område: "1", address: "Göteborg - Järnvägsgatan 6 / Torggatan 5", datumPlanerat: "2026-03-17 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 3 },
  { id: "4", område: "1", address: "Göteborg - Kryptongatan 6", datumPlanerat: "2026-03-17 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 5 },
  { id: "5", område: "1", address: "Topasgatan 3", datumPlanerat: "2026-03-17 kvällstid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 10 },
  { id: "6", område: "1", address: "Mölndal - Norra Ågatan 36", datumPlanerat: "2026-03-17 kvällstid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 3 },
  { id: "7", område: "1", address: "Göteborg Billdal - SFF Skintebo - Klyfteråsvägen", datumPlanerat: "2026-03-20 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 45 },
  { id: "8", område: "1", address: "Göteborg Bratteråsgatan 31-39 & 60-74", datumPlanerat: "2026-03-23 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 8 },
  { id: "9", område: "2", address: "Göteborg - Aminogatan 15", datumPlanerat: "2026-03-24 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 3 },
  { id: "10", område: "2", address: "Tagenevägen 70", datumPlanerat: "2026-03-24 kvällstid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 3 },
  { id: "11", område: "2", address: "Orrekulla industrigata 36", datumPlanerat: "2026-03-24 kvällstid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 3 },
  { id: "12", område: "2", address: "Tagenevägen 72", datumPlanerat: "2026-03-24 kvällstid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 3 },
  { id: "13", område: "2", address: "Göteborg - Aminogatan 18", datumPlanerat: "2026-03-24 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 3 },
  { id: "14", område: "2", address: "Göteborg - Åkeredsvägen 3-5", datumPlanerat: "2026-03-25 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 3 },
  { id: "15", område: "2", address: "Göteborg - JA Gahms gatan 4", datumPlanerat: "2026-03-25 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 5 },
  { id: "16", område: "2", address: "Göteborg - Södra Långebergsgatan 18", datumPlanerat: "2026-03-25 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 3 },
  { id: "17", område: "3", address: "Göteborg - Askims Verkstadsväg 3", datumPlanerat: "2026-03-26 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 2 },
  { id: "18", område: "3", address: "Göteborg - Datavägen 43A-F", datumPlanerat: "2026-03-26 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 3 },
  { id: "19", område: "3", address: "Göteborg - Famngatan - SSF Flatås Alléer GA 60", datumPlanerat: "2026-03-26 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 2 },
  { id: "20", område: "2", address: "Göteborg - Kvarnbergsgatan 2", datumPlanerat: "2026-03-27 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 5 },
  { id: "21", område: "3", address: "Göteborg - E A Rosengrensgata 18", datumPlanerat: "2026-03-27 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 3 },
  { id: "22", område: "3", address: "Mölndal - Ragnar Thorngrens gata", datumPlanerat: "2026-03-27 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 3 },
  { id: "23", område: "2", address: "Landvetter - Östra Björrödsvägen 2", datumPlanerat: "2026-03-30 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 2 },
  { id: "24", område: "3", address: "Härryda - Brunnbergsvägen 1", datumPlanerat: "2026-03-30 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 5 },
  { id: "25", område: "3", address: "Partille - Eckens väg 22", datumPlanerat: "2026-03-30 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 5 },
  { id: "26", område: "2", address: "Mölndal - BRF Täckdiket 4 - Vetekornsgatan 3-37", datumPlanerat: "2026-03-31 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 5 },
  { id: "27", område: "3", address: "Mölndal - Nils Hasselskogsgata 1-9", datumPlanerat: "2026-03-31 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 3 },
  { id: "28", område: "3", address: "Mölndal - Bifrostgatan 45", datumPlanerat: "2026-03-31 dagtid", status: "pending", ansvarig: "", kommentar: "", timmarMaskin: 2 },
];

const STORAGE_KEY = "clc_tidx_sopningar";

function loadEntries(): TidxEntry[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
  return INITIAL_DATA;
}

function saveEntries(entries: TidxEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export default function TidxSopningarPage() {
  const [entries, setEntries] = useState<TidxEntry[]>(loadEntries);

  const updateEntry = (id: string, updates: Partial<TidxEntry>) => {
    const updated = entries.map((e) => (e.id === id ? { ...e, ...updates } : e));
    setEntries(updated);
    saveEntries(updated);
  };

  const done = entries.filter((e) => e.status === "done").length;
  const inProgress = entries.filter((e) => e.status === "in-progress").length;
  const totalHours = entries.reduce((sum, e) => sum + e.timmarMaskin, 0);
  const doneHours = entries.filter((e) => e.status === "done").reduce((sum, e) => sum + e.timmarMaskin, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tidx Sopningar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {done}/{entries.length} klara · {inProgress} pågår · {doneHours}/{totalHours} maskintimmar
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-semibold text-primary">{done}</p>
            <p className="text-xs text-muted-foreground">Klara</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-semibold text-warning">{inProgress}</p>
            <p className="text-xs text-muted-foreground">Pågår</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-semibold text-destructive">{entries.length - done - inProgress}</p>
            <p className="text-xs text-muted-foreground">Ej påbörjad</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <Card key={entry.id} className="glass-card">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] tracking-widest uppercase text-muted-foreground/60 font-medium">
                      Område {entry.område}
                    </span>
                    <StatusBadge status={entry.status} />
                  </div>
                  <p className="text-sm font-medium truncate">{entry.address}</p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {entry.datumPlanerat}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {entry.timmarMaskin}h maskin
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={entry.status}
                  onValueChange={(v) => updateEntry(entry.id, { status: v as Status })}
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
                <Input
                  value={entry.ansvarig}
                  onChange={(e) => updateEntry(entry.id, { ansvarig: e.target.value })}
                  placeholder="Ansvarig"
                  className="h-8 text-xs"
                />
                <Input
                  value={entry.kommentar}
                  onChange={(e) => updateEntry(entry.id, { kommentar: e.target.value })}
                  placeholder="Kommentar"
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
