import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Play, Square, Trash2, Send, Pencil, Check, X, ChevronDown, ChevronUp, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TimeLog {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  hours: number | null;
  note: string;
  user_email?: string;
}

interface AddressTimeLogProps {
  entryId: string;
  entryType: "tidx" | "egna" | "tmm" | "optimal";
  entryLabel?: string;
}

export function AddressTimeLog({ entryId, entryType, entryLabel }: AddressTimeLogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [activeLog, setActiveLog] = useState<TimeLog | null>(null);
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [note, setNote] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editNote, setEditNote] = useState("");

  const loadLogs = useCallback(async () => {
    const { data } = await supabase
      .from("address_time_logs")
      .select("*")
      .eq("entry_id", entryId)
      .eq("entry_type", entryType)
      .order("start_time", { ascending: false });

    if (data) {
      const mapped = data.map((d: any) => ({
        id: d.id,
        user_id: d.user_id,
        start_time: d.start_time,
        end_time: d.end_time,
        hours: d.hours ? Number(d.hours) : null,
        note: d.note,
      }));
      setLogs(mapped);
      const myActive = mapped.find((l: TimeLog) => l.user_id === user?.id && !l.end_time);
      setActiveLog(myActive || null);
    }
  }, [entryId, entryType, user?.id]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleStart = async () => {
    if (!user) return;
    const { error } = await supabase.from("address_time_logs").insert({
      user_id: user.id,
      entry_id: entryId,
      entry_type: entryType,
      start_time: new Date().toISOString(),
      note: "",
    });
    if (error) {
      toast({ title: "Kunde inte starta", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Tidtagning startad" });
    await loadLogs();
  };

  const handleStop = async () => {
    if (!activeLog) return;
    await supabase.from("address_time_logs")
      .update({ end_time: new Date().toISOString(), note })
      .eq("id", activeLog.id);
    setNote("");
    toast({ title: "Tid registrerad!" });
    await loadLogs();
  };

  const handleManualSubmit = async () => {
    if (!user || !manualStart || !manualEnd) return;
    const dateStr = manualDate || new Date().toISOString().split("T")[0];
    const startIso = new Date(`${dateStr}T${manualStart}`).toISOString();
    const endIso = new Date(`${dateStr}T${manualEnd}`).toISOString();
    await supabase.from("address_time_logs").insert({
      user_id: user.id,
      entry_id: entryId,
      entry_type: entryType,
      start_time: startIso,
      end_time: endIso,
      note,
    });
    setManualStart("");
    setManualEnd("");
    setNote("");
    setShowManual(false);
    toast({ title: "Tid registrerad!" });
    await loadLogs();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("address_time_logs").delete().eq("id", id);
    await loadLogs();
  };

  const startEdit = (log: TimeLog) => {
    setEditingId(log.id);
    setEditStart(new Date(log.start_time).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }));
    setEditEnd(log.end_time ? new Date(log.end_time).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }) : "");
    setEditNote(log.note || "");
  };

  const handleEditSave = async (log: TimeLog) => {
    const dateStr = new Date(log.start_time).toISOString().split("T")[0];
    const updates: Record<string, unknown> = {
      start_time: new Date(`${dateStr}T${editStart}`).toISOString(),
      note: editNote,
    };
    if (editEnd) {
      updates.end_time = new Date(`${dateStr}T${editEnd}`).toISOString();
    }
    await supabase.from("address_time_logs").update(updates).eq("id", log.id);
    setEditingId(null);
    toast({ title: "Tid uppdaterad" });
    await loadLogs();
  };

  const completedLogs = logs.filter((l) => l.end_time);
  const totalHours = completedLogs.reduce((sum, l) => sum + (l.hours || 0), 0);

  const formatDateFull = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit" });
  const formatDateShort = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { month: "short", day: "numeric" });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

  const reportTitle = entryLabel || `Uppdrag ${entryType}`;

  const exportCSV = () => {
    if (completedLogs.length === 0) return;
    const header = "Datum;Start;Slut;Timmar;Notering";
    const rows = completedLogs.map((l) =>
      `${formatDateFull(l.start_time)};${formatTime(l.start_time)};${formatTime(l.end_time!)};${(l.hours ?? 0).toFixed(1)};${l.note || ""}`
    );
    const totalRow = `;;Totalt;${totalHours.toFixed(1)};`;
    const csv = [header, ...rows, totalRow].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tidsrapport-${reportTitle.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exporterad" });
  };

  const exportPDF = () => {
    if (completedLogs.length === 0) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Tidsrapport – ${reportTitle}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Genererad: ${new Date().toLocaleDateString("sv-SE")}`, 14, 28);
    doc.text(`Totalt: ${totalHours.toFixed(1)} timmar (${completedLogs.length} poster)`, 14, 34);

    autoTable(doc, {
      startY: 42,
      head: [["Datum", "Start", "Slut", "Timmar", "Notering"]],
      body: completedLogs.map((l) => [
        formatDateFull(l.start_time),
        formatTime(l.start_time),
        formatTime(l.end_time!),
        (l.hours ?? 0).toFixed(1),
        l.note || "",
      ]),
      foot: [["", "", "Totalt", totalHours.toFixed(1), ""]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    });

    doc.save(`tidsrapport-${reportTitle.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    toast({ title: "PDF exporterad" });
  };


  return (
    <div className="space-y-2 border-t border-border/50 pt-2 mt-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Tid: <strong className="text-foreground">{totalHours.toFixed(1)}h</strong> ({completedLogs.length} poster)</span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        <div className="flex gap-1">
          {!activeLog ? (
            <Button size="sm" variant="outline" onClick={handleStart} className="h-7 text-xs gap-1.5 px-3">
              <Play className="h-3 w-3" /> Starta tid
            </Button>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse-slow" />
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Notering..."
                className="h-7 text-xs w-28"
              />
              <Button size="sm" variant="destructive" onClick={handleStop} className="h-7 text-xs gap-1.5 px-3">
                <Square className="h-3 w-3" /> Stopp
              </Button>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 pt-1">
          {/* Export + Manual add buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {!showManual && (
              <button
                onClick={() => setShowManual(true)}
                className="text-xs text-primary hover:underline font-medium"
              >
                + Lägg till tid manuellt
              </button>
            )}
            {completedLogs.length > 0 && (
              <>
                <Button size="sm" variant="ghost" onClick={exportCSV} className="h-6 text-[10px] gap-1 px-2 text-muted-foreground">
                  <Download className="h-3 w-3" /> CSV
                </Button>
                <Button size="sm" variant="ghost" onClick={exportPDF} className="h-6 text-[10px] gap-1 px-2 text-muted-foreground">
                  <FileText className="h-3 w-3" /> PDF
                </Button>
              </>
            )}
          </div>
          {showManual && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Lägg till manuell tid</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Datum</label>
                  <Input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Start</label>
                  <Input type="time" value={manualStart} onChange={(e) => setManualStart(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Slut</label>
                  <Input type="time" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notering (valfritt)" className="h-8 text-xs" />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleManualSubmit} className="h-8 text-xs gap-1.5">
                  <Send className="h-3 w-3" /> Spara
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowManual(false)} className="h-8 text-xs">
                  Avbryt
                </Button>
              </div>
            </div>
          )}

          {/* Time log list */}
          {completedLogs.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Registrerade tider</p>
              {completedLogs.map((log) => (
                <div key={log.id} className="rounded-md bg-muted/40 border border-border/30 p-2">
                  {editingId === log.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground">Start</label>
                          <Input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="h-7 text-xs" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">Slut</label>
                          <Input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="h-7 text-xs" />
                        </div>
                      </div>
                      <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Notering" className="h-7 text-xs" />
                      <div className="flex gap-1">
                        <Button size="sm" variant="default" onClick={() => handleEditSave(log)} className="h-6 text-[10px] gap-1 px-2">
                          <Check className="h-2.5 w-2.5" /> Spara
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-6 text-[10px] gap-1 px-2">
                          <X className="h-2.5 w-2.5" /> Avbryt
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {formatTime(log.start_time)} – {formatTime(log.end_time!)}
                          </span>
                          <span className="text-muted-foreground">({log.hours?.toFixed(1)}h)</span>
                          <span className="text-[10px] text-muted-foreground/60">{formatDateShort(log.start_time)}</span>
                        </div>
                        {log.note && <p className="text-muted-foreground italic text-[11px]">{log.note}</p>}
                      </div>
                      {log.user_id === user?.id && (
                        <div className="flex gap-1 ml-2">
                          <button onClick={() => startEdit(log)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button onClick={() => handleDelete(log.id)} className="text-destructive hover:text-destructive/80 transition-colors p-1 rounded hover:bg-destructive/10">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {completedLogs.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">Inga tider registrerade ännu</p>
          )}
        </div>
      )}
    </div>
  );
}
