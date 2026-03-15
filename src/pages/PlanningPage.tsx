import { useState,useEffect,useMemo } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Navigate } from "react-router-dom"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle
} from "@/components/ui/dialog"

import { CalendarDays } from "lucide-react"

import {
format,
startOfMonth,
endOfMonth,
eachDayOfInterval,
addMonths,
subMonths,
isToday
} from "date-fns"

import { sv } from "date-fns/locale"

type EntryType =
| "project"

interface PlanningItem{
id:string
title:string
address:string
date:string
project_number?:string
project_type?:string
worker_id?:string
}

export default function PlanningPage(){

const { user } = useAuth()

const [items,setItems] = useState<PlanningItem[]>([])
const [workers,setWorkers] = useState<any[]>([])

const [selectedDay,setSelectedDay] = useState<Date | null>(new Date())
const [currentMonth,setCurrentMonth] = useState(new Date())

const [editing,setEditing] = useState<PlanningItem | null>(null)
const [creating,setCreating] = useState(false)

const [form,setForm] = useState({
name:"",
address:"",
date:"",
project_number:"",
project_type:"",
worker_id:""
})

const [isAdmin,setIsAdmin] = useState<boolean | null>(null)

useEffect(()=>{

if(!user) return

supabase
.from("user_roles")
.select("role")
.eq("user_id",user.id)
.eq("role","admin")
.maybeSingle()
.then(({data})=>{
setIsAdmin(!!data)
})

},[user])

useEffect(()=>{

supabase
.from("profiles")
.select("id,full_name")
.then(({data})=>{
setWorkers(data ?? [])
})

},[])

async function loadItems(){

const {data} = await supabase
.from("projects")
.select("*")

if(!data) return

setItems(
data.map(p=>({

id:p.id,
title:p.name,
address:p.address ?? "",
date:p.datum_planerat?.slice(0,10),
project_number:p.project_number,
project_type:p.project_type,
worker_id:p.worker_id

}))
)

}

useEffect(()=>{
loadItems()
},[])

const monthStart = startOfMonth(currentMonth)
const monthEnd = endOfMonth(currentMonth)

const days = eachDayOfInterval({
start:monthStart,
end:monthEnd
})

const itemsByDate = useMemo(()=>{

const map = new Map<string,PlanningItem[]>()

items.forEach(i=>{
const arr = map.get(i.date) ?? []
arr.push(i)
map.set(i.date,arr)
})

return map

},[items])

const selectedItems = useMemo(()=>{

if(!selectedDay) return []

const key = format(selectedDay,"yyyy-MM-dd")

return itemsByDate.get(key) ?? []

},[selectedDay,itemsByDate])

if(isAdmin===null) return null
if(!isAdmin) return <Navigate to="/" replace />

async function saveEdit(){

if(!editing) return

await supabase
.from("projects")
.update({

name:form.name,
address:form.address,
project_number:form.project_number,
project_type:form.project_type,
worker_id:form.worker_id,
datum_planerat:form.date

})
.eq("id",editing.id)

await loadItems()
setEditing(null)

}

async function createJob(){

await supabase
.from("projects")
.insert({

name:form.name,
address:form.address,
project_number:form.project_number,
project_type:form.project_type,
worker_id:form.worker_id,
datum_planerat:form.date

})

await loadItems()
setCreating(false)

}

function workerName(id?:string){

const w = workers.find(w=>w.id===id)

return w?.full_name ?? ""

}

return(

<div className="space-y-8 pb-32">

{/* HEADER */}

<div className="flex justify-between items-center">

<div className="flex items-center gap-3">

<CalendarDays className="w-7 h-7 text-emerald-400"/>

<h1 className="text-3xl font-semibold">

Projektplanering

</h1>

</div>

<div className="flex items-center gap-2">

<Button
variant="ghost"
onClick={()=>setCurrentMonth(subMonths(currentMonth,1))}
>
←
</Button>

<h2 className="text-lg font-medium w-32 text-center">

{format(currentMonth,"MMMM yyyy",{locale:sv})}

</h2>

<Button
variant="ghost"
onClick={()=>setCurrentMonth(addMonths(currentMonth,1))}
>
→
</Button>

<Button
className="bg-emerald-500 hover:bg-emerald-600 ml-3"
onClick={()=>{

setCreating(true)

setForm({
name:"",
address:"",
date:format(new Date(),"yyyy-MM-dd"),
project_number:"",
project_type:"",
worker_id:""
})

}}
>

Nytt uppdrag

</Button>

</div>

</div>

{/* WEEKDAYS */}

<div className="grid grid-cols-7 text-center text-xs text-white/40">

{["Mån","Tis","Ons","Tor","Fre","Lör","Sön"].map(d=>
<div key={d}>{d}</div>
)}

</div>

{/* CALENDAR */}

<div className="grid grid-cols-7 gap-3">

{days.map(day=>{

const key = format(day,"yyyy-MM-dd")
const dayItems = itemsByDate.get(key) ?? []

return(

<Card
key={key}
onClick={()=>setSelectedDay(day)}
className={`p-3 h-28 cursor-pointer border border-white/5 hover:border-emerald-500/40 transition
${isToday(day) ? "bg-emerald-500/10 border-emerald-500/40" : "bg-[#071226]"}`}
>

<div className="text-sm font-medium mb-1">

{day.getDate()}

</div>

<div className="space-y-1">

{dayItems.slice(0,2).map(item=>

<div
key={item.id}
className="text-[11px] truncate"
>

{item.title}

</div>

)}

{dayItems.length > 2 &&

<div className="text-[10px] text-white/40">

+{dayItems.length-2}

</div>

}

</div>

</Card>

)

})}

</div>

{/* SELECTED DAY */}

{selectedDay &&

<Card className="bg-[#071226] border border-white/5 p-6">

<h2 className="text-lg font-semibold mb-4">

{format(selectedDay,"EEEE d MMMM yyyy",{locale:sv})}

</h2>

<div className="space-y-3">

{selectedItems.map(item=>

<div
key={item.id}
onClick={()=>{

setEditing(item)

setForm({

name:item.title,
address:item.address,
date:item.date,
project_number:item.project_number ?? "",
project_type:item.project_type ?? "",
worker_id:item.worker_id ?? ""

})

}}
className="p-4 rounded-xl border border-white/5 hover:border-emerald-500/40 cursor-pointer"
>

<div className="flex justify-between items-center">

<p className="font-medium">

{item.title}

</p>

<div className="flex gap-2 text-[10px]">

{item.project_type &&

<span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded">

{item.project_type}

</span>

}

{item.worker_id &&

<span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">

{workerName(item.worker_id)}

</span>

}

</div>

</div>

<p className="text-xs text-white/50">

{item.address}

</p>

</div>

)}

</div>

</Card>

}

{/* DIALOG */}

{(editing || creating) &&

<Dialog open onOpenChange={()=>{

setEditing(null)
setCreating(false)

}}>

<DialogContent className="space-y-4">

<DialogHeader>

<DialogTitle>

{editing ? "Redigera uppdrag" : "Nytt uppdrag"}

</DialogTitle>

</DialogHeader>

<Input
placeholder="Namn"
value={form.name}
onChange={e=>setForm({...form,name:e.target.value})}
/>

<Input
placeholder="Adress"
value={form.address}
onChange={e=>setForm({...form,address:e.target.value})}
/>

<Input
placeholder="Projektnummer"
value={form.project_number}
onChange={e=>setForm({...form,project_number:e.target.value})}
/>

<select
value={form.project_type}
onChange={e=>setForm({...form,project_type:e.target.value})}
className="w-full p-2 rounded-md bg-black border border-white/10"
>

<option value="">Projekttyp</option>
<option value="egna">Egna</option>
<option value="tidx">Tidx</option>
<option value="optimal">Optimal</option>
<option value="tmm">TMM</option>

</select>

<select
value={form.worker_id}
onChange={e=>setForm({...form,worker_id:e.target.value})}
className="w-full p-2 rounded-md bg-black border border-white/10"
>

<option value="">Arbetare</option>

{workers.map(w=>

<option key={w.id} value={w.id}>

{w.full_name}

</option>

)}

</select>

<Input
type="date"
value={form.date}
onChange={e=>setForm({...form,date:e.target.value})}
/>

<Button
className="bg-emerald-500 hover:bg-emerald-600"
onClick={editing ? saveEdit : createJob}
>

{editing ? "Spara ändringar" : "Skapa uppdrag"}

</Button>

</DialogContent>

</Dialog>

}

</div>

)

}
