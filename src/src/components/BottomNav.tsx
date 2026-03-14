import { Map, MessageCircle, Home, FolderOpen, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function BottomNav() {

  const navigate = useNavigate();
  const location = useLocation();

  function Item({icon:Icon,label,path}:{icon:any,label:string,path:string}){

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

    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around py-3 z-50">

      <Item icon={Map} label="Karta" path="/route"/>

      <Item icon={MessageCircle} label="Chatt" path="/chat"/>

      <Item icon={Home} label="Hem" path="/"/>

      <Item icon={FolderOpen} label="Projekt" path="/projects"/>

      <Item icon={Settings} label="Admin" path="/admin"/>

    </nav>

  )

}
