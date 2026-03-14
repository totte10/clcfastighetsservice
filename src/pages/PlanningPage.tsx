import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Navigate } from "react-router-dom"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
subMonths
} from "date-fns"

import { sv } from "date-fns/locale"


type EntryType =
| "tidx"
| "egna"
| "project"
| "optimal"
| "tmm"


interface PlanningItem{

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

const [selectedDay,setSelectedDay] = useState<Date|null>(null)
const [currentMonth,setCurrentMonth] = useState(new Date())

const [editing,setEditing] = useState<PlanningItem|null>(null)

const [form,setForm] = useState<any>({
name:"",
address:"",
date:"",
project_number:"",
worker:""
})

const [isAdmin,setIsAdmin] = useState<boolean|null>(null)



/* ADMIN CHECK */

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



/* LOAD WORKERS */

useEffect(()=>{

supabase
.from("profiles")
.select("id,full_name")
.then(({data})=>{

setWorkers(data ?? [])

})

},[])



/* LOAD ALL ENTRIES */

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



/* CALENDAR */

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
if(!isAdmin) return <Navigate to="/" replace/>



/* SAVE EDIT */

async function saveEdit(){

if(!editing) return

if(editing.type==="project"){

await supabase
.from("projects")
.update({
name:form.name,
address:form.address,
project_number:form.project_number,
datum_planerat:form.date
})
.eq("id",editing.id)

}

if(form.worker){

await supabase
.from("project_assignments")
.insert({
entry_id:editing.id,
entry_type:editing.type,
user_id:form.worker
})

}

await loadItems()

setEditing(null)

}



return(

<div className="space-y-6 pb-24">


{/* HEADER */}

<div className="flex justify-between items-center">

<h1 className="text-2xl font-bold flex gap-2 items-center">

<CalendarDays className="w-6 h-6"/>

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

</div>

</div>



{/* CALENDAR */}

<Card>

<CardContent className="p-0">

<div className="grid grid-cols-7">

{days.map(day=>{

const key = format(day,"yyyy-MM-dd")
const dayItems = itemsByDate.get(key) ?? []

return(

<div
key={key}
onClick={()=>setSelectedDay(day)}
className="min-h-[120px] border border-border/40 p-2 cursor-pointer hover:bg-accent/20"
>

<div className="text-xs font-semibold mb-2">
{day.getDate()}
</div>

<div className="space-y-1">

{dayItems.map(item=>(

<div
key={item.id}
className={`text-xs px-2 py-1 rounded truncate ${color(item.type)}`}
>

{item.title}

</div>

))}

</div>

</div>

)

})}

</div>

</CardContent>

</Card>



{/* DAY DETAILS */}

{selectedDay && (

<Card>

<CardHeader>

<CardTitle>

{format(selectedDay,"EEEE d MMMM",{locale:sv})}

</CardTitle>

</CardHeader>

<CardContent className="space-y-2">

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
className="border rounded-lg p-3 cursor-pointer hover:bg-accent"
>

<p className="font-medium">

{item.title}

</p>

<p className="text-xs text-muted-foreground">

{item.address}

</p>

</div>

))}

</CardContent>

</Card>

)}



{/* EDIT DIALOG */}

{editing && (

<Dialog open onOpenChange={()=>setEditing(null)}>

<DialogContent className="space-y-3">

<DialogHeader>

<DialogTitle>Redigera uppdrag</DialogTitle>

</DialogHeader>

<Input
placeholder="Namn"
value={form.name}
onChange={(e)=>setForm({...form,name:e.target.value})}
/>

<Input
placeholder="Adress"
value={form.address}
onChange={(e)=>setForm({...form,address:e.target.value})}
/>

<Input
placeholder="Projektnummer"
value={form.project_number}
onChange={(e)=>setForm({...form,project_number:e.target.value})}
/>

<Input
type="date"
value={form.date}
onChange={(e)=>setForm({...form,date:e.target.value})}
/>

<select
className="border rounded p-2"
value={form.worker}
onChange={(e)=>setForm({...form,worker:e.target.value})}
>

<option value="">Tilldela arbetare</option>

{workers.map(w=>(

<option key={w.id} value={w.id}>

{w.full_name}

</option>

))}

</select>


<Button onClick={saveEdit}>

Spara ändringar

</Button>

</DialogContent>

</Dialog>

)}

</div>

)

}
