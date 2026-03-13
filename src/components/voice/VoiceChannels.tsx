import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { VoiceRoom } from "./VoiceRoom";

interface Participant {
  id: string;
  channel_name: string;
  user_id: string;
  display_name: string;
  is_muted: boolean;
}

const CHANNELS = [
  { name: "Maskinsopning", icon: "🧹" },
  { name: "Framblåsning", icon: "🌬️" },
];

export function VoiceChannels() {
  const { user, profile } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchParticipants();

    const channel = supabase
      .channel("voice_presence")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "voice_channel_participants" },
        () => fetchParticipants()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cleanup on unmount / page leave
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeChannel && user) {
        navigator.sendBeacon && leaveChannel();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (activeChannel) leaveChannel();
    };
  }, [activeChannel, user]);

  async function fetchParticipants() {
    const { data } = await supabase
      .from("voice_channel_participants")
      .select("*");
    if (data) setParticipants(data as Participant[]);
  }

  async function joinChannel(channelName: string) {
    if (!user) return;

    try {
      // Get token from edge function
      const { data, error } = await supabase.functions.invoke("livekit-token", {
        body: { room: channelName },
      });

      if (error || !data?.token) {
        toast.error("Kunde inte ansluta till röstkanal");
        return;
      }

      // Remove any existing presence first
      await supabase
        .from("voice_channel_participants")
        .delete()
        .eq("user_id", user.id);

      // Insert new presence
      await supabase.from("voice_channel_participants").insert({
        channel_name: channelName,
        user_id: user.id,
        display_name: profile?.fullName || "Anonym",
        is_muted: false,
      });

      setToken(data.token);
      setLivekitUrl(data.url);
      setActiveChannel(channelName);
      setIsMuted(false);
    } catch {
      toast.error("Kunde inte ansluta till röstkanal");
    }
  }

  async function leaveChannel() {
    if (!user) return;

    await supabase
      .from("voice_channel_participants")
      .delete()
      .eq("user_id", user.id);

    setActiveChannel(null);
    setToken(null);
    setLivekitUrl(null);
    setIsMuted(false);
  }

  async function toggleMute() {
    if (!user || !activeChannel) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    await supabase
      .from("voice_channel_participants")
      .update({ is_muted: newMuted })
      .eq("user_id", user.id);
  }

  const channelParticipants = (name: string) =>
    participants.filter((p) => p.channel_name === name);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1 mb-1">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Röstkanaler
        </span>
      </div>

      {CHANNELS.map((ch) => {
        const members = channelParticipants(ch.name);
        const isActive = activeChannel === ch.name;

        return (
          <div key={ch.name} className="rounded-lg border border-border bg-card overflow-hidden">
            <button
              onClick={() => {
                if (isActive) return;
                joinChannel(ch.name);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <span>{ch.icon}</span>
              <span className="flex-1 text-left">{ch.name}</span>
              {members.length > 0 && (
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                  {members.length}
                </span>
              )}
            </button>

            {members.length > 0 && (
              <div className="px-3 pb-2 space-y-1">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 text-xs text-muted-foreground pl-5"
                  >
                    {m.is_muted ? (
                      <MicOff className="h-3 w-3 text-destructive" />
                    ) : (
                      <Mic className="h-3 w-3 text-green-500" />
                    )}
                    <span className={m.user_id === user?.id ? "text-foreground font-medium" : ""}>
                      {m.display_name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {activeChannel && (
        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 text-xs text-green-500 font-medium flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Ansluten till {activeChannel}
          </div>
          <Button
            size="icon"
            variant={isMuted ? "destructive" : "secondary"}
            className="h-7 w-7"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-7 w-7"
            onClick={leaveChannel}
          >
            <PhoneOff className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Hidden LiveKit room for audio */}
      {activeChannel && token && livekitUrl && (
        <VoiceRoom
          token={token}
          serverUrl={livekitUrl}
          isMuted={isMuted}
          onDisconnected={leaveChannel}
        />
      )}
    </div>
  );
}
