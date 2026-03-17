import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

import { NavLink } from "react-router-dom"

import {
  LayoutDashboard,
  CalendarDays,
  Folder,
  MapPin,
  Route as RouteIcon,
  Home,
  Truck,
  Bot,
  Mic,
  Clock,
  DollarSign,
  AlertTriangle,
  Settings,
} from "lucide-react"

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-border/60">

      {/* HEADER */}
      <SidebarHeader className="border-b border-border/60 px-4 py-4">
        <div className="flex items-center gap-3">
          <img
            src="/lovable-uploads/f50fb16e-0a0e-4157-a6a4-ac098b2d14fb.png"
            className="h-8 w-8"
            alt="CLC"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">CLC</p>
            <p className="text-[11px] text-muted-foreground tracking-wider uppercase">Fastighetsservice</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">

        {/* MAIN */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70 px-3 mb-1">Huvudmeny</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <MenuItem icon={LayoutDashboard} to="/" label="Dashboard" />
              <MenuItem icon={CalendarDays} to="/planning" label="Planering" />
              <MenuItem icon={Folder} to="/projects" label="Projekt" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* OPERATIONS */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70 px-3 mb-1">Drift</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <MenuItem icon={MapPin} to="/areas" label="Områden" />
              <MenuItem icon={RouteIcon} to="/tidx" label="TIDX Sopningar" />
              <MenuItem icon={Home} to="/egna" label="Egna områden" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* CUSTOMERS */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70 px-3 mb-1">Kunder</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <MenuItem icon={Truck} to="/optimal" label="Optimal" />
              <MenuItem icon={Folder} to="/tmm" label="TMM" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* TOOLS */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70 px-3 mb-1">Verktyg</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <MenuItem icon={Bot} to="/ai" label="AI Assistent" />
              <MenuItem icon={Mic} to="/voice" label="Röstkanaler" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* REPORTING */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70 px-3 mb-1">Rapportering</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <MenuItem icon={Clock} to="/time" label="Tidsrapport" />
              <MenuItem icon={DollarSign} to="/payroll" label="Löneunderlag" />
              <MenuItem icon={AlertTriangle} to="/missing-coords" label="Saknade koordinater" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ADMIN */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70 px-3 mb-1">Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <MenuItem icon={Settings} to="/admin-dashboard" label="Admin Dashboard" />
              <MenuItem icon={Settings} to="/admin" label="Inställningar" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

    </Sidebar>
  )
}

function MenuItem({ icon: Icon, label, to }: { icon: any; label: string; to: string }) {
  return (
    <SidebarMenuItem>
      <NavLink to={to} end={to === "/"}>
        {({ isActive }) => (
          <SidebarMenuButton
            isActive={isActive}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          >
            <Icon size={16} />
            {label}
          </SidebarMenuButton>
        )}
      </NavLink>
    </SidebarMenuItem>
  )
}
