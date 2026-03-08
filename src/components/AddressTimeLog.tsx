import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Play, Square, Trash2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  entryType: "tidx" | "egna";
}

export function AddressTimeLog({ entryId, entryType }: AddressTimeLogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [activeLog, setActiveLog] = useState<TimeLog | null>(null);
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [note, setNote] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
    const today = new Date().toISOString().split("T")[0];
    const startIso = new Date(`${today}T${manualStart}`).toISOString();
    const endIso = new Date(`${today}T${manualEnd}`).toISOString();
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

  const completedLogs = logs.filter((l) => l.end_time);
  const totalHours = completedLogs.reduce((sum, l) => sum + (l.hours || 0), 0);

  return (
    <div className="space-y-2 border-t border-border/50 pt-2 mt-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Clock className="h-3 w-3" />
          Tid: {totalHours.toFixed(1)}h ({completedLogs.length} poster)
        </button>
        <div className="flex gap-1">
          {!activeLog ? (
            <Button size="sm" variant="outline" onClick={handleStart} className="h-6 text-[10px] gap-1 px-2">
              <Play className="h-2.5 w-2.5" /> Starta
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse-slow" />
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Notering..."
                className="h-6 text-[10px] w-24"
              />
              <Button size="sm" variant="destructive" onClick={handleStop} className="h-6 text-[10px] gap-1 px-2">
                <Square className="h-2.5 w-2.5" /> Stopp
              </Button>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-2">
          {!showManual ? (
            <button
              onClick={() => setShowManual(true)}
              className="text-[10px] text-primary hover:underline"
            >
              + Lägg till manuellt
            </button>
          ) : (
            <div className="flex gap-1.5 items-end">
              <Input type="time" value={manualStart} onChange={(e) => setManualStart(e.target.value)} className="h-7 text-[10px] w-20" />
              <span className="text-[10px] text-muted-foreground pb-1">–</span>
              <Input type="time" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} className="h-7 text-[10px] w-20" />
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Not." className="h-7 text-[10px] flex-1" />
              <Button size="sm" onClick={handleManualSubmit} className="h-7 text-[10px] gap-1 px-2">
                <Send className="h-2.5 w-2.5" />
              </Button>
            </div>
          )}

          {completedLogs.length > 0 && (
            <div className="space-y-1">
              {completedLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-[10px] py-1 px-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">
                    {new Date(log.start_time).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                    –
                    {new Date(log.end_time!).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                    {" "}({log.hours?.toFixed(1)}h)
                    {log.note && <span className="ml-1 italic">· {log.note}</span>}
                  </span>
                  {log.user_id === user?.id && (
                    <button onClick={() => handleDelete(log.id)} className="text-destructive hover:text-destructive/80 ml-2">
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
