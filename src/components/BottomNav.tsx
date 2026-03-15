import { Home, CalendarDays, MessageCircle, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function MobileNavbar() {

  return (

    <div className="fixed bottom-0 left-0 right-0 z-50">

<div className="max-w-md mx-auto px-4 pb-4 text-primary-foreground">

<div className="backdrop-blur-xl shadow-black/40 flex justify-between items-center px-6 py-3 bg-zinc-900 text-primary-foreground shadow-2xl rounded-md border-zinc-950 border-2 border-solid">











          

<NavLink
            to="/"
            className={({ isActive }) =>
            `flex flex-col items-center text-xs transition
${isActive ? "text-emerald-400" : "text-white/40"}`
            }>
            
<Home className="w-5 h-5 bg-black/0 text-destructive-foreground" />
<span className="text-primary-foreground">Hem</span>
</NavLink>


<NavLink
            to="/planning"
            className={({ isActive }) =>
            `flex flex-col items-center text-xs transition
${isActive ? "text-emerald-400" : "text-white/40"}`
            }>
            
<CalendarDays className="w-5 h-5 text-secondary-foreground" />
<span className="text-primary-foreground">Planering</span>
</NavLink>


<NavLink
            to="/chat"
            className={({ isActive }) =>
            `flex flex-col items-center text-xs transition
${isActive ? "text-emerald-400" : "text-white/40"}`
            }>
            
<MessageCircle className="w-5 h-5 text-secondary-foreground" />
<span className="text-primary-foreground">Chatt</span>
</NavLink>


<NavLink
            to="/admin"
            className={({ isActive }) =>
            `flex flex-col items-center text-xs transition
${isActive ? "text-emerald-400" : "text-white/40"}`
            }>
            
<Settings className="w-5 h-5 text-secondary-foreground" />
<span className="text-primary-foreground">Admin</span>
</NavLink>

</div>

</div>

</div>);



}