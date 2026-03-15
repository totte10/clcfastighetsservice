import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import BottomNav from "@/components/BottomNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full bg-black text-white">

        {/* Desktop sidebar */}
        <div className="hidden md:block border-r border-zinc-800 bg-zinc-950">
          <AppSidebar />
        </div>

        <div className="flex flex-1 flex-col min-w-0">

          {/* Topbar */}
          <header className="sticky top-0 z-50 flex items-center justify-between px-5 pt-safe pb-4 backdrop-blur-md bg-black/60">

            {/* Sidebar button */}
            <div className="md:hidden">
              <SidebarTrigger className="text-zinc-400 hover:text-white transition" />
            </div>

            {/* Title / Logo */}
            <div className="flex-1 flex items-center justify-center md:justify-start gap-3">

              <img
                src="/lovable-uploads/eb761a10-27f3-4121-809d-7e0154afd1e3.png"
                className="h-9 w-9 object-contain"
              />

              <span className="hidden md:block font-semibold tracking-tight text-white">
                CLC Fastighetsservice
              </span>

            </div>

            {/* Notifications */}
            <NotificationBell />

          </header>

          {/* App content */}
          <main
            className="
            flex-1
            w-full
            max-w-md
            mx-auto
            px-4
            pb-[120px]
            pt-2
            overflow-y-auto
            "
          >
            {children}
          </main>

          {/* Bottom navigation */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-black/80 backdrop-blur-xl">
            <BottomNav />
          </div>

        </div>
      </div>
    </SidebarProvider>
  );
}