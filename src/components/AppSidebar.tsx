import { useState } from "react";
import { LayoutDashboard, Clock, Settings, Wind, Home, MessageCircle, LogOut, ClipboardList, FolderOpen, CalendarDays, Truck, Brush, Route, AlertTriangle, DollarSign, ChevronDown, Paintbrush, Volume2 } from "lucide-react";
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
  useSidebar } from
"@/components/ui/sidebar";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{className?: string;}>;
  adminOnly: boolean;
}

interface MenuGroup {
  title: string;
  icon: React.ComponentType<{className?: string;}>;
  adminOnly: boolean;
  children: MenuItem[];
}

type MenuEntry = MenuItem | MenuGroup;

function isGroup(entry: MenuEntry): entry is MenuGroup {
  return "children" in entry;
}

const menuEntries: MenuEntry[] = [
{ title: "Dashboard", url: "/", icon: LayoutDashboard, adminOnly: false },
{
  title: "Maskinsopning",
  icon: Paintbrush,
  adminOnly: false,
  children: [
  { title: "Tidx Sopningar", url: "/tidx", icon: Wind, adminOnly: false },
  { title: "Egna Områden", url: "/egna", icon: Home, adminOnly: false },
  { title: "Optimal Områden", url: "/optimal", icon: Truck, adminOnly: false },
  { title: "Sopningar TMM", url: "/tmm", icon: Brush, adminOnly: false }]

},
{ title: "Övriga Projekt", url: "/projects", icon: FolderOpen, adminOnly: false },
{ title: "Ruttplanering", url: "/route", icon: Route, adminOnly: false },
{ title: "Chatt", url: "/chat", icon: MessageCircle, adminOnly: false },
{ title: "Röstkanaler", url: "/voice", icon: Volume2, adminOnly: false },
{ title: "Tidrapport", url: "/time", icon: Clock, adminOnly: false },
{ title: "Planering", url: "/planning", icon: CalendarDays, adminOnly: true },
{ title: "Samlad Rapport", url: "/time/reports", icon: ClipboardList, adminOnly: true },
{ title: "Lönerapport", url: "/payroll", icon: DollarSign, adminOnly: true },
{ title: "Saknade koordinater", url: "/missing-coords", icon: AlertTriangle, adminOnly: true },
{ title: "Admin", url: "/admin", icon: Settings, adminOnly: true }];


export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut, profile, isAdmin } = useAuth();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["Maskinsopning"]));

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);else
      next.add(title);
      return next;
    });
  };

  const displayName = profile?.fullName || profile?.username || user?.email || "";

  const visibleEntries = menuEntries.filter((entry) => {
    if (isGroup(entry)) {
      return !entry.adminOnly || isAdmin;
    }
    return !entry.adminOnly || isAdmin;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-sidebar border-r border-sidebar-border/50">
        <div className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 ring-1 ring-sidebar-border/50">
            <img alt="CLC" className="w-full h-full object-cover" src="/lovable-uploads/ea8a264c-9e52-4ceb-ae7c-11365d187b44.png" />
          </div>
          {!collapsed &&
          <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-accent-foreground tracking-tight leading-tight">
                CLC
              </span>
              <span className="text-[10px] text-sidebar-foreground/40 tracking-[0.2em] uppercase">
                Fastighetsservice
              </span>
            </div>
          }
        </div>

        {!collapsed &&
        <div className="mx-4 mb-2">
            <div className="h-px bg-gradient-to-r from-sidebar-border/60 via-sidebar-border/20 to-transparent" />
          </div>
        }

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-2">
              {visibleEntries.map((entry) => {
                if (isGroup(entry)) {
                  const isOpen = openGroups.has(entry.title);
                  const visibleChildren = entry.children.filter((c) => !c.adminOnly || isAdmin);
                  if (visibleChildren.length === 0) return null;
                  const GroupIcon = entry.icon;

                  return (
                    <div key={entry.title}>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => toggleGroup(entry.title)}
                          className="h-9 w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-all duration-200 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60">
                          
                          <GroupIcon className="h-4 w-4 shrink-0 transition-colors duration-200" />
                          {!collapsed &&
                          <>
                              <span className="flex-1 text-left">{entry.title}</span>
                              <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`} />
                            </>
                          }
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      {isOpen && !collapsed &&
                      <div className="ml-3 border-l border-sidebar-border/30 pl-2 space-y-0.5 mt-0.5">
                          {visibleChildren.map((child) =>
                        <SidebarMenuItem key={child.title}>
                              <SidebarMenuButton asChild className="h-8">
                                <NavLink
                              to={child.url}
                              onClick={() => isMobile && setOpenMobile(false)}
                              className="group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground/60 transition-all duration-200 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60"
                              activeClassName="text-sidebar-primary bg-sidebar-accent text-sidebar-primary-foreground shadow-[0_0_12px_-4px_hsl(152_50%_42%/0.3),inset_0_1px_0_hsl(152_50%_42%/0.1)]">
                              
                                  <child.icon className="h-3.5 w-3.5 shrink-0 transition-colors duration-200" />
                                  <span>{child.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                        </div>
                      }
                    </div>);

                }

                return (
                  <SidebarMenuItem key={entry.title}>
                    <SidebarMenuButton asChild className="h-9">
                      <NavLink
                        to={entry.url}
                        end={entry.url === "/"}
                        onClick={() => isMobile && setOpenMobile(false)}
                        className="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-all duration-200 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60"
                        activeClassName="text-sidebar-primary bg-sidebar-accent text-sidebar-primary-foreground shadow-[0_0_12px_-4px_hsl(152_50%_42%/0.3),inset_0_1px_0_hsl(152_50%_42%/0.1)]">
                        
                        <entry.icon className="h-4 w-4 shrink-0 transition-colors duration-200" />
                        {!collapsed && <span>{entry.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>);

              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar border-t border-sidebar-border/30">
        <div className="p-2">
          {!collapsed && displayName &&
          <p className="text-[10px] text-sidebar-foreground/35 truncate px-3 mb-1.5 font-medium">
              {displayName}
            </p>
          }
          <SidebarMenuButton
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/50 transition-all duration-200 hover:text-destructive hover:bg-destructive/10">
            
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logga ut</span>}
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>);

}