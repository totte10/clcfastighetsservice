import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { NotificationBell } from "@/components/NotificationBell"
import BottomNav from "@/components/BottomNav"

export function AppLayout({ children }: { children: React.ReactNode }) {

  return (

    <SidebarProvider>

      <div className="min-h-[100dvh] flex w-full bg-[#020617]">

        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">

          {/* Topbar */}

          <header className="h-[64px] flex items-center justify-between px-4 md:px-6 border-b border-white/5 bg-black/30 backdrop-blur-xl sticky top-0 z-50">

            {/* Left - Sidebar trigger */}

            <div className="md:hidden">
              <SidebarTrigger className="text-white/60 hover:text-white transition-colors" />
            </div>

            {/* Center - Logo */}

            <div className="flex-1 flex justify-center md:justify-start">

              <img
                src="/logo.png"
                className="h-9 w-9 rounded-xl object-contain"
              />

            </div>

            {/* Right - Notifications */}

            <div className="flex items-center">

              <NotificationBell />

            </div>

          </header>


          {/* Page content */}

          <main className="flex-1 overflow-y-auto max-w-md mx-auto w-full px-4 md:px-8 pt-6 pb-[120px]">

            {children}

          </main>


          {/* Bottom navigation mobile */}

          <div className="md:hidden">

            <BottomNav />

          </div>

        </div>

      </div>

    </SidebarProvider>

  )
}
