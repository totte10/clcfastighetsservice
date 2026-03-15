import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger } from
"@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.
    from("notifications").
    select("*").
    eq("user_id", user.id).
    order("created_at", { ascending: false }).
    limit(30);
    setNotifications(data as Notification[] ?? []);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase.
    channel("notifications-" + user.id).
    on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 30));
      }
    ).
    subscribe();
    return () => {supabase.removeChannel(channel);};
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    await supabase.
    from("notifications").
    update({ read: true } as any).
    eq("user_id", user.id).
    eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = async (n: Notification) => {
    if (!n.read) {
      await supabase.
      from("notifications").
      update({ read: true } as any).
      eq("id", n.id);
      setNotifications((prev) =>
      prev.map((x) => x.id === n.id ? { ...x, read: true } : x)
      );
    }
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  const clearAll = async () => {
    if (!user) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
    setNotifications([]);
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "assignment":return "📋";
      case "chat":return "💬";
      case "reminder":return "⏰";
      default:return "🔔";
    }
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4 text-secondary-foreground" />
          {unreadCount > 0 &&
          <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <h3 className="text-sm font-semibold">Notifikationer</h3>
          <div className="flex gap-1">
            {unreadCount > 0 &&
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                Markera alla lästa
              </Button>
            }
            {notifications.length > 0 &&
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={clearAll}>
                Rensa
              </Button>
            }
          </div>
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ?
          <p className="text-sm text-muted-foreground text-center py-8">
              Inga notifikationer
            </p> :

          notifications.map((n) =>
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/20 ${
            !n.read ? "bg-primary/5" : ""}`
            }>
            
                <div className="flex gap-2">
                  <span className="text-sm mt-0.5">{typeIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {n.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), {
                    addSuffix: true,
                    locale: sv
                  })}
                    </p>
                  </div>
                  {!n.read &&
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
              }
                </div>
              </button>
          )
          }
        </ScrollArea>
      </PopoverContent>
    </Popover>);

}