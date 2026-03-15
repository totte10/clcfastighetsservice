import {
Sidebar,
SidebarContent,
SidebarHeader,
SidebarMenu,
SidebarMenuItem,
SidebarMenuButton
} from "@/components/ui/sidebar"

import { NavLink } from "react-router-dom"
import { useState } from "react"

import {
LayoutDashboard,
Wind,
Home,
Truck,
Folder,
Route,
Map,
ChevronDown,
ChevronRight,
MessageCircle,
Mic,
Clock,
Calendar
} from "lucide-react"

export function AppSidebar(){

const [open,setOpen] = useState(true)

return(

<Sidebar className="bg-white border-r border-zinc-200">

{/* HEADER */}

<SidebarHeader className="border-b border-zinc-200 px-4 py-4">

<div className="flex items-center gap-3 ml-1">

<img
src="/lovable-uploads/f50fb16e-0a0e-4157-a6a4-ac098b2d14fb.png"
className="h-9 w-9"
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

</SidebarHeader>


{/* MENU */}

<SidebarContent>

<SidebarMenu>

{/* DASHBOARD */}

<MenuItem icon={LayoutDashboard} to="/" label="Dashboard"/>

{/* DISPATCH */}

<MenuItem icon={Map} to="/dispatch" label="Dispatch Center"/>

{/* PLANNING */}

<MenuItem icon={Calendar} to="/planning" label="Planering"/>

{/* MASKINSOPNING GROUP */}

<SidebarMenuItem>

<button
onClick={()=>setOpen(!open)}
className="
flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm
text-zinc-700 hover:bg-zinc-100 transition
"
>

<Wind size={18}/>

<span className="flex-1 text-left">
Maskinsopning
</span>

{open ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}

</button>

</SidebarMenuItem>

{open && (

<div className="ml-6 space-y-1">

<MenuItem icon={Route} to="/tidx" label="Tidx Sopningar"/>

<MenuItem icon={Home} to="/egna" label="Egna områden"/>

<MenuItem icon={Truck} to="/optimal" label="Optimal områden"/>

<MenuItem icon={Folder} to="/tmm" label="Sopningar TMM"/>

<MenuItem icon={Folder} to="/projects" label="Övriga projekt"/>

</div>

)}

{/* ROUTE PLANNING */}

<MenuItem icon={Route} to="/route" label="Ruttplanering"/>

{/* CHAT */}

<MenuItem icon={MessageCircle} to="/chat" label="Chatt"/>

{/* VOICE */}

<MenuItem icon={Mic} to="/voice" label="Röstkanaler"/>

{/* TIME */}

<MenuItem icon={Clock} to="/time" label="Tidsrapport"/>

</SidebarMenu>

</SidebarContent>

</Sidebar>

)

}


function MenuItem({
icon:Icon,
label,
to
}:{icon:any,label:string,to:string}){

return(

<SidebarMenuItem>

<NavLink to={to}>

{({isActive})=>

<SidebarMenuButton
className={`
flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition

${isActive
? "bg-zinc-100 text-zinc-900"
: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}
`}
>

<Icon size={18}/>

{label}

</SidebarMenuButton>

}

</NavLink>

</SidebarMenuItem>

)

}
