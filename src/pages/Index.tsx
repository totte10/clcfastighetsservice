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
  const { isAdmin, user } = useAuth()

  // 🔥 JOBS
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
    <div className="space-y-6 p-4 animate-fade-in-up">

      {/* 🔥 HEADER (DU SAKNADE DENNA) */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">God morgon 👋</p>
          <h1 className="text-xl font-bold">
            {user?.email?.split("@")[0] || "Användare"}
          </h1>
        </div>
      </div>

      {/* 🔥 JOBS */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Dina uppdrag
        </p>

        <div className="flex flex-col gap-2">
          {jobs?.slice(0, 3).map((job: any) => (
            <div
              key={job.id}
              className="rounded-2xl px-4 py-3 flex justify-between items-center"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
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

      {/* 🔥 SNABBSTART */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Snabbstart
        </p>

        <div className="grid grid-cols-2 gap-3">

          {/* 🔥 STORA ORANGE */}
          <button
            onClick={() => navigate("/route")}
            className="col-span-2 p-5 text-left rounded-[22px] shadow-lg"
            style={{
              background: "linear-gradient(135deg,#F4A261 0%,#E76F51 100%)",
              boxShadow: "0 12px 40px rgba(244,162,97,0.4)",
            }}
          >
            <div className="flex justify-between">
              <div>
                <p className="text-white font-bold text-lg">Ruttplanering</p>
                <p className="text-white/70 text-xs">Optimera & navigera</p>
              </div>
              <ChevronRight className="text-white/60" />
            </div>
          </button>

          <Card icon={CalendarDays} label="Planering" sub="Schemalägg" to="/planning" navigate={navigate} color="#8B8BFF"/>
          <Card icon={Map} label="Karta" sub="Områden" to="/areas" navigate={navigate} color="#4ADE80"/>
          <Card icon={Bot} label="AI Assistent" sub="Fråga AI" to="/ai" navigate={navigate} color="#C084FC"/>
          <Card icon={Folder} label="Projekt" sub="Alla projekt" to="/projects" navigate={navigate} color="#F4A261"/>

        </div>
      </section>

      {/* 🔥 MER */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Mer
        </p>

        <div className="flex flex-col gap-2">
          <Row icon={Clock} label="Tidrapport" to="/time" navigate={navigate} />
          <Row icon={HomeIcon} label="Egna Områden" to="/egna" navigate={navigate} />
          <Row icon={Truck} label="Tidx Sopning" to="/tidx" navigate={navigate} />
          <Row icon={Zap} label="Optimal" to="/optimal" navigate={navigate} />
          <Row icon={Volume2} label="Röst" to="/voice" navigate={navigate} />

          {isAdmin && (
            <Row icon={Route} label="Admin" to="/admin" navigate={navigate} />
          )}
        </div>
      </section>

    </div>
  )
}

function Card({ icon: Icon, label, sub, to, navigate, color }: any) {
  return (
    <button
      onClick={() => navigate(to)}
      className="rounded-2xl p-4 text-left"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
        style={{ background: `${color}20` }}
      >
        <Icon size={18} style={{ color }} />
      </div>

      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </button>
  )
}

function Row({ icon: Icon, label, to, navigate }: any) {
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Icon size={16} />
      <span className="flex-1 text-sm">{label}</span>
      <ChevronRight size={14} />
    </button>
  )
}