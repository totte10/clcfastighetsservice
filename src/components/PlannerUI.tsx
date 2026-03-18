import { useState } from "react"
import { format, addDays } from "date-fns"
import { sv } from "date-fns/locale"

interface Job {
  id: string
  name: string
  address: string
  date?: string
  status: string
}

export default function PlannerUI({ jobs }: { jobs: Job[] }) {

  const [selectedDate, setSelectedDate] = useState(new Date())

  const days = Array.from({ length: 7 }).map((_, i) =>
    addDays(new Date(), i - 3)
  )

  const filteredJobs = jobs.filter(j =>
    j.date === format(selectedDate, "yyyy-MM-dd")
  )

  return (
    <div className="p-4 space-y-6 text-white">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold leading-tight">
          Planera<br />dina uppdrag
        </h1>
      </div>

      {/* DATE SCROLLER */}
      <div className="flex gap-3 overflow-x-auto pb-2">

        {days.map((d, i) => {

          const active =
            format(d, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(d)}
              className={`flex flex-col items-center px-4 py-2 rounded-xl min-w-[60px]
              ${active
                  ? "bg-orange-500 text-white"
                  : "bg-white/5 text-gray-400"
                }`}
            >
              <span className="text-xs">
                {format(d, "EEE", { locale: sv })}
              </span>
              <span className="text-lg font-semibold">
                {format(d, "d")}
              </span>
            </button>
          )
        })}

      </div>

      {/* JOB CARDS */}
      <div className="space-y-4">

        {filteredJobs.length === 0 && (
          <p className="text-sm text-gray-400">
            Inga jobb idag
          </p>
        )}

        {filteredJobs.map((job, i) => {

          const done = job.status === "done"

          return (
            <div
              key={job.id}
              className="rounded-3xl p-5 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(249,115,22,0.25), rgba(15,15,20,0.9))",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)"
              }}
            >

              {/* PRIORITY BADGE */}
              <div className="absolute top-4 left-4 text-[10px] px-2 py-1 rounded-full bg-white/10">
                {done ? "Klar" : "Aktiv"}
              </div>

              {/* TITLE */}
              <h2 className="text-lg font-semibold mt-6">
                {job.name}
              </h2>

              {/* ADDRESS */}
              <p className="text-xs text-gray-300 mt-1">
                {job.address}
              </p>

              {/* FOOTER */}
              <div className="flex justify-between items-center mt-4">

                <span className="text-[11px] text-gray-400">
                  {format(selectedDate