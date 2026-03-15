import { MessageCircle, Calendar, Settings, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import clcLogo from "@/assets/clc-logo.png";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const Item = ({ icon: Icon, label, path }: {icon: any;label: string;path: string;}) => {
    const active = location.pathname === path;

    return (
      <button
        onClick={() => navigate(path)}
        className={`
        flex flex-col items-center justify-center
        text-[10px]
        gap-[3px]
        transition-all duration-200
        ${active ? "text-primary" : "text-muted-foreground"}
        `}>
        
        <Icon
          className={`
          w-[20px] h-[20px]
          transition-transform
          ${active ? "scale-110 text-primary" : ""}
          `} />
        

        <span>{label}</span>
      </button>);

  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-[30px] border-t border-white/5 shadow-[0_-8px_25px_rgba(0,0,0,0.7)] flex items-center justify-around z-50 bg-inherit">
      {/* Sidebar */}

      <div className="flex flex-col items-center text-[10px] text-muted-foreground">
        <SidebarTrigger className="flex flex-col items-center gap-[3px]">
          <Menu className="w-[20px] h-[20px]" />

          <span>Meny</span>
        </SidebarTrigger>
      </div>

      {/* Chat */}

      <Item icon={MessageCircle} label="Chatt" path="/chat" />

      {/* Home button */}

      <button onClick={() => navigate("/")} className="flex flex-col items-center -mt-6">
        <div className="w-[52px] h-[52px] bg-gradient-to-b from-[#0f172a] to-[#020617] shadow-[0_0_22px_rgba(34,197,94,0.35)] overflow-hidden transition-transform active:scale-95 rounded-none border-solid flex items-center justify-center border-0 bg-inherit pb-[5px] pt-[5px] pl-[5px] pr-0 py-0 px-0 gap-0 border-secondary">
          <img
            className="w-132px] h-[132px] border-none rounded-none shadow object-contain border-2 border-inherit"
            src="/lovable-uploads/64783441-db13-4667-a680-5e20a437c612.png" />
          
        </div>

        <span className="text-[10px] text-primary mt-[3px]">Hem</span>
      </button>

      {/* Planning */}

      <Item icon={Calendar} label="Planering" path="/planning" />

      {/* Admin */}

      <Item icon={Settings} label="Admin" path="/admin" />
    </nav>);

}