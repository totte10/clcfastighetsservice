import { useState, useEffect, useMemo, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { format, addDays, subDays, isSameDay } from "date-fns"
import { sv } from "date-fns/locale"
import { Plus, MapPin, ChevronLeft, ChevronRight } from "lucide-react"

export default function PlanningPage() {

  const { user, isAdmin, loading } = useAuth()

  const [jobs, setJobs] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())

  const load = useCallback(async () => {

    const { data, error } = await supabase
      .from("projects")
      .select("*")

    if (error) {
      console.error("SUPABASE ERROR:", error)
      setJobs([])
      return
    }

    setJobs(data || [])

  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return null
  if (!user) return null

  if (!isAdmin) {
    return <div className="text-white p-6">Ingen behörighet</div>
  }

  const dateStr = format(selectedDate, "yyyy-MM-dd")

  const filtered = useMemo(() =>
    jobs.filter(j => j.datum_planerat?.slice(0,10) === dateStr),
    [jobs, dateStr]
  )

  const days = Array.from({ length: 7 }, (_, i) =>
    addDays(selectedDate, i - 3)
  )

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white p-4">

      <h1 className="text-2xl font-bold mb-4">Planering</h1>

      {/* DATE STRIP */}
      <div className="flex items-center gap-2 mb-4">

        <ChevronLeft onClick={() => setSelectedDate(d => subDays(d,1))} />

        {days.map(day => {
          const active = isSameDay(day, selectedDate)
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`px-3 py-2 rounded-xl ${
                active ? "bg-orange-500" : "bg-white/5"
              }`}
            >
              {format(day, "d")}
            </button>
          )
        })}

        <ChevronRight onClick={() => setSelectedDate(d => addDays(d,1))} />

      </div>

      {/* JOBS */}
      <div className="space-y-3">

        {filtered.map(job => (

          <div
            key={job.id}
            className="bg-[#111827] p-4 rounded-2xl border border-white/5"
          >
            <h3 className="font-semibold">{job.name}</h3>
            <p className="text-xs text-white/40 flex items-center gap-1">
              <MapPin size={12}/> {job.address}
            </p>
          </div>

        ))}

        {filtered.length === 0 && (
          <p className="text-white/30 text-center mt-10">
            Inga jobb idag
          </p>
        )}

      </div>

      {/* FLOAT BUTTON */}
      <button className="fixed bottom-20 right-6 bg-orange-500 w-14 h-14 rounded-full flex items-center justify-center">
        <Plus />
      </button>

    </div>
  )
}