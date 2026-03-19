import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

import {
  Route,
  CalendarDays,
  Map,
  Bot,
  Folder,
  Clock,
  Home as HomeIcon,
  Truck,
  Zap,
  ChevronRight,
  Volume2,
} from "lucide-react"

export default function Index() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  // 🔥 HÄMTA JOBS
  const { data: jobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("date", { ascending: true })

      if (error) throw error
      return data
    },
  })

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* 🔥 JOBS (NY SEKTION) */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-0.5">
          Dina uppdrag
        </p>

        <div className="flex flex-col gap-2">
          {jobs?.slice(0, 3).map((job: any) => (
            <div
              key={job.id}
              className="w-full px-4 py-3 rounded-2xl flex items-center justify-between"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div>
                <p className="text-sm font-semibold">{job.title}</p>
                <p className="text-xs text-muted-foreground">{job.date}</p>
              </div>

              <span
                className={`text-xs font-semibold ${
                  job.status === "completed"
                    ? "text-green-400"
                    : job.status === "in_progress"
                    ? "text-blue-400"
                    : "text-yellow-400"
                }`}
              >
                {job.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* MAIN CARDS */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-0.5">
          Snabbstart
        </p>

        <div className="grid grid-cols-2 gap-3">

          {/* BIG CARD */}
          <button
            onClick={() => navigate("/route")}
            className="col-span-2 p-5 text-left"
            style={{
              background: "linear-gradient(135deg,#F4A261 0%,#E76F51 100%)",
              borderRadius: "22px",
            }}
          >
            <p className="text-white font-bold text-lg">Ruttplanering</p>
            <p className="text-white/70 text-xs">Optimera & navigera</p>
          </button>

          <SmallCard icon={CalendarDays} label="Planering" to="/planning" navigate={navigate} />
          <SmallCard icon={Map} label="Karta" to="/areas" navigate={navigate} />
          <SmallCard icon={Bot} label="AI" to="/ai" navigate={navigate} />
          <SmallCard icon={Folder} label="Projekt" to="/projects" navigate={navigate} />

        </div>
      </section>

      {/* QUICK */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-0.5">
          Mer
        </p>

        <div className="flex flex-col gap-2">
          <QuickRow icon={Clock} label="Tidrapport" to="/time" navigate={navigate} />
          <QuickRow icon={HomeIcon} label="Egna Områden" to="/egna" navigate={navigate} />
          <QuickRow icon={Truck} label="Tidx Sopning" to="/tidx" navigate={navigate} />
          <QuickRow icon={Zap} label="Optimal" to="/optimal" navigate={navigate} />
          <QuickRow icon={Volume2} label="Röst" to="/voice" navigate={navigate} />

          {isAdmin && (
            <QuickRow icon={Route} label="Admin Panel" to="/admin" navigate={navigate} />
          )}
        </div>
      </section>

    </div>
  )
}

function SmallCard({ icon: Icon, label, to, navigate }: any) {
  return (
    <button
      onClick={() => navigate(to)}
      className="p-4 text-left rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Icon size={18} />
      <p className="text-sm font-semibold mt-2">{label}</p>
    </button>
  )
}

function QuickRow({ icon: Icon, label, to, navigate }: any) {
  return (
    <button
      onClick={() => navigate(to)}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Icon size={16} />
      <span className="text-sm">{label}</span>
    </button>
  )
}