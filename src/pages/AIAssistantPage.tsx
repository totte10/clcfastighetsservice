import { useState, useRef, useEffect, useCallback } from "react"
import { streamChat } from "@/services/aiAssistant"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import ReactMarkdown from "react-markdown"
import { Bot, Send, Loader2, Sparkles, ChevronDown, Folder } from "lucide-react"

type Msg = { role: "user" | "assistant"; content: string }

interface Project {
  id: string
  name: string
  status: string
  project_number: string
}

const SUGGESTIONS = [
  "Planera dagens rutt",
  "Sammanfatta mina projekt",
  "Prioritera jobben idag",
  "Optimera arbetstid",
  "Vad bör jag göra härnäst?",
  "Tips för effektivare arbete",
]

export default function AIAssistantPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadProjects = useCallback(async () => {
    const { data } = await supabase
      .from("projects")
      .select("id,name,status,project_number")
      .order("created_at", { ascending: false })
      .limit(20)
    setProjects((data as Project[]) ?? [])
  }, [])

  useEffect(() => { loadProjects() }, [loadProjects])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    const userMsg: Msg = { role: "user", content: msg }

    let systemContext = "Du är en AI-arbetsassistent för CLC Fastighetsservice. Du hjälper fältarbetare med planering, ruttoptimering, tidsrapportering och projekthantering. Svara alltid på svenska och var kortfattad och hjälpsam."

    if (selectedProject) {
      systemContext += ` Aktuellt projekt: "${selectedProject.name}" (${selectedProject.project_number}), status: ${selectedProject.status}.`
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    let assistantSoFar = ""

    const messagesWithContext = [
      { role: "user" as const, content: systemContext },
      { role: "assistant" as const, content: "Förstått! Jag är redo att hjälpa dig." },
      ...newMessages,
    ]

    await streamChat({
      messages: messagesWithContext,
      onDelta: (chunk) => {
        assistantSoFar += chunk
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m)
          }
          return [...prev, { role: "assistant", content: assistantSoFar }]
        })
      },
      onDone: () => setLoading(false),
      onError: (err) => {
        setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${err}` }])
        setLoading(false)
      },
    })
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-160px)]">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-3 animate-fade-in-up">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-purple-500/15 border border-purple-500/20">
          <Bot size={18} className="text-purple-400" />
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-foreground text-sm">CLC AI Arbetsassistent</h1>
          <p className="text-[10px] text-muted-foreground">Powered by Gemini Flash</p>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-medium">Online</span>
        </div>
      </div>

      {/* PROJECT CONTEXT PICKER */}
      <div className="mb-3">
        <button
          onClick={() => setShowProjectPicker(!showProjectPicker)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all"
          style={{
            background: selectedProject
              ? "rgba(244,162,97,0.1)"
              : "rgba(255,255,255,0.04)",
            border: selectedProject
              ? "1px solid rgba(244,162,97,0.25)"
              : "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <Folder size={13} className={selectedProject ? "text-primary" : "text-muted-foreground"} />
          <span className={selectedProject ? "text-primary font-medium flex-1 text-left" : "text-muted-foreground flex-1 text-left"}>
            {selectedProject ? `${selectedProject.project_number} – ${selectedProject.name}` : "Välj projekt för kontext (valfritt)"}
          </span>
          <ChevronDown size={13} className="text-muted-foreground" />
        </button>

        {showProjectPicker && (
          <div
            className="mt-1 rounded-xl overflow-hidden"
            style={{ background: "rgba(20,20,32,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <button
              onClick={() => { setSelectedProject(null); setShowProjectPicker(false) }}
              className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-white/5 transition-colors"
            >
              Inget projekt
            </button>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedProject(p); setShowProjectPicker(false) }}
                className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-white/5 transition-colors border-t border-white/5"
              >
                <span className="text-primary text-[10px] font-semibold">{p.project_number}</span>
                <span className="ml-2">{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">

        {messages.length === 0 && (
          <div className="animate-fade-in-up">
            <div className="glass-card p-5 mb-3 text-center">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "linear-gradient(135deg,#A855F7,#7C3AED)" }}
              >
                <Sparkles size={22} className="text-white" />
              </div>
              <p className="font-semibold text-foreground mb-1 text-sm">Vad kan jag hjälpa dig med?</p>
              <p className="text-xs text-muted-foreground">Fråga om rutter, planering, projekt eller jobbprioritering</p>
            </div>

            <div className="grid grid-cols-2 gap-2 stagger-children">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left p-3 rounded-2xl text-xs text-muted-foreground transition-all duration-150 active:scale-95"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <Sparkles size={9} className="text-primary mb-1" />
                  <span className="block text-foreground font-medium text-xs">{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex animate-fade-in-up ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center mr-2 flex-shrink-0 mt-0.5"
                style={{ background: "linear-gradient(135deg,#A855F7,#7C3AED)" }}
              >
                <Bot size={13} className="text-white" />
              </div>
            )}
            <div
              className={`px-4 py-3 rounded-2xl text-sm max-w-[78%] leading-relaxed ${
                m.role === "user" ? "text-white rounded-br-md" : "text-foreground rounded-bl-md"
              }`}
              style={m.role === "user" ? {
                background: "linear-gradient(135deg,#F4A261,#E76F51)",
                boxShadow: "0 4px 16px rgba(244,162,97,0.3)",
              } : {
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0.5">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : m.content}
            </div>
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2 animate-fade-in-up">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#A855F7,#7C3AED)" }}
            >
              <Bot size={13} className="text-white" />
            </div>
            <div
              className="px-4 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div
        className="mt-3 flex gap-2 p-1.5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={selectedProject ? `Fråga om ${selectedProject.name}...` : "Fråga AI om arbete, rutt, projekt..."}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#F4A261,#E76F51)", boxShadow: "0 4px 16px rgba(244,162,97,0.4)" }}
        >
          {loading
            ? <Loader2 size={16} className="text-white animate-spin" />
            : <Send size={16} className="text-white" />
          }
        </button>
      </div>

    </div>
  )
}
