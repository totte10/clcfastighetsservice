import BottomNav from "@/components/BottomNav"
import { NotificationBell } from "@/components/NotificationBell"
import { useAuth } from "@/hooks/useAuth"
import { Bot } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/route": "Ruttplanering",
  "/planning": "Planering",
  "/ai": "AI Assistent",
  "/areas": "Områden",
  "/tidx": "Tidx Sopning",
  "/egna": "Egna Områden",
  "/optimal": "Optimal",
  "/tmm": "TMM",
  "/projects": "Projekt",
  "/time": "Tidrapport",
  "/time/reports": "Rapporter",
  "/voice": "Röst",
  "/payroll": "Lön",
  "/admin": "Admin",
  "/admin-dashboard": "Admin Dashboard",
  "/missing-coords": "Saknade Koordinater",
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isHome = location.pathname === "/"
  const pageTitle = PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith("/projects/") ? "Projekt" : "CLC")

  const hour = new Date().getHours()
  const greeting =
    hour < 5 ? "God natt" :
    hour < 12 ? "God morgon" :
    hour < 17 ? "God dag" :
    hour < 21 ? "God kväll" : "God natt"

  const firstName = profile?.fullName?.split(" ")[0] || "där"

  return (
    <div className="min-h-[100dvh] flex flex-col w-full bg-background">

      {/* HEADER */}
      <header
        className="sticky top-0 z-50 px-4 pt-3 pb-2"
        style={{ paddingTop: `max(12px, env(safe-area-inset-top, 12px))` }}
      >
        <div className="flex items-center justify-between">

          {/* LEFT */}
          <div className="flex items-center gap-3">
            {isHome ? (
              <>
                <div className="relative">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      className="h-10 w-10 rounded-2xl object-cover ring-2 ring-primary/30"
                      alt=""
                    />
                  ) : (
                    <div
                      className="h-10 w-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#F4A261,#E76F51)" }}
                    >
                      {profile?.fullName?.charAt(0) || "?"}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-background" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground leading-none mb-0.5">{greeting} 👋</p>
                  <p className="text-sm font-semibold text-foreground leading-none">{firstName}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(-1)}
                  className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/8 text-muted-foreground hover:text-foreground transition active:scale-95"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <h1 className="text-base font-semibold text-foreground">{pageTitle}</h1>
              </div>
            )}
          </div>

          {/* RIGHT — Logo + AI btn + Bell */}
          <div className="flex items-center gap-2">
            {isHome && (
              <img
                src="/logo.jpeg"
                alt="CLC"
                className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/10"
              />
            )}
            <button
              onClick={() => navigate("/ai")}
              className="h-9 w-9 rounded-xl flex items-center justify-center transition active:scale-95"
              style={{ background: "linear-gradient(135deg,rgba(244,162,97,0.15),rgba(231,111,81,0.15))", border: "1px solid rgba(244,162,97,0.2)" }}
            >
              <Bot size={16} className="text-primary" />
            </button>
            <NotificationBell />
          </div>

        </div>
      </header>

      {/* PAGE CONTENT */}
      <main className="flex-1 overflow-y-auto w-full px-4 pt-2 pb-32">
        {children}
      </main>

      {/* BOTTOM NAV */}
      <BottomNav />

    </div>
  )
}
