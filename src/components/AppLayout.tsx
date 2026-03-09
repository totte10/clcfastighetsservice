import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/30 bg-background/80 backdrop-blur-xl px-4 md:px-6 shrink-0 sticky top-0 z-10">
            <SidebarTrigger className="mr-4 text-muted-foreground hover:text-foreground transition-colors" />
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-slow" />
              <span className="text-xs font-medium text-muted-foreground tracking-wide">
                CLC Fastighetsservice
              </span>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
