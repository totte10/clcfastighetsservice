import { MessageCircle, Calendar, Settings, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import clcLogo from "@/assets/clc-logo.png";

export default function BottomNav() {

  const navigate = useNavigate();
  const location = useLocation();

  function Item({
    icon:Icon,
    label,
    path
  }:{
    icon:any,
    label:string,
    path:string
  }){

    const active = location.pathname === path;

    return(

      <button
        onClick={()=>navigate(path)}
        className={`flex flex-col items-center gap-1 text-[11px] transition-all duration-200 ${
          active
            ? "text-primary"
            : "text-muted-foreground"
        }`}
      >

        <Icon className={`h-5 w-5 ${active ? "scale-110" : ""}`} />

        <span>{label}</span>

      </button>

    )

  }

  return(

    <nav
      className="
      fixed
      bottom-0
      left-0
      right-0
      pb-[env(safe-area-inset-bottom)]
      pt-2
      bg-[rgba(2,6,23,0.75)]
      backdrop-blur-3xl
      border-t border-white/5
      shadow-[0_-10px_30px_rgba(0,0,0,0.6)]
      flex
      items-center
      justify-around
      z-50
      "
    >

      {/* Sidebar */}

      <div className="flex flex-col items-center text-[11px] text-muted-foreground">

        <SidebarTrigger className="flex flex-col items-center gap-1">

          <Menu className="h-5 w-5"/>

          <span>Meny</span>

        </SidebarTrigger>

      </div>

      {/* Chat */}

      <Item icon={MessageCircle} label="Chatt" path="/chat"/>

      {/* Home */}

      <button
        onClick={()=>navigate("/")}
        className="flex flex-col items-center -mt-7"
      >

        <div
          className="
          w-16 h-16
          rounded-full
          bg-gradient-to-b
          from-[#0f172a]
          to-[#020617]
          border border-primary/40
          shadow-[0_0_25px_rgba(34,197,94,0.35)]
          flex items-center justify-center
          transition-all duration-300
          "
        >

          <img
            src={clcLogo}
            className="w-9 h-9 object-contain"
          />

        </div>

        <span className="text-[11px] text-primary mt-1">
          Hem
        </span>

      </button>

      {/* Planning */}

      <Item icon={Calendar} label="Planering" path="/planning"/>

      {/* Admin */}

      <Item icon={Settings} label="Admin" path="/admin"/>

    </nav>

  )

}
