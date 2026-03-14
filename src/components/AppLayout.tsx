import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import BottomNav from "@/components/BottomNav";

export function AppLayout({ children }: {children: React.ReactNode;}) {

  return (

    <SidebarProvider>

      <div className="min-h-[100dvh] flex w-full bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.06),transparent_40%),#020617]">

        {/* Desktop Sidebar */}

        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-[sidebar-accent-foreground] bg-background">

          {/* Premium Header */}

          <header
            className="pt-[env(safe-area-inset-top)] h-[64px] flex items-center justify-between md:px-6 border-b border-white/5 backdrop-blur-2xl sticky top-0 z-40 px-[10px] gap-0 my-[10px] py-[5px] border-4 bg-background border-none rounded-none">












            

            <div className="flex items-center gap-3">

              {/* Sidebar button */}

              <div className="md:hidden">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              </div>

              <div className="flex items-center gap-2">

                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

                <span className="font-medium tracking-wide text-xs font-sans text-primary-foreground">
                  CLC FASTIGHETSSERVICE
                </span>

              </div>

            </div>

            <NotificationBell />

          </header>

          {/* Content */}

          <main
            className="flex-1 overflow-y-auto px-4 pt-4 pb-[120px] md:px-8 border-2">






            
            

            {children}

          </main>

          {/* Bottom Navigation */}

          <div className="md:hidden">

            <BottomNav />

          </div>

        </div>

      </div>

    </SidebarProvider>);



}