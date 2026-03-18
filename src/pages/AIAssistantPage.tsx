import { useState, useRef, useEffect } from "react"
import { streamChat } from "@/services/aiAssistant"
import ReactMarkdown from "react-markdown"
import { Bot, Send, Loader2, Sparkles } from "lucide-react"

type Msg = { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Planera dagens rutt",
  "Hur är vädret?",
  "Prioritera jobb idag",
  "Sammanfatta arbetsdagen",
]

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    const userMsg: Msg = { role: "user", content: msg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    let assistantSoFar = ""

    await streamChat({
      messages: newMessages,
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
      <div className="flex items-center gap-3 mb-4 animate-fade-in-up">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,rgba(180,100,255,0.25),rgba(140,60,220,0.25))", border: "1px solid rgba(180,100,255,0.2)" }}
        >
          <Bot size={18} className="text-purple-400" />
        </div>
        <div>
          <h1 className="font-bold text-foreground">CLC AI Assistent</h1>
          <p className="text-xs text-muted-foreground">Powered by Gemini Flash</p>
        </div>
        <div className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 border border-success/20">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] text-success font-medium">Online</span>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">

        {messages.length === 0 && (
          <div className="animate-fade-in-up">
            {/* Welcome card */}
            <div className="glass-card p-5 mb-4 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "linear-gradient(135deg,#A855F7,#7C3AED)" }}
              >
                <Sparkles size={24} className="text-white" />
              </div>
              <p className="font-semibold text-foreground mb-1">Vad kan jag hjälpa dig med?</p>
              <p className="text-xs text-muted-foreground">Fråga om rutter, väder, planering eller jobbprioritering</p>
            </div>

            {/* Suggestions */}
            <div className="grid grid-cols-2 gap-2 stagger-children">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left p-3 rounded-2xl text-xs text-muted-foreground transition-all duration-150 active:scale-95"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <span className="block text-foreground font-medium mb-0.5 text-xs">{s}</span>
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
                m.role === "user"
                  ? "text-white rounded-br-md"
                  : "text-foreground rounded-bl-md"
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
              ) : (
                m.content
              )}
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
          placeholder="Fråga AI om rutt, väder..."
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
