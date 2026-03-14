import { useNavigate, useLocation } from "react-router-dom";
import { Map, MessageCircle, FolderOpen, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import clcLogo from "@/assets/clc-logo.png";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <nav className="relative flex items-end justify-around px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)] bg-[hsl(220,35%,6%)]/95 backdrop-blur-xl border-t border-border/30 z-50">

        {/* Map */}
        <NavItem
          icon={Map}
          label="Karta"
          active={isActive("/tidx") || isActive("/egna") || isActive("/optimal") || isActive("/tmm")}
          onClick={() => navigate("/tidx")}
        />

        {/* Chat */}
        <NavItem
          icon={MessageCircle}
          label="Chatt"
          active={isActive("/chat")}
          onClick={() => navigate("/chat")}
        />

        {/* Center Home Button */}
        <div className="relative flex flex-col items-center -mt-6">
          <button
            onClick={() => navigate("/")}
            className="
              w-14 h-14 rounded-full flex items-center justify-center
              bg-[hsl(220,30%,10%)] border-2 border-primary/50
              transition-all duration-300 active:scale-95
              animate-neon-pulse
            "
          >
            <img
              src={clcLogo}
              alt="Hem"
              className="w-8 h-8 rounded-lg object-cover"
            />
          </button>
          <span className="text-[10px] font-medium text-primary/80 mt-1">
            Hem
          </span>
        </div>

        {/* Projects */}
        <NavItem
          icon={FolderOpen}
          label="Projekt"
          active={isActive("/projects")}
          onClick={() => navigate("/projects")}
        />

        {/* Settings / Admin */}
        <NavItem
          icon={Settings}
          label={isAdmin ? "Admin" : "Mer"}
          active={isActive("/admin") || isActive("/admin-panel")}
          onClick={() => navigate(isAdmin ? "/admin-panel" : "/time")}
        />
      </nav>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-all duration-200 ${
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <div className={`relative ${active ? "neon-text" : ""}`}>
        <Icon className="h-5 w-5" />
        {active && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary neon-glow" />
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
