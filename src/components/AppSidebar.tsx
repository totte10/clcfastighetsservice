import { LayoutDashboard, Clock, Settings, Wind, Home, MessageCircle, LogOut, ClipboardList } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  { title: "Chatt", url: "/chat", icon: MessageCircle, adminOnly: false },
  { title: "Tidrapport", url: "/time", icon: Clock, adminOnly: false },
  { title: "Admin", url: "/admin", icon: Settings, adminOnly: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const visibleItems = items.filter((item) => !item.adminOnly || isAdmin);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-3">
          <img src={clcLogo} alt="CLC" className="w-9 h-9 rounded-lg shrink-0 object-contain" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-semibold text-sidebar-foreground tracking-tight leading-tight">
                CLC
              </span>
              <span className="text-[10px] text-sidebar-foreground/50 tracking-widest uppercase">
                Fastighetsservice
              </span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-2">
          {!collapsed && user && (
            <p className="text-[10px] text-sidebar-foreground/50 truncate px-2 mb-1">
              {user.email}
            </p>
          )}
          <SidebarMenuButton onClick={signOut} className="w-full hover:bg-sidebar-accent/50 text-sidebar-foreground/70">
            <LogOut className="mr-2 h-4 w-4" />
            {!collapsed && <span>Logga ut</span>}
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
