import { Home, CalendarDays, Bot, Map, Settings } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

const TABS = [
  { to: "/", icon: Home, label: "Hem" },
  { to: "/planning", icon: CalendarDays, label: "Plan" },
  { to: "/ai", icon: Bot, label: "AI" },
  { to: "/areas", icon: Map, label: "Karta" },
  { to: "/admin", icon: Settings, label: "Admin" },
]

export default function BottomNav() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-5"
      style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))" }}
    >
      <div className="max-w-sm mx-auto">
        <nav className="glass-nav flex justify-around items-center py-2.5 px-3">
          {TABS.map((tab) => (
            <Tab key={tab.to} {...tab} />
          ))}
        </nav>
      </div>
    </div>
  )
}

function Tab({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-all duration-200 outline-none"
    >
      {({ isActive }) => (
        <>
          <div
            className="relative w-10 h-8 flex items-center justify-center rounded-xl transition-all duration-200"
            style={isActive ? {
              background: "linear-gradient(135deg,rgba(244,162,97,0.22),rgba(231,111,81,0.22))",
              boxShadow: "0 0 18px rgba(244,162,97,0.3)",
            } : {}}
          >
            <Icon
              size={19}
              strokeWidth={isActive ? 2.4 : 1.6}
              className={isActive ? "text-primary" : "text-muted-foreground"}
            />
          </div>
          <span
            className="text-[9px] font-semibold tracking-wide transition-colors duration-200"
            style={{ color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}
