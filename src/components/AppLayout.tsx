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
            className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/[0.04] backdrop-blur-xl"
            style={{
              paddingTop: "env(safe-area-inset-top,12px)",
              background:
                "linear-gradient(180deg, hsl(222 47% 5% / 0.95) 0%, hsl(222 47% 5% / 0.85) 100%)"
            }}
          >

            {/* LEFT */}

            <div className="flex items-center gap-3">

              <div className="md:hidden">
                <SidebarTrigger className="text-white/40 hover:text-white/70 transition" />
              </div>

              {profile?.avatarUrl ? (

                <img
                  src={profile.avatarUrl}
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10"
                  alt=""
                />

              ) : (

                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">

                  {profile?.fullName?.charAt(0) || "?"}

                </div>

              )}

            </div>


            {/* CENTER LOGO */}

            <div className="flex items-center gap-2 select-none">

              <img
                src="/lovable-uploads/eb761a10-27f3-4121-809d-7e0154afd1e3.png"
                alt="CLC"
                className="h-8 w-8 object-contain"
              />

              <span className="hidden md:block text-sm font-semibold tracking-tight text-foreground">

                CLC Fastighetsservice

              </span>

            </div>


            {/* RIGHT ACTIONS */}

            <div className="flex items-center gap-2">


              {/* AI BUTTON */}

              <button
                onClick={() => navigate("/ai")}
                className="h-8 w-8 rounded-full flex items-center justify-center bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition"
              >

                <Bot size={15} />

              </button>


              {/* SEARCH */}

              <button
                className="h-8 w-8 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/[0.06] text-white/40 hover:text-white/70 transition"
              >

                <Search size={15} />

              </button>


              {/* NOTIFICATIONS */}

              <NotificationBell />

            </div>

          </header>


          {/* PAGE CONTENT */}

          <main
            className="flex-1 overflow-y-auto w-full max-w-lg mx-auto px-4 md:px-8 pt-4 pb-28"
          >

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
