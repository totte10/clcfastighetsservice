import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { VoiceChannels } from "@/components/voice/VoiceChannels";

interface ChatMessage {
  id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

const SENDER_KEY = "clc_chat_name";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [senderName, setSenderName] = useState(() => localStorage.getItem(SENDER_KEY) || "");
  const [nameSet, setNameSet] = useState(() => !!localStorage.getItem(SENDER_KEY));
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel("chat_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages() {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) {
      toast.error("Kunde inte hämta meddelanden");
      return;
    }
    setMessages(data || []);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase.from("chat_messages").insert({
      sender_name: senderName,
      content: newMessage.trim(),
    });

    if (error) {
      toast.error("Kunde inte skicka meddelande");
      return;
    }
    setNewMessage("");
  }

  function handleSetName(e: React.FormEvent) {
    e.preventDefault();
    if (!senderName.trim()) return;
    localStorage.setItem(SENDER_KEY, senderName.trim());
    setSenderName(senderName.trim());
    setNameSet(true);
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
  }

  // Group messages by date
  const grouped: { date: string; msgs: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const date = new Date(msg.created_at).toDateString();
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      grouped.push({ date, msgs: [msg] });
    }
  });

  if (!nameSet) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <form onSubmit={handleSetName} className="glass-card rounded-2xl p-8 max-w-sm w-full flex flex-col gap-4 items-center">
          <MessageCircle className="h-10 w-10 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Välj ditt namn</h2>
          <p className="text-sm text-muted-foreground text-center">Skriv ditt namn så att andra ser vem som skriver.</p>
          <Input
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Ditt namn..."
            className="text-center"
            autoFocus
          />
          <Button type="submit" disabled={!senderName.trim()} className="w-full">
            Starta chatten
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Teamchatt</h1>
        </div>
        <span className="text-xs text-muted-foreground">
          Inloggad som <strong className="text-foreground">{senderName}</strong>
        </span>
      </div>

      {/* Voice channels section */}
      <div className="p-3 border-b border-border">
        <VoiceChannels />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {grouped.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Inga meddelanden ännu. Skriv det första!
          </div>
        )}
        {grouped.map((group) => (
          <div key={group.date}>
            <div className="flex justify-center my-3">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {formatDate(group.msgs[0].created_at)}
              </span>
            </div>
            <div className="space-y-1.5">
              {group.msgs.map((msg, i) => {
                const isMe = msg.sender_name === senderName;
                const showName = i === 0 || group.msgs[i - 1].sender_name !== msg.sender_name;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      {showName && !isMe && (
                        <span className="text-[10px] text-primary font-medium ml-3 mb-0.5">{msg.sender_name}</span>
                      )}
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary text-secondary-foreground rounded-bl-md"
                        }`}
                      >
                        {msg.content}
                        <span className={`text-[9px] ml-2 opacity-60 inline-block align-bottom`}>
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Skriv ett meddelande..."
          autoFocus
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!newMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
