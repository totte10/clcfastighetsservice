import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import BottomNav from "@/components/BottomNav";

export function AppLayout({ children }: { children: React.ReactNode }) {

  return (

    <SidebarProvider>

      <div className="min-h-[100dvh] flex w-full bg-gradient-to-br from-[#020617] via-[#020617] to-[#022c22] text-white">

        {/* Desktop sidebar */}

        <div className="hidden md:block border-r border-white/10 bg-black/30 backdrop-blur-xl">
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
            backdrop-blur-xl
            border-b
            border-white/10
            bg-black/30
            ">

            {/* Sidebar button */}

            <div className="md:hidden">
              <SidebarTrigger className="text-white/60 hover:text-white transition" />
            </div>


            {/* Logo */}

            <div className="flex-1 flex justify-center md:justify-start">

              <div className="flex items-center gap-2">

                <img
                  src="/lovable-uploads/eb761a10-27f3-4121-809d-7e0154afd1e3.png"
                  className="h-9 w-9 object-contain"
                />

                <span className="hidden md:block font-semibold tracking-tight text-white">
                  CLC Fastighetsservice
                </span>

              </div>

            </div>


            {/* Notifications */}

            <NotificationBell />

          </header>


          {/* Main content */}

          <main
            className="
            flex-1
            overflow-y-auto
            w-full
            px-4
            md:px-8
            pb-[120px]
            pt-[20px]
            ">

            <div className="max-w-md mx-auto">

              <div
                className="
                space-y-4
                bg-zinc-800
                p-5
                rounded-xl
                border
                border-white/5
                "
              >

                {children}

              </div>

            </div>

          </main>


          {/* Bottom navigation */}

          <div className="md:hidden border-t border-white/10 bg-black/40 backdrop-blur-xl">

            <BottomNav />

          </div>

        </div>

      </div>

    </SidebarProvider>

  );

}
