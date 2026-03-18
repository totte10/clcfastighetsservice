import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { GoogleMapView } from "@/components/GoogleMapView"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/StatusBadge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Map, Clock, CheckSquare, Bot, Hash, Plus, Send, Loader2,
  Sparkles, Trash2, CheckCircle2, Circle, Calendar,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { streamChat } from "@/services/aiAssistant"
import ReactMarkdown from "react-markdown"
import { format } from "date-fns"
import { sv } from "date-fns/locale"

type Status = "pending" | "in-progress" | "done"
type TabId = "overview" | "map" | "tasks" | "time" | "ai"

interface Project {
  id: string
  project_number: string
  name: string
  address: string
  description: string
  status: Status
  lat: number | null
  lng: number | null
}

interface Task {
  id: string
  project_id: string
  title: string
  description: string
  status: "todo" | "done"
  created_at: string
}

interface TimeEntry {
  id: string
  date: string
  start_time: string
  end_time: string | null
  hours: number | null
  notes: string
  project: string
}

type AiMsg = { role: "user" | "assistant"; content: string }

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "overview", label: "Översikt", icon: Hash },
  { id: "map", label: "Karta", icon: Map },
  { id: "tasks", label: "Uppgifter", icon: CheckSquare },
  { id: "time", label: "Tid", icon: Clock },
  { id: "ai", label: "AI", icon: Bot },
]

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [loading, setLoading] = useState(true)

  const [newTask, setNewTask] = useState("")
  const [addingTask, setAddingTask] = useState(false)

  const [aiMessages, setAiMessages] = useState<AiMsg[]>([])
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  const loadProject = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data } = await supabase.from("projects").select("*").eq("id", id).single()
    if (data) {
      setProject({
        id: data.id,
        project_number: data.project_number,
        name: data.name,
        address: data.address,
        description: data.description,
        status: data.status as Status,
        lat: data.lat,
        lng: data.lng,
      })
    }
    setLoading(false)
  }, [id])

  const loadTasks = useCallback(async () => {
    if (!id) return
    const { data } = await supabase
      .from("project_tasks")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: true })
    setTasks((data as Task[]) ?? [])
  }, [id])

  const loadTimeEntries = useCallback(async () => {
    if (!project) return
    const { data } = await supabase
      .from("time_entries")
      .select("*")
      .ilike("project", `%${project.name}%`)
      .order("date", { ascending: false })
      .limit(20)
    setTimeEntries((data as TimeEntry[]) ?? [])
  }, [project])

  useEffect(() => { loadProject() }, [loadProject])
  useEffect(() => { loadTasks() }, [loadTasks])
  useEffect(() => { if (project) loadTimeEntries() }, [project, loadTimeEntries])

  const handleStatusChange = async (status: Status) => {
    if (!project) return
    await supabase.from("projects").update({ status }).eq("id", project.id)
    setProject((p) => p ? { ...p, status } : p)
    toast({ title: "Status uppdaterad" })
  }

  const handleAddTask = async () => {
    if (!newTask.trim() || !id) return
    setAddingTask(true)
    const { data, error } = await supabase
      .from("project_tasks")
      .insert({ project_id: id, title: newTask.trim(), status: "todo" })
      .select()
      .single()
    if (!error && data) {
      setTasks((prev) => [...prev, data as Task])
      setNewTask("")
    }
    setAddingTask(false)
  }

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done"
    await supabase.from("project_tasks").update({ status: newStatus }).eq("id", task.id)
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t))
  }

  const handleDeleteTask = async (taskId: string) => {
    await supabase.from("project_tasks").delete().eq("id", taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  const sendAiMessage = async (text?: string) => {
    const msg = (text ?? aiInput).trim()
    if (!msg || aiLoading || !project) return

    const context = `Du är en AI-arbetsassistent för CLC Fastighetsservice. Aktuellt projekt: "${project.name}" (${project.project_number}) på ${project.address}. Status: ${project.status}. Uppgifter: ${tasks.length} st, varav ${tasks.filter(t => t.status === "done").length} klara. Hjälp användaren med detta projekt.`

    const userMsg: AiMsg = { role: "user", content: msg }
    const newMessages = [...aiMessages, userMsg]
    setAiMessages(newMessages)
    setAiInput("")
    setAiLoading(true)

    let assistantSoFar = ""
    const messagesWithContext = [
      { role: "user" as const, content: context },
      { role: "assistant" as const, content: "Förstått! Jag är redo att hjälpa dig med projektet." },
      ...newMessages,
    ]

    await streamChat({
      messages: messagesWithContext,
      onDelta: (chunk) => {
        assistantSoFar += chunk
        setAiMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m)
          }
          return [...prev, { role: "assistant", content: assistantSoFar }]
        })
      },
      onDone: () => setAiLoading(false),
      onError: (err) => {
        setAiMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${err}` }])
        setAiLoading(false)
      },
    })
  }

  const totalHours = timeEntries.reduce((sum, e) => sum + (e.hours || 0), 0)
  const doneTasks = tasks.filter((t) => t.status === "done").length
  const mapMarkers = project?.lat && project?.lng
    ? [{ lat: project.lat, lng: project.lng, label: project.name, color: "orange" as const, id: project.id }]
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Projekt hittades inte</p>
        <Button onClick={() => navigate("/projects")} className="mt-4">Tillbaka</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in-up">

      {/* Project header */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "linear-gradient(135deg,rgba(244,162,97,0.12),rgba(231,111,81,0.08))", border: "1px solid rgba(244,162,97,0.2)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] tracking-wider uppercase text-primary font-semibold flex items-center gap-1">
                <Hash size={10} />{project.project_number}
              </span>
              <StatusBadge status={project.status} />
            </div>
            <h2 className="text-lg font-bold text-foreground leading-tight">{project.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{project.address}</p>
          </div>
          <Select value={project.status} onValueChange={(v) => handleStatusChange(v as Status)}>
            <SelectTrigger className="h-8 w-32 text-xs shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Ej påbörjad</SelectItem>
              <SelectItem value="in-progress">Pågår</SelectItem>
              <SelectItem value="done">Klart</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center">
            <p className="text-xl font-bold text-primary">{doneTasks}/{tasks.length}</p>
            <p className="text-[10px] text-muted-foreground">Uppgifter</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{totalHours.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Timmar</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0}%</p>
            <p className="text-[10px] text-muted-foreground">Klart</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-semibold transition-all duration-200"
              style={active ? {
                background: "linear-gradient(135deg,rgba(244,162,97,0.22),rgba(231,111,81,0.22))",
                color: "hsl(var(--primary))",
              } : { color: "hsl(var(--muted-foreground))" }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-3 animate-fade-in-up">
          {project.description && (
            <Card className="glass-card">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Beskrivning</p>
                <p className="text-sm text-foreground leading-relaxed">{project.description}</p>
              </CardContent>
            </Card>
          )}

          <Card className="glass-card">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3">Snabb AI-hjälp</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Sammanfatta projektet",
                  "Förslag på nästa steg",
                  "Optimera uppgiftsordning",
                  "Tidsuppskattning",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setActiveTab("ai"); setTimeout(() => sendAiMessage(s), 100) }}
                    className="text-left p-3 rounded-xl text-xs transition-all active:scale-95"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <Sparkles size={10} className="text-primary mb-1" />
                    <span className="text-foreground font-medium">{s}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {mapMarkers.length > 0 && (
            <Card className="glass-card overflow-hidden">
              <GoogleMapView markers={mapMarkers} height="200px" zoom={14} />
            </Card>
          )}
        </div>
      )}

      {/* MAP */}
      {activeTab === "map" && (
        <div className="animate-fade-in-up">
          <Card className="glass-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Map size={14} className="text-primary" /> Projektplats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <GoogleMapView markers={mapMarkers} height="360px" zoom={15} />
            </CardContent>
          </Card>
          {!project.lat && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Ingen GPS-position sparad för detta projekt.
            </p>
          )}
        </div>
      )}

      {/* TASKS */}
      {activeTab === "tasks" && (
        <div className="space-y-3 animate-fade-in-up">
          {/* Add task */}
          <div
            className="flex gap-2 p-1.5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              placeholder="Lägg till uppgift..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              onClick={handleAddTask}
              disabled={addingTask || !newTask.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#F4A261,#E76F51)" }}
            >
              {addingTask ? <Loader2 size={14} className="text-white animate-spin" /> : <Plus size={14} className="text-white" />}
            </button>
          </div>

          {tasks.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Inga uppgifter ännu. Lägg till ovan.
            </p>
          )}

          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-2xl transition-all"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <button onClick={() => handleToggleTask(task)} className="flex-shrink-0 transition-transform active:scale-90">
                {task.status === "done"
                  ? <CheckCircle2 size={20} className="text-primary" />
                  : <Circle size={20} className="text-muted-foreground" />
                }
              </button>
              <p className={`flex-1 text-sm ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {task.title}
              </p>
              <button onClick={() => handleDeleteTask(task.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TIME */}
      {activeTab === "time" && (
        <div className="space-y-3 animate-fade-in-up">
          <Card className="glass-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Tidslogg</p>
                <Badge variant="outline" className="text-primary border-primary/30">
                  {totalHours.toFixed(1)} h totalt
                </Badge>
              </div>

              {timeEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Inga tidsposter kopplade till detta projekt ännu.
                </p>
              ) : (
                <div className="space-y-2">
                  {timeEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(244,162,97,0.12)" }}
                      >
                        <Clock size={14} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">
                          {entry.date ? format(new Date(entry.date), "d MMM yyyy", { locale: sv }) : "–"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {entry.start_time} – {entry.end_time || "pågår"}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {entry.hours ? `${entry.hours}h` : "–"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                size="sm"
                className="w-full mt-4 gap-2"
                onClick={() => navigate("/time")}
                style={{ background: "linear-gradient(135deg,#F4A261,#E76F51)" }}
              >
                <Plus size={14} /> Lägg till tidspost
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI */}
      {activeTab === "ai" && (
        <div className="flex flex-col" style={{ height: "calc(100dvh - 340px)" }}>
          {/* Context chip */}
          <div
            className="flex items-center gap-2 p-2 rounded-xl mb-3"
            style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}
          >
            <Bot size={13} className="text-purple-400" />
            <p className="text-[11px] text-purple-300 font-medium">
              AI känner till: {project.name} · {tasks.length} uppgifter · {totalHours.toFixed(1)}h loggat
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
            {aiMessages.length === 0 && (
              <div className="grid grid-cols-2 gap-2">
                {["Sammanfatta projektet", "Vad bör göras härnäst?", "Uppskatta återstående tid", "Optimera uppgifter"].map((s) => (
                  <button
                    key={s}
                    onClick={() => sendAiMessage(s)}
                    className="text-left p-3 rounded-2xl text-xs transition-all active:scale-95"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <Sparkles size={10} className="text-primary mb-1" />
                    <span className="text-foreground font-medium block">{s}</span>
                  </button>
                ))}
              </div>
            )}

            {aiMessages.map((m, i) => (
              <div key={i} className={`flex animate-fade-in-up ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center mr-2 flex-shrink-0 mt-0.5"
                    style={{ background: "linear-gradient(135deg,#A855F7,#7C3AED)" }}
                  >
                    <Bot size={13} className="text-white" />
                  </div>
                )}
                <div
                  className="px-4 py-3 rounded-2xl text-sm max-w-[78%] leading-relaxed"
                  style={m.role === "user" ? {
                    background: "linear-gradient(135deg,#F4A261,#E76F51)",
                    color: "white",
                    borderBottomRightRadius: 6,
                  } : {
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderBottomLeftRadius: 6,
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

            {aiLoading && aiMessages[aiMessages.length - 1]?.role !== "assistant" && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#A855F7,#7C3AED)" }}>
                  <Bot size={13} className="text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI input */}
          <div
            className="mt-3 flex gap-2 p-1.5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
          >
            <input
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendAiMessage()}
              placeholder="Fråga AI om projektet..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              onClick={() => sendAiMessage()}
              disabled={aiLoading || !aiInput.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#F4A261,#E76F51)", boxShadow: "0 4px 16px rgba(244,162,97,0.4)" }}
            >
              {aiLoading ? <Loader2 size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
