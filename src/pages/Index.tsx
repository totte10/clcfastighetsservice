import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
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

interface DashCard {
  icon: any
  label: string
  sub: string
  to: string
  gradient: string
  glow: string
  large?: boolean
}

const MAIN_CARDS: DashCard[] = [
  {
    icon: Route,
    label: "Ruttplanering",
    sub: "Optimera din rutt",
    to: "/route",
    gradient: "linear-gradient(135deg,#F4A261 0%,#E76F51 100%)",
    glow: "rgba(244,162,97,0.4)",
    large: true,
  },
  {
    icon: CalendarDays,
    label: "Planering",
    sub: "Schemalägg jobb",
    to: "/planning",
    gradient: "linear-gradient(135deg,#1E1E2E 0%,#2A2A3E 100%)",
    glow: "rgba(100,100,200,0.2)",
  },
  {
    icon: Map,
    label: "Karta",
    sub: "Se alla områden",
    to: "/areas",
    gradient: "linear-gradient(135deg,#1E2E1E 0%,#2A3E2A 100%)",
    glow: "rgba(100,200,100,0.2)",
  },
  {
    icon: Bot,
    label: "AI Assistent",
    sub: "Fråga AI",
    to: "/ai",
    gradient: "linear-gradient(135deg,#1E1E2E 0%,#2E1E2E 100%)",
    glow: "rgba(180,100,200,0.2)",
  },
]

const QUICK_CARDS: DashCard[] = [
  {
    icon: Folder,
    label: "Projekt",
    sub: "",
    to: "/projects",
    gradient: "linear-gradient(135deg,rgba(244,162,97,0.08),rgba(231,111,81,0.08))",
    glow: "rgba(244,162,97,0.1)",
  },
  {
    icon: Clock,
    label: "Tidrapport",
    sub: "",
    to: "/time",
    gradient: "linear-gradient(135deg,rgba(100,180,255,0.08),rgba(60,140,220,0.08))",
    glow: "rgba(100,180,255,0.1)",
  },
  {
    icon: HomeIcon,
    label: "Egna Områden",
    sub: "",
    to: "/egna",
    gradient: "linear-gradient(135deg,rgba(100,220,150,0.08),rgba(60,180,110,0.08))",
    glow: "rgba(100,220,150,0.1)",
  },
  {
    icon: Truck,
    label: "Tidx Sopning",
    sub: "",
    to: "/tidx",
    gradient: "linear-gradient(135deg,rgba(255,180,80,0.08),rgba(220,140,40,0.08))",
    glow: "rgba(255,180,80,0.1)",
  },
  {
    icon: Zap,
    label: "Optimal",
    sub: "",
    to: "/optimal",
    gradient: "linear-gradient(135deg,rgba(180,100,255,0.08),rgba(140,60,220,0.08))",
    glow: "rgba(180,100,255,0.1)",
  },
  {
    icon: Volume2,
    label: "Röst",
    sub: "",
    to: "/voice",
    gradient: "linear-gradient(135deg,rgba(100,200,220,0.08),rgba(60,160,180,0.08))",
    glow: "rgba(100,200,220,0.1)",
  },
]

export default function Index() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* MAIN CARDS */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-0.5">Snabbstart</p>

        {/* Big route card + 3 small */}
        <div className="grid grid-cols-2 gap-3 stagger-children">

          {/* Large orange card */}
          <button
            onClick={() => navigate("/route")}
            className="col-span-2 dash-card p-5 text-left group"
            style={{ background: "linear-gradient(135deg,#F4A261 0%,#E76F51 100%)", boxShadow: "0 12px 40px rgba(244,162,97,0.4)", border: "none", borderRadius: "22px" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                  <Route size={22} className="text-white" />
                </div>
                <p className="text-white font-bold text-lg leading-tight">Ruttplanering</p>
                <p className="text-white/70 text-xs mt-0.5">Optimera & navigera</p>
              </div>
              <ChevronRight size={18} className="text-white/60 mt-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Planning */}
          <SmallCard
            icon={CalendarDays}
            label="Planering"
            sub="Schemalägg"
            to="/planning"
            iconColor="#8B8BFF"
            navigate={navigate}
          />

          {/* Map */}
          <SmallCard
            icon={Map}
            label="Karta"
            sub="Områden"
            to="/areas"
            iconColor="#4ADE80"
            navigate={navigate}
          />

          {/* AI */}
          <SmallCard
            icon={Bot}
            label="AI Assistent"
            sub="Fråga AI"
            to="/ai"
            iconColor="#C084FC"
            navigate={navigate}
          />

          {/* Projects */}
          <SmallCard
            icon={Folder}
            label="Projekt"
            sub="Alla projekt"
            to="/projects"
            iconColor="#F4A261"
            navigate={navigate}
          />

        </div>
      </section>

      {/* QUICK ACCESS */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-0.5">Mer</p>
        <div className="flex flex-col gap-2 stagger-children">

          <QuickRow icon={Clock} label="Tidrapport" to="/time" iconColor="#60A5FA" navigate={navigate} />
          <QuickRow icon={HomeIcon} label="Egna Områden" to="/egna" iconColor="#34D399" navigate={navigate} />
          <QuickRow icon={Truck} label="Tidx Sopning" to="/tidx" iconColor="#FBBF24" navigate={navigate} />
          <QuickRow icon={Zap} label="Optimal" to="/optimal" iconColor="#A78BFA" navigate={navigate} />
          <QuickRow icon={Volume2} label="Röstkanaler" to="/voice" iconColor="#38BDF8" navigate={navigate} />
          {isAdmin && (
            <QuickRow icon={Route} label="Admin Panel" to="/admin" iconColor="#F87171" navigate={navigate} />
          )}

        </div>
      </section>

    </div>
  )
}

function SmallCard({
  icon: Icon,
  label,
  sub,
  to,
  iconColor,
  navigate,
}: {
  icon: any
  label: string
  sub: string
  to: string
  iconColor: string
  navigate: (to: string) => void
}) {
  return (
    <button
      onClick={() => navigate(to)}
      className="dash-card p-4 text-left flex flex-col gap-3"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${iconColor}18` }}
      >
        <Icon size={19} style={{ color: iconColor }} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </button>
  )
}

function QuickRow({
  icon: Icon,
  label,
  to,
  iconColor,
  navigate,
}: {
  icon: any
  label: string
  to: string
  iconColor: string
  navigate: (to: string) => void
}) {
  return (
    <button
      onClick={() => navigate(to)}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-150 active:scale-[0.98] group"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${iconColor}18` }}
      >
        <Icon size={17} style={{ color: iconColor }} />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground text-left">{label}</span>
      <ChevronRight size={15} className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
    </button>
  )
}
