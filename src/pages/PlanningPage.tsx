import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Navigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CalendarDays } from "lucide-react"

import {
format,
startOfMonth,
endOfMonth,
eachDayOfInterval,
isSameDay,
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

interface PlanningItem {

id:string
type:EntryType
title:string
date:string
status:string

}

export default function PlanningPage(){

const { user } = useAuth()

const [items,setItems] = useState<PlanningItem[]>([])
const [currentMonth,setCurrentMonth] = useState(new Date())
const [selectedDay,setSelectedDay] = useState<Date | null>(null)
const [editingItem,setEditingItem] = useState<PlanningItem | null>(null)
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

const loadItems = useCallback(async()=>{

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
.select("id,name,datum_planerat,status"),

supabase
.from("optimal_entries")
.select("id,name,datum_start,status"),

supabase
.from("tmm_entries")
.select("id,address,beskrivning,datum,status,foretag")

])

const result:PlanningItem[] = []

tidxRes.data?.forEach(r=>{

if(!r.datum_planerat) return

result.push({

id:r.id,
type:"tidx",
title:`${r.omrade} – ${r.address?.split(",")[0]}`,
date:r.datum_planerat.slice(0,10),
status:r.status

})

})

egnaRes.data?.forEach(r=>{

if(!r.datum_planerat) return

result.push({

id:r.id,
type:"egna",
title:r.address?.split(",")[0],
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
date:r.datum_planerat.slice(0,10),
status:r.status

})

})

optimalRes.data?.forEach(r=>{

if(!r.datum_start) return

result.push({

id:r.id,
type:"optimal",
title:r.name,
date:r.datum_start.slice(0,10),
status:r.status

})

})

tmmRes.data?.forEach(r=>{

if(!r.datum) return

result.push({

id:r.id,
type:"tmm",
title:`${r.foretag ?? "TMM"} – ${(r.address ?? r.beskrivning)?.split(",")[0]}`,
date:r.datum.slice(0,10),
status:r.status

})

})

setItems(result)

},[])

useEffect(()=>{

loadItems()

},[loadItems])

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

if(isAdmin === null) return null
if(!isAdmin) return <Navigate to="/" replace/>

return(

<div className="space-y-6 pb-24">

{/* Header */}

<div className="flex justify-between items-center">

<h1 className="text-2xl font-bold flex gap-2 items-center">

<CalendarDays className="w-6 h-6"/>

Planering

</h1>

<div className="flex gap-3">

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

{/* Calendar */}

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
className="min-h-[110px] border border-border/40 p-1 cursor-pointer"
>

<div className="text-xs font-semibold mb-1">

{day.getDate()}

</div>

<div className="space-y-[2px]">

{dayItems.map(item=>(

<div
key={item.id}
className="text-[9px] px-1 py-[2px] rounded bg-emerald-600/30 truncate"
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

{/* Day details */}

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
onClick={()=>setEditingItem(item)}
className="border rounded-lg p-3 cursor-pointer hover:bg-accent"
>

<p className="text-sm font-medium">

{item.title}

</p>

<p className="text-xs text-muted-foreground">

{item.type}

</p>

</div>

))}

</CardContent>

</Card>

)}

{/* Edit dialog */}

{editingItem && (

<Dialog open onOpenChange={()=>setEditingItem(null)}>

<DialogContent>

<DialogHeader>

<DialogTitle>Redigera uppdrag</DialogTitle>

</DialogHeader>

<Input
value={editingItem.title}
onChange={(e)=>
setEditingItem({
...editingItem,
title:e.target.value
})
}
/>

<Button
className="mt-3"
onClick={async()=>{

if(editingItem.type==="project"){

await supabase
.from("projects")
.update({name:editingItem.title})
.eq("id",editingItem.id)

}

if(editingItem.type==="egna"){

await supabase
.from("egna_entries")
.update({address:editingItem.title})
.eq("id",editingItem.id)

}

if(editingItem.type==="tidx"){

await supabase
.from("tidx_entries")
.update({address:editingItem.title})
.eq("id",editingItem.id)

}

loadItems()

setEditingItem(null)

}}
>

Spara

</Button>

</DialogContent>

</Dialog>

)}

</div>

)

}
