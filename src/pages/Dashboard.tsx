import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { FleetMap } from "@/components/maps/FleetMap"

import { CalendarDays, Check, Timer, MapPin } from "lucide-react"
import { format, getISOWeek } from "date-fns"
import { sv } from "date-fns/locale"

interface Job {
  id: string
  name: string
  address: string
  date: string
  status: string
  lat?: number | null
  lng?: number | null
}

export default function Dashboard() {

  const [jobs,setJobs] = useState<Job[]>([])
  const [weeklyHours,setWeeklyHours] = useState(0)

  const today = format(new Date(),"yyyy-MM-dd")

  async function loadJobs(){

    const result:Job[] = []

    try{

      const tables = [
        {table:"projects",date:"datum_planerat"},
        {table:"tidx_entries",date:"datum_planerat"},
        {table:"egna_entries",date:"datum_planerat"},
        {table:"tmm_entries",date:"datum"},
        {table:"optimal_entries",date:"datum_start"}
      ]

      for(const t of tables){

        const { data } = await supabase
          .from(t.table)
          .select("*")

        if(!data) continue

        data.forEach((row:any)=>{

          const d = row[t.date]
          if(!d) return

          result.push({
            id:`${t.table}-${row.id}`,
            name:
              row.name ||
              row.omrade ||
              row.beskrivning ||
              row.address ||
              "Uppdrag",
            address:row.address || "",
            status:row.status || "pending",
            date:String(d).slice(0,10),
            lat:row.lat ?? null,
            lng:row.lng ?? null
          })

        })

      }

      setJobs(result)

    }catch(err){

      console.error("JOB LOAD ERROR",err)

    }

  }

  useEffect(()=>{
    loadJobs()
  },[])

  useEffect(()=>{

    async function loadHours(){

      const { data } = await supabase
        .from("user_time_entries")
        .select("hours")

      if(!data) return

      const total =
        data.reduce((sum:number,row:any)=>sum+(Number(row.hours)||0),0)

      setWeeklyHours(total)

    }

    loadHours()

  },[])

  const todayJobs = jobs.filter(j=>j.date===today)

  const done =
    todayJobs.filter(j=>j.status==="done").length

  const mapJobs =
    todayJobs.filter(j=>j.lat && j.lng)

  return(

<div className="space-y-6">

<div>

<h1 className="text-2xl font-semibold text-white">
Dashboard
</h1>

<p className="text-sm text-zinc-400">
{format(new Date(),"EEEE d MMMM",{locale:sv})}
</p>

</div>

<div className="grid grid-cols-3 gap-3">

<Stat
label="Uppdrag idag"
value={todayJobs.length}
icon={<CalendarDays size={16}/>}
/>

<Stat
label="Klara"
value={done}
icon={<Check size={16}/>}
/>

<Stat
label={`v.${getISOWeek(new Date())}`}
value={`${weeklyHours.toFixed(1)}h`}
icon={<Timer size={16}/>}
/>

</div>

{mapJobs.length>0 && (

<div className="rounded-xl overflow-hidden border border-white/10">

<FleetMap jobs={mapJobs}/>

</div>

)}

<div className="space-y-2">

{todayJobs.map(job=>(

<div
key={job.id}
className="bg-zinc-800 border border-white/10 p-3 rounded-xl flex justify-between"
>

<div>

<p className="text-white text-sm font-medium">
{job.name}
</p>

<a
href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address)}`}
target="_blank"
className="text-xs text-zinc-400 flex items-center gap-1"
>

<MapPin size={12}/>
{job.address || "Adress saknas"}

</a>

</div>

<span className="text-[10px] px-2 py-1 rounded bg-primary/10">
{job.status}
</span>

</div>

))}

</div>

</div>

)

}

function Stat({label,value,icon}:{label:string,value:any,icon:any}){

return(

<div className="bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between">

<div>

<p className="text-[10px] text-zinc-400 uppercase">
{label}
</p>

<p className="text-lg text-white font-semibold">
{value}
</p>

</div>

<div className="bg-primary/10 p-2 rounded-lg">
{icon}
</div>

</div>

)

}
