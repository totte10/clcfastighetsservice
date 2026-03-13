import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Calendar, User, FileText, Truck, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DailyTask, Status, SourceType } from "./DashboardTaskCard";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: DailyTask;
  onSaved: () => void;
}

export function TaskEditDialog({ open, onOpenChange, task, onSaved }: Props) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<string>("pending");
  const [scheduledDate, setScheduledDate] = useState("");
  const [comment, setComment] = useState("");
  const [ansvarig, setAnsvarig] = useState("");
  const [flisLass, setFlisLass] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [typ, setTyp] = useState("");
  const [foretag, setForetag] = useState("");

  // Load current data from DB when dialog opens
  useEffect(() => {
    if (!open) return;
    loadEntry();
  }, [open, task.realId, task.source]);

  async function loadEntry() {
    let data: any = null;

    if (task.source === "tidx") {
      const res = await supabase.from("tidx_entries").select("*").eq("id", task.realId).single();
      data = res.data;
    } else if (task.source === "egna") {
      const res = await supabase.from("egna_entries").select("*").eq("id", task.realId).single();
      data = res.data;
    } else if (task.source === "tmm") {
      const res = await supabase.from("tmm_entries").select("*").eq("id", task.realId).single();
      data = res.data;
    } else if (task.source === "optimal") {
      const res = await supabase.from("optimal_entries").select("*").eq("id", task.realId).single();
      data = res.data;
    } else if (task.source === "project") {
      const res = await supabase.from("projects").select("*").eq("id", task.realId).single();
      data = res.data;
    }

    if (!data) return;

    setAddress(data.address || "");
    setFlisLass(data.flis_lass ?? 0);
    setComment(data.kommentar ?? data.notes ?? data.description ?? "");
    setAnsvarig(data.ansvarig ?? "");
    setProjectName(data.name ?? data.omrade ?? "");
    setTyp(data.typ ?? "");
    setForetag(data.foretag ?? "");

    // Status - handle egna differently
    if (task.source === "egna") {
      setStatus(task.sourceField === "blowStatus" ? (data.blow_status || "pending") : (data.sweep_status || "pending"));
    } else {
      setStatus(data.status || "pending");
    }

    // Scheduled date
    setScheduledDate(data.datum_planerat ?? data.datum ?? data.datum_start ?? "");
  }

  async function handleSave() {
    if (!isAdmin) return;
    setSaving(true);
    try {
      if (task.source === "tidx") {
        await supabase.from("tidx_entries").update({
          address,
          status,
          datum_planerat: scheduledDate,
          kommentar: comment,
          ansvarig,
          flis_lass: flisLass,
          omrade: projectName,
        }).eq("id", task.realId);
      } else if (task.source === "egna") {
        const statusField = task.sourceField === "blowStatus" ? "blow_status" : "sweep_status";
        await supabase.from("egna_entries").update({
          address,
          [statusField]: status,
          datum_planerat: scheduledDate,
          kommentar: comment,
          ansvarig,
          flis_lass: flisLass,
        }).eq("id", task.realId);
      } else if (task.source === "tmm") {
        await supabase.from("tmm_entries").update({
          address,
          status,
          datum: scheduledDate,
          notes: comment,
          ansvarig,
          flis_lass: flisLass,
          typ,
          foretag,
        }).eq("id", task.realId);
      } else if (task.source === "optimal") {
        await supabase.from("optimal_entries").update({
          address,
          status,
          datum_start: scheduledDate,
          notes: comment,
          flis_lass: flisLass,
          typ,
          foretag,
          name: projectName,
        }).eq("id", task.realId);
      } else if (task.source === "project") {
        await supabase.from("projects").update({
          address,
          status,
          datum_planerat: scheduledDate,
          description: comment,
          name: projectName,
          flis_lass: flisLass,
        }).eq("id", task.realId);
      }

      toast({ title: "Uppdrag uppdaterat" });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Kunde inte spara", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{task.address}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <InfoRow icon={<ClipboardList className="h-3.5 w-3.5" />} label="Tjänst" value={task.serviceLabel} />
            <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="Projekt" value={task.projectName} />
            <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Datum" value={task.scheduledDate || "–"} />
            <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Tilldelade" value={task.assignedUsers.join(", ") || "–"} />
            {task.flisLass != null && task.flisLass > 0 && (
              <InfoRow icon={<Truck className="h-3.5 w-3.5" />} label="Lass flis" value={String(task.flisLass)} />
            )}
            {task.lat && task.lng && (
              <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Position" value={`${task.lat.toFixed(4)}, ${task.lng.toFixed(4)}`} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Redigera uppdrag</DialogTitle>
          <p className="text-xs text-muted-foreground">{task.source.toUpperCase()} – {task.serviceLabel}</p>
        </DialogHeader>

        <div className="grid gap-3.5 py-2">
          {/* Address */}
          <Field label="Adress" icon={<MapPin className="h-3.5 w-3.5 text-primary" />}>
            <Input value={address} onChange={e => setAddress(e.target.value)} className="h-9 text-sm" />
          </Field>

          {/* Status */}
          <Field label="Status" icon={<ClipboardList className="h-3.5 w-3.5 text-primary" />}>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Ej påbörjad</SelectItem>
                <SelectItem value="in-progress">Pågår</SelectItem>
                <SelectItem value="done">Klar</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* Scheduled date */}
          <Field label="Planerat datum" icon={<Calendar className="h-3.5 w-3.5 text-primary" />}>
            <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="h-9 text-sm" />
          </Field>

          {/* Project name / Område */}
          {(task.source === "tidx" || task.source === "optimal" || task.source === "project") && (
            <Field label={task.source === "tidx" ? "Område" : "Namn"} icon={<FileText className="h-3.5 w-3.5 text-primary" />}>
              <Input value={projectName} onChange={e => setProjectName(e.target.value)} className="h-9 text-sm" />
            </Field>
          )}

          {/* Företag */}
          {(task.source === "tmm" || task.source === "optimal") && (
            <Field label="Företag" icon={<User className="h-3.5 w-3.5 text-primary" />}>
              <Input value={foretag} onChange={e => setForetag(e.target.value)} className="h-9 text-sm" />
            </Field>
          )}

          {/* Typ */}
          {(task.source === "tmm" || task.source === "optimal") && (
            <Field label="Typ" icon={<ClipboardList className="h-3.5 w-3.5 text-primary" />}>
              <Input value={typ} onChange={e => setTyp(e.target.value)} className="h-9 text-sm" />
            </Field>
          )}

          {/* Ansvarig */}
          {(task.source === "tidx" || task.source === "egna" || task.source === "tmm") && (
            <Field label="Ansvarig" icon={<User className="h-3.5 w-3.5 text-primary" />}>
              <Input value={ansvarig} onChange={e => setAnsvarig(e.target.value)} className="h-9 text-sm" />
            </Field>
          )}

          {/* Flis lass */}
          {task.isSweep && (
            <Field label="Lass flis" icon={<Truck className="h-3.5 w-3.5 text-primary" />}>
              <Input type="number" min={0} max={50} value={flisLass} onChange={e => setFlisLass(Number(e.target.value))} className="h-9 text-sm" />
            </Field>
          )}

          {/* Comment */}
          <Field label="Kommentar / Anteckning" icon={<FileText className="h-3.5 w-3.5 text-primary" />}>
            <Textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} className="text-sm" />
          </Field>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">Avbryt</Button>
          <Button onClick={handleSave} disabled={saving} className="text-xs gap-1.5">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Spara ändringar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <Label className="text-xs font-medium">{label}</Label>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
