import { useState, useEffect, useMemo, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Navigate } from "react-router-dom"
import { format, addDays, subDays, isToday, isSameDay } from "date-fns"
import { sv } from "date-fns/locale"
import {
  Plus,
  MapPin,
  Hash,
  Pencil,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarDays
} from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

type SourceType = "tidx" | "egna" | "tmm" | "optimal" | "project"

interface UnifiedJob {
  id: string
  source: SourceType
  name: string
  address: string
  datum: string
  project_number: string
  status: string
}

export default function PlanningPage() {
  const { user, isAdmin } = useAuth()
  const { toast } = useToast()

  const [jobs, setJobs] = useState<UnifiedJob[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [editJob, setEditJob] = useState<UnifiedJob | null>(null)

  const [form, setForm] = useState({
    name: "",
    address: "",
    project_number: "",
    datum_planerat: "",
    status: "pending"
  })

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")

    const mapped =
      (data ?? []).map((p: any) => ({
        id: p.id,
        source: "project",
        name: p.name,
        address: p.address,
        datum: (p.datum_planerat || "").slice(0, 10),
        project_number: p.project_number || "",
        status: p.status
      }))

    setJobs(mapped)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const dateStr = format(selectedDate, "yyyy-MM-dd")

  const filteredJobs = useMemo(
    () => jobs.filter((j) => j.datum === dateStr),
    [jobs, dateStr]
  )

  const dateStrip = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i - 3)),
    [selectedDate]
  )

  function openEdit(job: UnifiedJob) {
    setEditJob(job)
    setForm({
      name: job.name,
      address: job.address,
      project_number: job.project_number,
      datum_planerat: job.datum,
      status: job.status
    })
  }

  async function saveEdit() {
    if (!editJob) return

    await supabase
      .from("projects")
      .update({
        name: form.name,
        address: form.address,
        project_number: form.project_number,
        datum_planerat: form.datum_planerat,
        status: form.status
      })
      .eq("id", editJob.id)

    toast({ title: "Sparat" })
    setEditJob(null)
    load()
  }

  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white px-4 py-6">

      {/* HEADER */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Planering</h1>
        <p className="text-sm text-white/40">
          {format(new Date(), "EEEE d MMMM", { locale: sv })}
        </p>
      </div>

      {/* DATE STRIP */}
      <div className="flex items-center gap-2 mb-4">

        <ChevronLeft onClick={() => setSelectedDate(d => subDays(d, 1))} className="cursor-pointer" />

        <div className="flex gap-2 overflow-x-auto">
          {dateStrip.map(day => {
            const active = isSameDay(day, selectedDate)
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`px-3 py-2 rounded-xl text-sm ${
                  active
                    ? "bg-orange-500 text-white"
                    : "bg-white/5 text-white/50"
                }`}
              >
                {format(day, "d")}
              </button>
            )
          })}
        </div>

        <ChevronRight onClick={() => setSelectedDate(d => addDays(d, 1))} className="cursor-pointer" />

      </div>

      {/* JOBS */}
      <div className="space-y-3">

        {filteredJobs.map(job => (

          <div
            key={job.id}
            className="bg-[#111827] p-4 rounded-2xl border border-white/5"
          >

            <div className="flex justify-between items-center">

              <div>
                <h3 className="font-semibold">{job.name}</h3>
                <p className="text-xs text-white/40 flex items-center gap-1">
                  <MapPin size={12} /> {job.address}
                </p>
              </div>

              <button
                onClick={() => openEdit(job)}
                className="text-xs bg-white/10 px-3 py-1 rounded-xl"
              >
                Ändra
              </button>

            </div>

          </div>

        ))}

        {filteredJobs.length === 0 && (
          <p className="text-white/30 text-center mt-10">
            Inga jobb idag
          </p>
        )}

      </div>

      {/* FLOAT BUTTON */}
      <button className="fixed bottom-20 right-6 bg-orange-500 w-14 h-14 rounded-full flex items-center justify-center shadow-lg">
        <Plus />
      </button>

      {/* EDIT MODAL */}
      <Dialog open={!!editJob} onOpenChange={() => setEditJob(null)}>
        <DialogContent className="bg-[#111827] text-white">

          <DialogHeader>
            <DialogTitle>Redigera</DialogTitle>
          </DialogHeader>

          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Namn"
          />

          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Adress"
          />

          <Button onClick={saveEdit} className="bg-orange-500">
            <Check className="mr-2" /> Spara
          </Button>

        </DialogContent>
      </Dialog>

    </div>
  )
}