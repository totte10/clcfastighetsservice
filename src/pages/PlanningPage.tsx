import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Navigate } from "react-router-dom"

import { Card, CardContent } from "@/components/ui/card"
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
return "bg-blue-500/20 text-blue-300"

case "egna":
return "bg-emerald-500/20 text-emerald-300"

case "optimal":
return "bg-purple-500/20 text-purple-300"

case "tmm":
return "bg-orange-500/20 text-orange-300"

default:
return "bg-cyan-500/20 text-cyan-300"

}

}


export default function PlanningPage(){

const { user } = useAuth()

const [items,setItems] = useState<PlanningItem[]>([])
const [workers,setWorkers] = useState<any[]>([])

const [selectedDay,setSelectedDay] = useState<Date | null>(null)
const [currentMonth,setCurrentMonth] = useState(new Date())

const [editing,setEditing] = useState<PlanningItem | null>(null)
const [creating,setCreating] = useState(false)

const [form,setForm] = useState({
name:"",
address:"",
date:"",
project_number:"",
worker:""
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
.from("projects")
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

<div className="space-y-6 pb-24">


<div className="flex justify-between items-center">

<h1 className="text-2xl font-bold flex gap-2 items-center">

<CalendarDays className="w-6 h-6 text-emerald-400"/>

Planering

</h1>


<div className="flex gap-2">

<Button
variant="ghost"
onClick={()=>setCurrentMonth(subMonths(currentMonth,1))}
>
←
</Button>

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
project_number:"",
worker:""
})

}}
>

Nytt uppdrag

</Button>

</div>

</div>



<Card className="bg-[#071226] border-white/5">

<CardContent className="p-4">

<div className="grid grid-cols-7 gap-2">

{days.map(day=>{

const key = format(day,"yyyy-MM-dd")
const dayItems = itemsByDate.get(key) ?? []

return(

<div
key={key}
onClick={()=>setSelectedDay(day)}
className="h-24 rounded-xl border border-white/5 p-2 hover:bg-white/5 cursor-pointer flex flex-col"
>

<div
className={`w-7 h-7 flex items-center justify-center rounded-full text-xs mb-1
${isToday(day) ? "bg-emerald-500 text-black" : "text-white/70"}
`}
>
{day.getDate()}
</div>

<div className="space-y-[2px]">

{dayItems.slice(0,2).map(item=>(

<div
key={item.id}
className={`text-[10px] px-2 py-[3px] rounded-full truncate ${color(item.type)}`}
>

{item.title}

</div>

))}

{dayItems.length > 2 && (
<div className="text-[10px] text-white/40">
+{dayItems.length-2}
</div>
)}

</div>

</div>

)

})}

</div>

</CardContent>

</Card>



{selectedDay && (

<Card className="bg-[#071226] border-white/5">

<CardContent className="space-y-3 p-4">

<h2 className="font-semibold text-lg">
{format(selectedDay,"EEEE d MMMM yyyy",{locale:sv})}
</h2>

{selectedItems.map(item=>(

<div
key={item.id}
onClick={()=>{

setEditing(item)

setForm({
name:item.title,
address:item.address,
date:item.date,
project_number:item.project_number ?? "",
worker:""
})

}}
className="p-3 rounded-xl border border-white/5 hover:bg-white/5 cursor-pointer"
>

<p className="font-medium">
{item.title}
</p>

<p className="text-xs text-white/50">
{item.address}
</p>

</div>

))}

</CardContent>

</Card>

)}



{editing && (

<Dialog open onOpenChange={()=>setEditing(null)}>

<DialogContent className="space-y-4">

<DialogHeader>
<DialogTitle>Redigera uppdrag</DialogTitle>
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
<DialogTitle>Nytt uppdrag</DialogTitle>
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
