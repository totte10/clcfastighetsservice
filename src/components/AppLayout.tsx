import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import BottomNav from "@/components/BottomNav";

export function AppLayout({ children }: {children: React.ReactNode;}) {

  return (

    <SidebarProvider>

      <div className="min-h-[100dvh] flex w-full bg-[#020617]">

        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">

          {/* PREMIUM TOPBAR */}

          <header
            className="h-[64px] flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 border-b border-white/5 bg-gradient-to-b from-[#0b1220]/90 to-[#0b1220]/40 backdrop-blur-2xl mt-0 shadow-none pb-[30px] pt-[100px]">

















            

            {/* Sidebar button */}

            <div className="md:hidden">
              <SidebarTrigger className="text-white/60 hover:text-white transition" />
            </div>

            {/* Logo */}

            <div className="flex-1 flex justify-center md:justify-start">

              <div className="relative flex items-center justify-center">

                <img
                  src="/apple-touch-icon.png"
                  className="
                  h-10
                  w-10
                  object-contain
                  rounded-xl
                  drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]
                  " />
                

                <div
                  className="
                  absolute
                  inset-0
                  rounded-xl
                  bg-blue-500/20
                  blur-xl
                  opacity-40
                  " />
                

              </div>

            </div>

            {/* Notifications */}

            <div className="relative flex items-center">

              <NotificationBell />

              <span
                className="
                absolute
                -top-1
                -right-1
                w-2.5
                h-2.5
                bg-emerald-400
                rounded-full
                animate-pulse
                " />
              

            </div>

          </header>


          {/* CONTENT */}

          <main
            className="
            flex-1
            overflow-y-auto
            max-w-md
            mx-auto
            w-full
            px-4
            md:px-8
            pt-6
            pb-[120px]
            ">
            

            {children}

          </main>


          {/* MOBILE NAV */}

          <div className="md:hidden">
            <BottomNav />
          </div>

        </div>

      </div>

    </SidebarProvider>);


}