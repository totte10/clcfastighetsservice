import { Home, CalendarDays, Bot, Map, Settings } from "lucide-react"
import { NavLink } from "react-router-dom"

export default function MobileNavbar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}>
      <div className="max-w-md mx-auto">
        <nav className="glass-nav flex justify-around items-center py-2 px-2">
          <Tab to="/" icon={Home} label="Hem" />
          <Tab to="/planning" icon={CalendarDays} label="Planering" />
          <Tab to="/ai" icon={Bot} label="AI" />
          <Tab to="/areas" icon={Map} label="Områden" />
          <Tab to="/admin" icon={Settings} label="Admin" />
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
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200
        ${isActive ? "text-primary" : "text-muted-foreground"}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
          <span className="text-[10px] font-medium">{label}</span>
          {isActive && (
            <div className="w-1 h-1 rounded-full bg-primary" />
          )}
        </>
      )}
    </NavLink>
  )
}
