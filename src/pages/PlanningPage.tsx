import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Navigate } from "react-router-dom"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
| "tidx"
| "egna"
| "project"
| "optimal"
| "tmm"

interface PlanningItem {
id:string
type:EntryType
title:string
address:string
date:string
status:string
project_number?:string
}

function color(type:EntryType){

switch(type){

case "tidx":
return "bg-blue-500"

case "egna":
return "bg-emerald-500"

case "optimal":
return "bg-purple-500"

case "tmm":
return "bg-orange-500"

default:
return "bg-cyan-500"

}

}

function tableFromType(type:EntryType){

switch(type){

case "tidx":
return "tidx_entries"

case "egna":
return "egna_entries"

case "project":
return "projects"

case "optimal":
return "optimal_entries"

case "tmm":
return "tmm_entries"

}

}

export default function PlanningPage(){

const { user } = useAuth()

const [items,setItems] = useState<PlanningItem[]>([])
const [selectedDay,setSelectedDay] = useState<Date | null>(null)
const [currentMonth,setCurrentMonth] = useState(new Date())

const [editing,setEditing] = useState<PlanningItem | null>(null)
const [creating,setCreating] = useState(false)

const [form,setForm] = useState({
name:"",
address:"",
date:"",
project_number:""
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

async function loadItems(){

const [

tidxRes,
egnaRes,
projRes,
optimalRes,
tmmRes

] = await Promise.all([

supabase
.from("tidx_entries")
.select("id,omrade,address,datum_planerat,status"),

supabase
.from("egna_entries")
.select("id,address,datum_planerat"),

supabase
.from("projects")
.select("id,name,address,datum_planerat,status,project_number"),

supabase
.from("optimal_entries")
.select("id,name,datum_start,status"),

supabase
.from("tmm_entries")
.select("id,address,beskrivning,datum,status")

])

const result:PlanningItem[] = []

tidxRes.data?.forEach(r=>{
if(!r.datum_planerat) return
result.push({
id:r.id,
type:"tidx",
title:r.omrade,
address:r.address ?? "",
date:r.datum_planerat.slice(0,10),
status:r.status
})
})

egnaRes.data?.forEach(r=>{
if(!r.datum_planerat) return
result.push({
id:r.id,
type:"egna",
title:r.address,
address:r.address,
date:r.datum_planerat.slice(0,10),
status:"pending"
})
})

projRes.data?.forEach(r=>{
if(!r.datum_planerat) return
result.push({
id:r.id,
type:"project",
title:r.name,
address:r.address ?? "",
date:r.datum_planerat.slice(0,10),
status:r.status,
project_number:r.project_number
})
})

optimalRes.data?.forEach(r=>{
if(!r.datum_start) return
result.push({
id:r.id,
type:"optimal",
title:r.name,
address:"",
date:r.datum_start.slice(0,10),
status:r.status
})
})

tmmRes.data?.forEach(r=>{
if(!r.datum) return
result.push({
id:r.id,
type:"tmm",
title:r.beskrivning,
address:r.address ?? "",
date:r.datum.slice(0,10),
status:r.status
})
})

setItems(result)

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
.from(tableFromType(editing.type))
.update({
name:form.name,
address:form.address,
project_number:form.project_number,
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
datum_planerat:form.date
})

await loadItems()
setCreating(false)

}

return(

<div className="space-y-6 pb-32">

<div className="flex justify-between items-center">

<div className="flex items-center gap-3">

<CalendarDays className="w-7 h-7 text-emerald-400"/>

<h1 className="text-3xl font-semibold">
Planering
</h1>

</div>

<div className="flex items-center gap-3">

<Button
variant="ghost"
onClick={()=>setCurrentMonth(subMonths(currentMonth,1))}
>
←
</Button>

<h2 className="text-lg font-medium">
{format(currentMonth,"MMMM yyyy",{locale:sv})}
</h2>

<Button
variant="ghost"
onClick={()=>setCurrentMonth(addMonths(currentMonth,1))}
>
→
</Button>

<Button
className="bg-emerald-500 hover:bg-emerald-600"
onClick={()=>{

setCreating(true)

setForm({
name:"",
address:"",
date:format(new Date(),"yyyy-MM-dd"),
project_number:""
})

}}
>

Nytt uppdrag

</Button>

</div>

</div>

<div className="grid grid-cols-7 gap-3 text-center text-sm text-white/40">

{["Mån","Tis","Ons","Tor","Fre","Lör","Sön"].map(d=>(
<div key={d}>{d}</div>
))}

</div>

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

<div className="text-sm mb-2 font-medium">
{day.getDate()}
</div>

<div className="space-y-1">

{dayItems.slice(0,3).map(item=>(

<div
key={item.id}
className="flex items-center gap-2 text-xs truncate"
>

<div className={`w-2 h-2 rounded-full ${color(item.type)}`} />

<span className="truncate">{item.title}</span>

</div>

))}

{dayItems.length > 3 && (

<div className="text-xs text-white/40">

+{dayItems.length-3} fler

</div>

)}

</div>

</Card>

)

})}

</div>

{selectedDay && (

<Card className="bg-[#071226] border border-white/5 p-5">

<h2 className="text-lg font-semibold mb-4">

{format(selectedDay,"EEEE d MMMM yyyy",{locale:sv})}

</h2>

<div className="space-y-3">

{selectedItems.map(item=>(

<div
key={item.id}
onClick={()=>{

setEditing(item)

setForm({
name:item.title,
address:item.address,
date:item.date,
project_number:item.project_number ?? ""
})

}}
className="p-4 rounded-xl border border-white/5 hover:border-emerald-500/40 cursor-pointer"
>

<p className="font-medium">
{item.title}
</p>

<p className="text-xs text-white/50">
{item.address}
</p>

</div>

))}

</div>

</Card>

)}

{editing && (

<Dialog open onOpenChange={()=>setEditing(null)}>

<DialogContent className="space-y-4">

<DialogHeader>

<DialogTitle>
Redigera uppdrag
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

<Input
type="date"
value={form.date}
onChange={e=>setForm({...form,date:e.target.value})}
/>

<Button
className="bg-emerald-500 hover:bg-emerald-600"
onClick={saveEdit}
>

Spara ändringar

</Button>

</DialogContent>

</Dialog>

)}

{creating && (

<Dialog open onOpenChange={()=>setCreating(false)}>

<DialogContent className="space-y-4">

<DialogHeader>

<DialogTitle>
Nytt uppdrag
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

<Input
type="date"
value={form.date}
onChange={e=>setForm({...form,date:e.target.value})}
/>

<Button
className="bg-emerald-500 hover:bg-emerald-600"
onClick={createJob}
>

Skapa uppdrag

</Button>

</DialogContent>

</Dialog>

)}

</div>

)

}
