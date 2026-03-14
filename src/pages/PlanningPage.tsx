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

interface PlanningItem {

id:string
type:EntryType
title:string
address:string
date:string
status:string
project_number?:string

}

function getColor(type:EntryType){

switch(type){

case "tidx":
return "bg-blue-500/20 text-blue-300 border-blue-500/30"

case "egna":
return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"

case "optimal":
return "bg-purple-500/20 text-purple-300 border-purple-500/30"

case "tmm":
return "bg-orange-500/20 text-orange-300 border-orange-500/30"

default:
return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"

}

}

export default function PlanningPage(){

const { user } = useAuth()

const [items,setItems] = useState<PlanningItem[]>([])
const [workers,setWorkers] = useState<any[]>([])
const [selectedDay,setSelectedDay] = useState<Date|null>(null)
const [currentMonth,setCurrentMonth] = useState(new Date())

const [editing,setEditing] = useState<PlanningItem|null>(null)
const [creating,setCreating] = useState(false)

const [form,setForm] = useState<any>({
name:"",
address:"",
date:"",
project_number:"",
worker:""
})

const [isAdmin,setIsAdmin] = useState<boolean|null>(null)

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

supabase.from("tidx_entries").select("id,omrade,address,datum_planerat,status"),
supabase.from("egna_entries").select("id,address,datum_planerat"),
supabase.from("projects").select("id,name,address,datum_planerat,status,project_number"),
supabase.from("optimal_entries").select("id,name,datum_start,status"),
supabase.from("tmm_entries").select("id,address,beskrivning,datum,status")

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

return itemsByDate.get(key
