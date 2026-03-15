import { NavLink } from "react-router-dom"
import {
LayoutDashboard,
Wind,
Home,
Truck,
Folder,
Route,
MessageCircle,
Mic,
Clock
} from "lucide-react"

export function AppSidebar() {

return (

<div className="w-[260px] h-screen bg-white border-r border-zinc-200 flex flex-col">

{/* HEADER */}

<div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-200">

<img
src="/apple-touch-icon.png"
className="h-9 w-9 rounded-lg"
/>

<div>

<p className="text-sm font-semibold text-zinc-900">
CLC
</p>

<p className="text-[11px] text-zinc-500">
FASTIGHETSSERVICE
</p>

</div>

</div>


{/* MENU */}

<div className="flex-1 px-3 py-4 space-y-1">

<SidebarItem icon={LayoutDashboard} to="/" label="Dashboard" />

<SidebarItem icon={Wind} to="/maskinsopning" label="Maskinsopning" />

<SidebarItem icon={Route} to="/tidx" label="Tidx Sopningar" />

<SidebarItem icon={Home} to="/egna" label="Egna Områden" />

<SidebarItem icon={Truck} to="/optimal" label="Optimal Områden" />

<SidebarItem icon={Folder} to="/tmm" label="Sopningar TMM" />

<SidebarItem icon={Folder} to="/projects" label="Övriga Projekt" />

<SidebarItem icon={Route} to="/routes" label="Ruttplanering" />

<SidebarItem icon={MessageCircle} to="/chat" label="Chatt" />

<SidebarItem icon={Mic} to="/voice" label="Röstkanaler" />

<SidebarItem icon={Clock} to="/tidsrapport" label="Tidsrapport" />

</div>


{/* FOOTER */}

<div className="border-t border-zinc-200 p-4 text-xs text-zinc-500">

Christoffer Tegnander

</div>

</div>

)

}

function SidebarItem({ icon: Icon, label, to }:{
icon:any
label:string
to:string
}){

return(

<NavLink
to={to}
className={({isActive}) =>`

flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition

${isActive
? "bg-zinc-100 text-zinc-900"
: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}

`}
>

<Icon size={18}/>

{label}

</NavLink>

)

}
