import { useState, useRef, useEffect } from "react"
import { streamChat } from "@/services/aiAssistant"
import ReactMarkdown from "react-markdown"

import { Bot, Send, Loader2 } from "lucide-react"

type Msg = { role: "user" | "assistant"; content: string }

export default function AIAssistantPage() {

  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return

    const userMsg: Msg = { role: "user", content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    let assistantSoFar = ""

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m))
        }
        return [...prev, { role: "assistant", content: assistantSoFar }]
      })
    }

    await streamChat({
      messages: newMessages,
      onDelta: upsertAssistant,
      onDone: () => setLoading(false),
      onError: (err) => {
        setMessages(prev => [...prev, { role: "assistant", content: err }])
        setLoading(false)
      },
    })
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)] max-w-2xl mx-auto">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bot size={18} className="text-primary" />
        </div>
        <div>
          <h1 className="font-semibold text-foreground">CLC AI Assistent</h1>
          <p className="text-xs text-muted-foreground">Fråga om rutt, väder, planering...</p>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">

        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground mt-8">
            <p className="mb-2 font-medium">Fråga AI om:</p>
            <ul className="space-y-1 list-disc pl-4">
              <li>Planera dagens rutt</li>
              <li>Väder och halkrisk</li>
              <li>Jobbprioritering</li>
              <li>Sammanfatta arbetsdagen</li>
            </ul>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl text-sm max-w-[85%] animate-fade-in-up ${
              m.role === "user"
                ? "bg-primary text-primary-foreground ml-auto"
                : "glass-card"
            }`}
          >
            {m.role === "assistant" ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ) : (
              m.content
            )}
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={14} />
            AI tänker...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Fråga AI..."
          className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-primary text-primary-foreground rounded-xl px-4 flex items-center justify-center disabled:opacity-50 transition"
        >
          <Send size={16} />
        </button>
      </div>

    </div>
  )
}
