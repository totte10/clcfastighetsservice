import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CalendarDays, CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

type EntryType = "project";

interface PlanningItem {
  id: string;
  title: string;
  date: string;
  status: string;
}

export default function PlanningPage() {

  const { user } = useAuth();
  const { toast } = useToast();

  const [items,setItems] = useState<PlanningItem[]>([]);
  const [workers,setWorkers] = useState<any[]>([]);
  const [selectedWorkers,setSelectedWorkers] = useState<string[]>([]);
  const [editing,setEditing] = useState<PlanningItem|null>(null);

  const [currentMonth,setCurrentMonth] = useState(new Date());
  const [selectedDay,setSelectedDay] = useState<Date|null>(null);

  const [isAdmin,setIsAdmin] = useState<boolean|null>(null);

  useEffect(()=>{

    if(!user) return;

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id",user.id)
      .eq("role","admin")
      .maybeSingle()
      .then(({data})=>setIsAdmin(!!data))

  },[user])


  useEffect(()=>{

    supabase
      .from("profiles")
      .select("id,full_name")
      .then(({data})=>{
        setWorkers(data ?? [])
      })

  },[])

  const loadItems = useCallback(async()=>{

    const {data} = await supabase
      .from("projects")
      .select("*")

    const mapped:PlanningItem[] = (data ?? []).map((p:any)=>({

      id:p.id,
      title:p.name,
      date:p.datum_planerat,
      status:p.status

    }))

    setItems(mapped)

  },[])

  useEffect(()=>{ loadItems() },[loadItems])


  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({start:monthStart,end:monthEnd})


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

    return itemsByDate.get(
      format(selectedDay,"yyyy-MM-dd")
    ) ?? []

  },[selectedDay,itemsByDate])


  const saveEdit = async()=>{

    if(!editing) return

    await supabase
      .from("projects")
      .update({
        name:editing.title
      })
      .eq("id",editing.id)

    await supabase
      .from("project_assignments")
      .delete()
      .eq("entry_id",editing.id)

    if(selectedWorkers.length){

      const rows = selectedWorkers.map(uid=>({

        entry_id:editing.id,
        entry_type:"project",
        user_id:uid

      }))

      await supabase
        .from("project_assignments")
        .insert(rows)

    }

    toast({title:"Uppdrag uppdaterat"})

    setEditing(null)

    loadItems()

  }


  if(isAdmin===null) return null
  if(!isAdmin) return <Navigate to="/" replace/>


  return(

<div className="space-y-6">

{/* header */}

<div className="flex justify-between">

<h1 className="text-2xl font-bold flex items-center gap-2">

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

<Badge>

{item.status}

</Badge>

</div>

<Button
variant="outline"
onClick={()=>{

setEditing(item)
setSelectedWorkers([])

}}
>

Redigera

</Button>

</div>

))}

</CardContent>

</Card>

)}


<Dialog open={!!editing} onOpenChange={()=>setEditing(null)}>

<DialogContent>

<DialogHeader>

<DialogTitle>Redigera uppdrag</DialogTitle>

</DialogHeader>

{editing && (

<div className="space-y-4">

<Input
value={editing.title}
onChange={e=>setEditing({
...editing,
title:e.target.value
})}
/>

<div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded">

{workers.map(w=>(

<label key={w.id} className="flex items-center gap-2 text-xs">

<Checkbox
checked={selectedWorkers.includes(w.id)}
onCheckedChange={(c)=>{

setSelectedWorkers(prev=>

c
? [...prev,w.id]
: prev.filter(id=>id!==w.id)

)

}}
/>

{w.full_name}

</label>

))}

</div>

<Button onClick={saveEdit}>

Spara

</Button>

</div>

)}

</DialogContent>

</Dialog>


</div>

)

}
