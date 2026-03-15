import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import BottomNav from "@/components/BottomNav";

export function AppLayout({ children }: {children: React.ReactNode;}) {

  return (

    <SidebarProvider>

      <div className="min-h-[100dvh] flex w-full bg-zinc-100 text-zinc-900">

        {/* Desktop sidebar */}

        <div className="hidden md:block border-r border-zinc-200 bg-white">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">

          {/* Topbar */}

          <header
            className="
            h-[64px]
            flex
            items-center
            justify-between
            px-4
            md:px-6
            sticky
            top-0
            z-50
            bg-white/90
            backdrop-blur
            border-b
            border-zinc-200
            ">
            

            {/* Sidebar button */}

            <div className="md:hidden">
              <SidebarTrigger className="text-zinc-600 hover:text-zinc-900 transition" />
            </div>


            {/* Logo */}

            <div className="flex-1 flex justify-center md:justify-start">

              <div className="flex items-center gap-2">

                <img
                  src="/apple-touch-icon.png"
                  className="h-9 w-9 rounded-lg object-contain" />
                

                <span className="hidden md:block font-semibold tracking-tight text-zinc-800">
                  CLC Fastighetsservice
                </span>

              </div>

            </div>


            {/* Notifications */}

            <NotificationBell />

          </header>


          {/* Main content */}

          <main
            className="flex-1 overflow-y-auto max-w-md mx-auto w-full px-4 md:px-8 pt-6 pb-[120px] bg-zinc-700">










            

            {children}

          </main>


          {/* Bottom navigation */}

          <div className="md:hidden bg-white border-t border-zinc-200">

            <BottomNav />

          </div>

        </div>

      </div>

    </SidebarProvider>);


}