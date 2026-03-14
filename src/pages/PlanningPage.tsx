import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { sv } from "date-fns/locale";

type EntryType = "tidx" | "egna" | "project" | "optimal" | "tmm";

interface PlanningItem {
  id: string;
  type: EntryType;
  title: string;
  date: string;
  status: string;
}

export default function PlanningPage() {

  const { user } = useAuth()

  const [items,setItems] = useState<PlanningItem[]>([])
  const [currentMonth,setCurrentMonth] = useState(new Date())
  const [selectedDay,setSelectedDay] = useState<Date|null>(null)
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
        .select("id,address,datum_planerat,blow_status,sweep_status"),

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

    ;(tidxRes.data ?? []).forEach(r=>{

      if(!r.datum_planerat) return

      result.push({
        id:r.id,
        type:"tidx",
        title:`${r.omrade} – ${r.address}`,
        date:r.datum_planerat,
        status:r.status
      })

    })

    ;(egnaRes.data ?? []).forEach(r=>{

      if(!r.datum_planerat) return

      result.push({
        id:r.id,
        type:"egna",
        title:r.address,
        date:r.datum_planerat,
        status:"pending"
      })

    })

    ;(projRes.data ?? []).forEach(r=>{

      if(!r.datum_planerat) return

      result.push({
        id:r.id,
        type:"project",
        title:r.name,
        date:r.datum_planerat,
        status:r.status
      })

    })

    ;(optimalRes.data ?? []).forEach(r=>{

      if(!r.datum_start) return

      result.push({
        id:r.id,
        type:"optimal",
        title:r.name,
        date:r.datum_start,
        status:r.status
      })

    })

    ;(tmmRes.data ?? []).forEach(r=>{

      if(!r.datum) return

      result.push({
        id:r.id,
        type:"tmm",
        title:`${r.foretag ?? "TMM"} – ${r.address ?? r.beskrivning}`,
        date:r.datum,
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

  if(isAdmin===null) return null
  if(!isAdmin) return <Navigate to="/" replace/>

  return(

<div className="space-y-6">

<div className="flex justify-between items-center">

<h1 className="text-2xl font-bold flex gap-2 items-center">

<CalendarDays className="w-6 h-6"/>

Planering

</h1>

<div className="flex gap-2">

<button onClick={()=>setCurrentMonth(subMonths(currentMonth,1))}>
←
</button>

<button onClick={()=>setCurrentMonth(addMonths(currentMonth,1))}>
→
</button>

</div>

</div>

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
className="min-h-[100px] border p-2 cursor-pointer"
>

<div className="text-xs font-bold">

{day.getDate()}

</div>

<div className="space-y-1">

{dayItems.slice(0,3).map(i=>(

<div
key={i.id}
className="text-[10px] px-1 py-[2px] rounded bg-primary/20"
>

{i.title}

</div>

))}

</div>

</div>

)

})}

</div>

</CardContent>

</Card>

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
className="flex justify-between items-center border rounded p-2"
>

<div>

<p className="text-sm font-medium">

{item.title}

</p>

<p className="text-xs text-muted-foreground">

{item.type}

</p>

</div>

</div>

))}

</CardContent>

</Card>

)}

</div>

)

}
