import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import { NavLink } from "react-router-dom";
import { useState } from "react";

import {
  LayoutDashboard,
  Wind,
  Home,
  Truck,
  Folder,
  Route,
  MessageCircle,
  Mic,
  Clock,
  ChevronDown,
  ChevronRight,
  Settings,
  Map,
} from "lucide-react";

export function AppSidebar() {

  const [maskinOpen, setMaskinOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  return (

    <Sidebar
      className="border-r border-white/[0.04]"
      style={{
        background:
          "linear-gradient(180deg, hsl(222 45% 5%) 0%, hsl(222 40% 4%) 100%)",
      }}
    >

      {/* HEADER */}

      <SidebarHeader className="border-b border-white/[0.04] px-4 py-4">

        <div className="flex items-center gap-3 ml-1">

          <img
            src="/lovable-uploads/f50fb16e-0a0e-4157-a6a4-ac098b2d14fb.png"
            className="h-9 w-9"
          />

          <div>
            <p className="text-sm font-semibold text-foreground">
              CLC
            </p>

            <p className="text-[11px] text-muted-foreground tracking-wider">
              FASTIGHETSSERVICE
            </p>

          </div>

        </div>

      </SidebarHeader>


      {/* MENU */}

      <SidebarContent>

        <SidebarMenu>

          {/* DASHBOARD */}

          <MenuItem
            icon={LayoutDashboard}
            to="/"
            label="Dashboard"
          />


          {/* MASKINSOPNING */}

          <SidebarMenuItem>

            <button
              onClick={() => setMaskinOpen(!maskinOpen)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-white/40 hover:bg-white/[0.04] hover:text-white/70 transition"
            >

              <Wind size={18} />

              <span className="flex-1 text-left">
                Maskinsopning
              </span>

              {maskinOpen
                ? <ChevronDown size={16} />
                : <ChevronRight size={16} />
              }

            </button>

          </SidebarMenuItem>


          {maskinOpen && (

            <div className="ml-6 space-y-0.5">

              <MenuItem
                icon={Route}
                to="/tidx"
                label="Tidx Sopningar"
              />

              <MenuItem
                icon={Home}
                to="/egna"
                label="Egna områden"
              />

              <MenuItem
                icon={Truck}
                to="/optimal"
                label="Optimal områden"
              />

              <MenuItem
                icon={Folder}
                to="/tmm"
                label="Sopningar TMM"
              />

              <MenuItem
                icon={Folder}
                to="/projects"
                label="Övriga projekt"
              />

            </div>

          )}


          {/* ROUTE */}

          <MenuItem
            icon={Route}
            to="/route"
            label="Ruttplanering"
          />


          {/* CHAT */}

          <MenuItem
            icon={MessageCircle}
            to="/chat"
            label="Chatt"
          />


          {/* VOICE */}

          <MenuItem
            icon={Mic}
            to="/voice"
            label="Röstkanaler"
          />


          {/* TIME */}

          <MenuItem
            icon={Clock}
            to="/time"
            label="Tidsrapport"
          />


          {/* ADMIN SECTION */}

          <SidebarMenuItem>

            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-white/40 hover:bg-white/[0.04] hover:text-white/70 transition"
            >

              <Settings size={18} />

              <span className="flex-1 text-left">
                Admin
              </span>

              {adminOpen
                ? <ChevronDown size={16} />
                : <ChevronRight size={16} />
              }

            </button>

          </SidebarMenuItem>


          {adminOpen && (

            <div className="ml-6 space-y-0.5">

              <MenuItem
                icon={LayoutDashboard}
                to="/admin-dashboard"
                label="Admin Dashboard"
              />

              <MenuItem
                icon={Map}
                to="/admin-planner"
                label="Planner"
              />

              <MenuItem
                icon={Settings}
                to="/admin"
                label="Admin Inställningar"
              />

            </div>

          )}

        </SidebarMenu>

      </SidebarContent>

    </Sidebar>

  );

}



function MenuItem({
  icon: Icon,
  label,
  to,
}: {
  icon: any;
  label: string;
  to: string;
}) {

  return (

    <SidebarMenuItem>

      <NavLink to={to}>

        {({ isActive }) => (

          <SidebarMenuButton
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition
            ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
            }`}
          >

            <Icon size={18} />

            {label}

          </SidebarMenuButton>

        )}

      </NavLink>

    </SidebarMenuItem>

  );

}