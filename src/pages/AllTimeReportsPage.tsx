import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Clock, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TimeLogRow {
  id: string;
  entry_id: string;
  entry_type: string;
  start_time: string;
  end_time: string | null;
  hours: number | null;
  note: string;
  user_id: string;
  address?: string;
  userName?: string;
}

export default function AllTimeReportsPage() {
  const [logs, setLogs] = useState<TimeLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const { toast } = useToast();

  const loadLogs = useCallback(async () => {
    setLoading(true);

    // Fetch all time logs
    const { data: timeLogs } = await supabase
      .from("address_time_logs")
      .select("*")
      .order("start_time", { ascending: false });

    // Fetch addresses for tidx and egna entries
    const [{ data: tidxData }, { data: egnaData }] = await Promise.all([
      supabase.from("tidx_entries").select("id, address"),
      supabase.from("egna_entries").select("id, address"),
    ]);

    const addressMap = new Map<string, string>();
    tidxData?.forEach((e) => addressMap.set(e.id, e.address));
    egnaData?.forEach((e) => addressMap.set(e.id, e.address));

    const mapped: TimeLogRow[] = (timeLogs ?? []).map((l) => ({
      id: l.id,
      entry_id: l.entry_id,
      entry_type: l.entry_type,
      start_time: l.start_time,
      end_time: l.end_time,
      hours: l.hours ? Number(l.hours) : null,
      note: l.note,
      user_id: l.user_id,
      address: addressMap.get(l.entry_id) ?? "Okänd adress",
    }));

    setLogs(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = logs.filter((l) => {
    if (filterType !== "all" && l.entry_type !== filterType) return false;
    if (filterFrom && l.start_time < filterFrom) return false;
    if (filterTo && l.start_time > filterTo + "T23:59:59") return false;
    return true;
  });

  const totalHours = filtered.reduce((s, l) => s + (l.hours ?? 0), 0);

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("sv-SE");
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

  const exportCSV = () => {
    const header = "Datum;Adress;Typ;Start;Slut;Timmar;Anteckning";
    const rows = filtered.map((l) =>
      [
        fmtDate(l.start_time),
        l.address,
        l.entry_type === "tidx" ? "Tidx" : "Egna",
        fmtTime(l.start_time),
        l.end_time ? fmtTime(l.end_time) : "",
        l.hours?.toFixed(2) ?? "",
        l.note,
      ].join(";")
    );
    const csv = [header, ...rows, `;;;;;;Totalt: ${totalHours.toFixed(2)}h`].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tidsrapport-alla-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exporterad!" });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Samlad Tidsrapport", 14, 18);
    doc.setFontSize(10);
    doc.text(`Genererad: ${new Date().toLocaleDateString("sv-SE")}`, 14, 26);
    if (filterFrom || filterTo) {
      doc.text(`Period: ${filterFrom || "—"} till ${filterTo || "—"}`, 14, 32);
    }

    autoTable(doc, {
      startY: filterFrom || filterTo ? 38 : 32,
      head: [["Datum", "Adress", "Typ", "Start", "Slut", "Timmar", "Anteckning"]],
      body: filtered.map((l) => [
        fmtDate(l.start_time),
        l.address,
        l.entry_type === "tidx" ? "Tidx" : "Egna",
        fmtTime(l.start_time),
        l.end_time ? fmtTime(l.end_time) : "",
        l.hours?.toFixed(2) ?? "",
        l.note,
      ]),
      foot: [["", "", "", "", "Totalt", totalHours.toFixed(2) + "h", ""]],
      styles: { fontSize: 8 },
    });

    doc.save(`tidsrapport-alla-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "PDF exporterad!" });
  };

  // Group by address for summary
  const byAddress = new Map<string, { address: string; type: string; totalHours: number; count: number }>();
  filtered.forEach((l) => {
    const key = l.entry_id;
    const existing = byAddress.get(key);
    if (existing) {
      existing.totalHours += l.hours ?? 0;
      existing.count += 1;
    } else {
      byAddress.set(key, {
        address: l.address ?? "Okänd",
        type: l.entry_type,
        totalHours: l.hours ?? 0,
        count: 1,
      });
    }
  });
  const summaryRows = Array.from(byAddress.values()).sort((a, b) => b.totalHours - a.totalHours);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Samlad Tidsrapport
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={filtered.length === 0}>
            <FileText className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Typ</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla</SelectItem>
                  <SelectItem value="tidx">Tidx Sopningar</SelectItem>
                  <SelectItem value="egna">Egna Områden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Från datum</Label>
              <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Till datum</Label>
              <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary by address */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Sammanställning per adress</CardTitle>
        </CardHeader>
        <CardContent>
          {summaryRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga tidsregistreringar att visa.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adress</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead className="text-right">Antal poster</TableHead>
                  <TableHead className="text-right">Totalt (h)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryRows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.address}</TableCell>
                    <TableCell>
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
                        {r.type === "tidx" ? "Tidx" : "Egna"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{r.count}</TableCell>
                    <TableCell className="text-right font-semibold">{r.totalHours.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2">
                  <TableCell colSpan={3} className="font-bold">Totalt</TableCell>
                  <TableCell className="text-right font-bold">{totalHours.toFixed(2)}h</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detailed log */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Alla tidsregistreringar ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Laddar...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga poster matchar filtret.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Adress</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>Slut</TableHead>
                    <TableHead className="text-right">Timmar</TableHead>
                    <TableHead>Anteckning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap">{fmtDate(l.start_time)}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{l.address}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
                          {l.entry_type === "tidx" ? "Tidx" : "Egna"}
                        </span>
                      </TableCell>
                      <TableCell>{fmtTime(l.start_time)}</TableCell>
                      <TableCell>{l.end_time ? fmtTime(l.end_time) : "—"}</TableCell>
                      <TableCell className="text-right">{l.hours?.toFixed(2) ?? "—"}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-muted-foreground text-xs">{l.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
