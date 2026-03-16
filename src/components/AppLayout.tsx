import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { Search } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-[100dvh] flex w-full">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 backdrop-blur-xl pt-[env(safe-area-inset-top,12px)] pb-3 border-b border-white/[0.04]"
            style={{ background: 'linear-gradient(180deg, hsl(222 47% 5% / 0.92) 0%, hsl(222 47% 5% / 0.8) 100%)' }}>

            {/* Left: Sidebar trigger + avatar */}
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

            {/* Center: Logo */}
            <div className="flex items-center gap-2">
              <img
                className="h-8 w-8 rounded-none object-contain"
                src="/lovable-uploads/eb761a10-27f3-4121-809d-7e0154afd1e3.png"
                alt="CLC"
              />
              <span className="hidden md:block text-sm font-semibold tracking-tight text-foreground">
                CLC Fastighetsservice
              </span>
            </div>

            {/* Right: Search + Notifications */}
            <div className="flex items-center gap-2">
              <button className="h-8 w-8 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/[0.06] text-white/40 hover:text-white/70 transition">
                <Search size={15} />
              </button>
              <NotificationBell />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-4 md:px-8 pb-28 pt-4">
            {children}
          </main>

          {/* Bottom navigation */}
          <div className="md:hidden">
            <BottomNav />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
