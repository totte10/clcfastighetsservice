import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import BottomNav from "@/components/BottomNav"
import { NotificationBell } from "@/components/NotificationBell"

import { useAuth } from "@/hooks/useAuth"

import { Search, Bot } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function AppLayout({ children }: { children: React.ReactNode }) {

  const { profile } = useAuth()
  const navigate = useNavigate()

  return (

    <SidebarProvider>

      <div className="min-h-[100dvh] flex w-full bg-background">

        {/* DESKTOP SIDEBAR */}

        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* MAIN LAYOUT */}

        <div className="flex flex-col flex-1 min-w-0">

          {/* HEADER */}

          <header
            className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 h-14 border-b border-border/60 bg-background/80 backdrop-blur-xl"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          >

            {/* LEFT */}

            <div className="flex items-center gap-3">

              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition md:hidden" />

              <div className="hidden md:block">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground transition" />
              </div>

              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
                  alt=""
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  {profile?.fullName?.charAt(0) || "?"}
                </div>
              )}

            </div>

            {/* CENTER - empty */}
            <div />

            {/* RIGHT ACTIONS */}

            <div className="flex items-center gap-2">

              <button
                onClick={() => navigate("/ai")}
                className="h-8 w-8 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition"
              >
                <Bot size={15} />
              </button>

              <button
                className="h-8 w-8 rounded-full flex items-center justify-center bg-muted border border-border/60 text-muted-foreground hover:text-foreground transition"
              >
                <Search size={15} />
              </button>

              <NotificationBell />

            </div>

          </header>

          {/* PAGE CONTENT */}

          <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 pt-4 pb-28">
            {children}
          </main>

          {/* MOBILE BOTTOM NAV */}

          <div className="md:hidden">
            <BottomNav />
          </div>

        </div>

      </div>

    </SidebarProvider>

  )

}
