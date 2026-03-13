import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePlus, Loader2, X, Clock, Truck, MessageSquare, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DailyTask, Status } from "./DashboardTaskCard";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: DailyTask;
  onComplete: (task: DailyTask, data: CompletionData) => Promise<void>;
}

export interface CompletionData {
  startTime: string;
  endTime: string;
  comment: string;
  flisLass?: number;
  images: string[];
}

export function TaskCompletionDialog({ open, onOpenChange, task, onComplete }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [comment, setComment] = useState("");
  const [flisLass, setFlisLass] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load active time log for this task when dialog opens
  useEffect(() => {
    if (!open || !user) return;

    async function loadActiveLog() {
      // Check for active time log (started when clicking "Starta")
      const { data } = await supabase
        .from("address_time_logs")
        .select("*")
        .eq("entry_id", task.realId)
        .eq("entry_type", task.source)
        .eq("user_id", user!.id)
        .is("end_time", null)
        .order("start_time", { ascending: false })
        .limit(1);

      const now = new Date();
      const nowTime = now.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

      if (data && data.length > 0) {
        const log = data[0];
        const start = new Date(log.start_time);
        setStartTime(start.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }));
      } else {
        setStartTime("");
      }
      setEndTime(nowTime);
      setComment("");
      setFlisLass("");
      setImages([]);
    }

    loadActiveLog();
  }, [open, user, task.realId, task.source]);

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      setUploading(true);
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("entry-images").upload(path, file);
        if (error) { console.error("Upload error:", error); continue; }
        const { data: urlData } = supabase.storage.from("entry-images").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
      if (newUrls.length > 0) {
        setImages(prev => [...prev, ...newUrls]);
        toast({ title: `${newUrls.length} bild(er) uppladdade` });
      }
      setUploading(false);
    };
    input.click();
  };

  const isValid = startTime.trim() !== "" && endTime.trim() !== "" && comment.trim() !== "" && (!task.isSweep || (flisLass !== "" && parseInt(flisLass) >= 1 && parseInt(flisLass) <= 10));

  const handleSubmit = async () => {
    if (!isValid) {
      toast({ title: "Fyll i alla obligatoriska fält", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await onComplete(task, {
        startTime,
        endTime,
        comment,
        flisLass: task.isSweep ? parseInt(flisLass) : undefined,
        images,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const missingFields: string[] = [];
  if (!startTime.trim()) missingFields.push("Starttid");
  if (!endTime.trim()) missingFields.push("Sluttid");
  if (!comment.trim()) missingFields.push("Kommentar");
  if (images.length === 0) missingFields.push("Minst 1 bild");
  if (task.isSweep && (!flisLass || parseInt(flisLass) < 1)) missingFields.push("Deponi (lass flis)");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Slutför uppdrag</DialogTitle>
          <p className="text-xs text-muted-foreground truncate">{task.address} – {task.serviceLabel}</p>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <Label className="text-xs font-medium">Tidsregistrering *</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Starttid</label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Sluttid</label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            {startTime && endTime && (
              <p className="text-[10px] text-muted-foreground">
                Beräknad tid: {calculateHours(startTime, endTime)}h
              </p>
            )}
          </div>

          {/* Deponi - only for sweep */}
          {task.isSweep && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-primary" />
                <Label className="text-xs font-medium">Deponi – Antal lass flis *</Label>
              </div>
              <Select value={flisLass} onValueChange={setFlisLass}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Välj antal (1–10)" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <SelectItem key={n} value={String(n)}>{n} lass</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Images */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5 text-primary" />
              <Label className="text-xs font-medium">Bilder *</Label>
              <span className="text-[10px] text-muted-foreground">(minst 1)</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleUpload} disabled={uploading} className="gap-1.5 text-xs w-full h-9">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              {uploading ? "Laddar upp..." : "Lägg till bild"}
            </Button>
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt={`Bild ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border border-border" />
                    <button
                      onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <Label className="text-xs font-medium">Kommentar *</Label>
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Beskriv utfört arbete, eventuella problem..."
              rows={3}
              className="text-sm"
            />
          </div>
        </div>

        {/* Validation message */}
        {missingFields.length > 0 && (
          <p className="text-[10px] text-destructive">Saknas: {missingFields.join(", ")}</p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">Avbryt</Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting} className="text-xs gap-1.5">
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Markera som klar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function calculateHours(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return (diff / 60).toFixed(1);
}
