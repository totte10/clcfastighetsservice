import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Clock, Send } from "lucide-react";

export function AdminTimeReminder() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("Glöm inte att registrera din tid för idag!");
  const [sending, setSending] = useState(false);

  if (!isAdmin) return null;

  const handleSend = async () => {
    setSending(true);
    try {
      // Get all worker user IDs
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "worker");

      const userIds = (roles ?? []).map((r) => r.user_id);

      if (userIds.length === 0) {
        toast({ title: "Inga arbetare att skicka till", variant: "destructive" });
        return;
      }

      // Insert notifications for each worker
      const notifications = userIds.map((uid) => ({
        user_id: uid,
        type: "reminder",
        title: "Påminnelse: Registrera tid",
        body: message,
        link: "/time",
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;

      toast({ title: `Påminnelse skickad till ${userIds.length} arbetare` });
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Kunde inte skicka påminnelse", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Skicka tidspåminnelse
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skicka tidspåminnelse</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Skicka en påminnelse till alla arbetare om att registrera sin tid.
          </p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Meddelande..."
            rows={3}
          />
          <Button onClick={handleSend} disabled={sending || !message.trim()} className="w-full gap-2">
            <Send className="h-4 w-4" />
            {sending ? "Skickar..." : "Skicka till alla arbetare"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
