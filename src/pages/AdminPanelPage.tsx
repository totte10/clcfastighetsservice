import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FolderOpen, MapPin, DollarSign, Volume2,
  ChevronRight, Shield
} from "lucide-react";

const sections = [
  {
    title: "Dashboard",
    description: "Veckostatistik och projektöversikt",
    icon: LayoutDashboard,
    route: "/",
  },
  {
    title: "Användare",
    description: "Skapa, redigera och tilldela projekt",
    icon: Users,
    route: "/admin",
  },
  {
    title: "Projekt",
    description: "Hantera alla projekt och tilldelningar",
    icon: FolderOpen,
    route: "/projects",
  },
  {
    title: "Karthantering",
    description: "Alla projektplatser och saknade koordinater",
    icon: MapPin,
    route: "/missing-coords",
  },
  {
    title: "Lönerapporter",
    description: "Timmöversikt, Excel och Fortnox-export",
    icon: DollarSign,
    route: "/payroll",
  },
  {
    title: "Röstkanaler",
    description: "Aktiva användare och kanalhantering",
    icon: Volume2,
    route: "/voice",
  },
];

export default function AdminPanelPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center neon-glow">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground neon-text leading-tight">Admin Panel</h1>
          <p className="text-[11px] text-muted-foreground">Operations Control Center</p>
        </div>
      </div>

      <div className="grid gap-2.5">
        {sections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <button
              key={section.title}
              onClick={() => navigate(section.route)}
              className="glass-card-hover flex items-center gap-4 p-4 text-left group w-full"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:neon-glow transition-all">
                <SectionIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-sm">{section.title}</div>
                <div className="text-xs text-muted-foreground">{section.description}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
