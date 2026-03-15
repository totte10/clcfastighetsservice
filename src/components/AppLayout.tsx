import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { NotificationBell } from "@/components/NotificationBell"
import BottomNav from "@/components/BottomNav"

export function AppLayout({ children }: { children: React.ReactNode }) {

  return (

    <SidebarProvider>

      <div className="min-h-[100dvh] flex w-full bg-zinc-100 dark:bg-zinc-900">

        {/* Desktop Sidebar */}

        <div className="hidden md:block border-r border-zinc-200 dark:border-zinc-800">
          <AppSidebar />
        </div>


        <div className="flex-1 flex flex-col min-w-0">

          {/* TOPBAR */}

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
            bg-white/70
            dark:bg-zinc-900/70
            border-b
            border-zinc-200
            dark:border-zinc-800
            ">

            {/* Sidebar button */}

            <div className="md:hidden">
              <SidebarTrigger className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition" />
            </div>


            {/* Logo */}

            <div className="flex-1 flex justify-center md:justify-start">

              <div className="flex items-center gap-2">

                <img
                  src="/apple-touch-icon.png"
                  className="
                  h-9
                  w-9
                  object-contain
                  rounded-lg
                  "
                />

                <span className="hidden md:block text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
                  CLC
                </span>

              </div>

            </div>


            {/* Notifications */}

            <div className="flex items-center">

              <NotificationBell />

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

          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">

            <BottomNav />

          </div>

        </div>

      </div>

    </SidebarProvider>

  )

}
