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
        className={`flex flex-col items-center text-xs ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >

        <Icon className="h-5 w-5"/>

        <span>{label}</span>

      </button>

    )

  }

  return(

    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/40 flex items-center justify-around py-2 z-50">

      {/* Sidebar menu */}

      <div className="flex flex-col items-center text-xs text-muted-foreground">
        <SidebarTrigger>
          <Menu className="h-5 w-5"/>
        </SidebarTrigger>
        <span>Meny</span>
      </div>

      {/* Chat */}

      <Item icon={MessageCircle} label="Chatt" path="/chat"/>

      {/* Home */}

      <button
        onClick={()=>navigate("/")}
        className="flex flex-col items-center -mt-6"
      >

        <div className="w-14 h-14 rounded-full bg-background border border-primary/50 flex items-center justify-center shadow-lg">

          <img
            src={clcLogo}
            className="w-8 h-8 object-contain"
          />

        </div>

        <span className="text-xs text-primary">Hem</span>

      </button>

      {/* Planning */}

      <Item icon={Calendar} label="Planering" path="/planning"/>

      {/* Admin */}

      <Item icon={Settings} label="Admin" path="/admin"/>

    </nav>

  )

}
