import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Map, MessageCircle, FolderOpen, Settings, Play, Navigation, Mic, Camera } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import clcLogo from "@/assets/clc-logo.png";

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: () => void;
  angle: number;
}

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const isActive = (path: string) => location.pathname === path;

  const quickActions: QuickAction[] = [
    {
      icon: Play,
      label: "Starta jobb",
      action: () => { setMenuOpen(false); navigate("/"); },
      angle: 220,
    },
    {
      icon: Navigation,
      label: "Nästa adress",
      action: () => { setMenuOpen(false); navigate("/route"); },
      angle: 270,
    },
    {
      icon: Mic,
      label: "Röstkanal",
      action: () => { setMenuOpen(false); navigate("/voice"); },
      angle: 320,
    },
    {
      icon: Camera,
      label: "Ta foto",
      action: () => { setMenuOpen(false); navigate("/"); },
      angle: 180,
    },
  ];

  const radius = 85;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Backdrop for radial menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

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
        <div className="relative flex flex-col items-center -mt-6" ref={menuRef}>
          {/* Quick Actions Radial Menu */}
          {menuOpen && (
            <div className="absolute bottom-16 left-1/2 z-50">
              {quickActions.map((qa, i) => {
                const rad = (qa.angle * Math.PI) / 180;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;
                const QaIcon = qa.icon;
                return (
                  <button
                    key={i}
                    onClick={qa.action}
                    className="absolute flex flex-col items-center gap-1 animate-radial-appear"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: "translate(-50%, -50%)",
                      animationDelay: `${i * 50}ms`,
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-[hsl(220,30%,12%)] border border-primary/40 flex items-center justify-center neon-glow transition-all hover:scale-110 hover:border-primary/70 active:scale-95">
                      <QaIcon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-[10px] font-medium text-foreground/80 whitespace-nowrap">
                      {qa.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Home button */}
          <button
            onClick={() => {
              if (menuOpen) {
                setMenuOpen(false);
                navigate("/");
              } else {
                setMenuOpen(true);
              }
            }}
            className={`
              w-14 h-14 rounded-full flex items-center justify-center
              bg-[hsl(220,30%,10%)] border-2 border-primary/50
              transition-all duration-300 active:scale-95
              ${menuOpen ? "neon-glow-strong rotate-45 border-primary" : "animate-neon-pulse"}
            `}
          >
            <img
              src={clcLogo}
              alt="Hem"
              className={`w-8 h-8 rounded-lg object-cover transition-transform duration-300 ${menuOpen ? "-rotate-45" : ""}`}
            />
          </button>
          <span className="text-[10px] font-medium text-primary/80 mt-1">Hem</span>
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
