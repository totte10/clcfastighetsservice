import { LayoutDashboard, Clock, Settings, Wind, Home, MessageCircle, LogOut, ClipboardList, FolderOpen, CalendarDays, Truck, Brush, MapPin, DollarSign, Route, AlertTriangle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import clcLogo from "@/assets/clc-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, adminOnly: false },
  { title: "Tidx Sopningar", url: "/tidx", icon: Wind, adminOnly: false },
  { title: "Egna Områden", url: "/egna", icon: Home, adminOnly: false },
  { title: "Optimal Områden", url: "/optimal", icon: Truck, adminOnly: false },
  { title: "Sopningar TMM", url: "/tmm", icon: Brush, adminOnly: false },
  { title: "Övriga Projekt", url: "/projects", icon: FolderOpen, adminOnly: false },
  { title: "Ruttplanering", url: "/route", icon: Route, adminOnly: false },
  { title: "Chatt", url: "/chat", icon: MessageCircle, adminOnly: false },
  { title: "Tidrapport", url: "/time", icon: Clock, adminOnly: false },
  { title: "Planering", url: "/planning", icon: CalendarDays, adminOnly: true },
  { title: "Samlad Rapport", url: "/time/reports", icon: ClipboardList, adminOnly: true },
  { title: "Lönerapport", url: "/payroll", icon: DollarSign, adminOnly: true },
  { title: "Saknade koordinater", url: "/missing-coords", icon: AlertTriangle, adminOnly: true },
  { title: "Admin", url: "/admin", icon: Settings, adminOnly: true },
];

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut, profile, isAdmin } = useAuth();

  const visibleItems = items.filter((item) => !item.adminOnly || isAdmin);

  const displayName = profile?.fullName || profile?.username || user?.email || "";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-sidebar border-r border-sidebar-border/50">
        <div className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 ring-1 ring-sidebar-border/50">
            <img src={clcLogo} alt="CLC" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-accent-foreground tracking-tight leading-tight">
                CLC
              </span>
              <span className="text-[10px] text-sidebar-foreground/40 tracking-[0.2em] uppercase">
                Fastighetsservice
              </span>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="mx-4 mb-2">
            <div className="h-px bg-gradient-to-r from-sidebar-border/60 via-sidebar-border/20 to-transparent" />
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-2">
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-9">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      onClick={() => isMobile && setOpenMobile(false)}
                      className="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-all duration-200 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60"
                      activeClassName="text-sidebar-primary bg-sidebar-accent text-sidebar-primary-foreground shadow-[0_0_12px_-4px_hsl(152_50%_42%/0.3),inset_0_1px_0_hsl(152_50%_42%/0.1)]"
                    >
                      <item.icon className="h-4 w-4 shrink-0 transition-colors duration-200" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar border-t border-sidebar-border/30">
        <div className="p-2">
          {!collapsed && displayName && (
            <p className="text-[10px] text-sidebar-foreground/35 truncate px-3 mb-1.5 font-medium">
              {displayName}
            </p>
          )}
          <SidebarMenuButton
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/50 transition-all duration-200 hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logga ut</span>}
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
