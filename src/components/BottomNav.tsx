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
    icon:any
    label:string
    path:string
  }){

    const active = location.pathname === path;

    return(

      <button
        onClick={()=>navigate(path)}
        className={`
        flex flex-col items-center justify-center
        gap-[2px]
        text-[10px]
        transition-all
        duration-200
        ${active ? "text-primary" : "text-muted-foreground"}
        `}
      >

        <Icon
          className={`
          h-[20px] w-[20px]
          transition-transform
          ${active ? "scale-110 text-primary" : ""}
          `}
        />

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
      pt-1.5
      bg-[rgba(2,6,23,0.65)]
      backdrop-blur-3xl
      border-t border-white/5
      shadow-[0_-8px_25px_rgba(0,0,0,0.6)]
      flex
      items-center
      justify-around
      z-50
      "
    >

      {/* Menu */}

      <div className="flex flex-col items-center text-[10px] text-muted-foreground">

        <SidebarTrigger className="flex flex-col items-center gap-[2px]">

          <Menu className="h-[20px] w-[20px]" />

          <span>Meny</span>

        </SidebarTrigger>

      </div>

      {/* Chat */}

      <Item
        icon={MessageCircle}
        label="Chatt"
        path="/chat"
      />

      {/* Home */}

      <button
        onClick={()=>navigate("/")}
        className="flex flex-col items-center -mt-5"
      >

        <div
          className="
          w-[54px]
          h-[54px]
          flex
          items-center
          justify-center
          "
        >

          <img
            src={clcLogo}
            className="
            w-[34px]
            h-[34px]
            object-contain
            drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]
            "
          />

        </div>

        <span className="text-[10px] text-primary mt-[2px]">
          Hem
        </span>

      </button>

      {/* Planning */}

      <Item
        icon={Calendar}
        label="Planering"
        path="/planning"
      />

      {/* Admin */}

      <Item
        icon={Settings}
        label="Admin"
        path="/admin"
      />

    </nav>

  )

}
