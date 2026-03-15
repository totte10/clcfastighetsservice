import { useState, useEffect, useMemo, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { DashboardWorkerMap } from "@/components/DashboardWorkerMap"

import {
CalendarDays,
Play,
Check,
Timer,
MapPin
} from "lucide-react"

import { format, addDays, getISOWeek } from "date-fns"
import { sv } from "date-fns/locale"

interface Job{
id:string
name:string
address:string
date:string
status:string
lat?:number
lng?:number
source:string
}

export default function Dashboard(){

const [jobs,setJobs] = useState<Job[]>([])
const [weeklyHours,setWeeklyHours] = useState(0)

const today = format(new Date(),"yyyy-MM-dd")

/* LOAD JOBS */

const loadJobs = useCallback(async()=>{

const [projects,tidx,egna,tmm,optimal] = await Promise.all([

supabase.from("projects").select("*"),
supabase.from("tidx_entries").select("*"),
supabase.from("egna_entries").select("*"),
supabase.from("tmm_entries").select("*"),
supabase.from("optimal_entries").select("*")

])

const result:Job[]=[]

projects.data?.forEach((p:any)=>{
if(!p.datum_planerat) return

result.push({
id:`project-${p.id}`,
name:p.name || "Projekt",
address:p.address || "",
status:p.status || "pending",
date:String(p.datum_planerat).slice(0,10),
lat:p.lat,
lng:p.lng,
source:"project"
})
})

tidx.data?.forEach((t:any)=>{
if(!t.datum_planerat) return

result.push({
id:`tidx-${t.id}`,
name:t.omrade || t.address,
address:t.address || "",
status:t.status || "pending",
date:String(t.datum_planerat).slice(0,10),
lat:t.lat,
lng:t.lng,
source:"tidx"
})
})

egna.data?.forEach((e:any)=>{
if(!e.datum_planerat) return

result.push({
id:`egna-${e.id}`,
name:e.address,
address:e.address,
status:"pending",
date:String(e.datum_planerat).slice(0,10),
lat:e.lat,
lng:e.lng,
source:"egna"
})
})

tmm.data?.forEach((t:any)=>{
if(!t.datum) return

result.push({
id:`tmm-${t.id}`,
name:t.beskrivning || t.address,
address:t.address || "",
status:t.status || "pending",
date:String(t.datum).slice(0,10),
lat:t.lat,
lng:t.lng,
source:"tmm"
})
})

optimal.data?.forEach((o:any)=>{
if(!o.datum_start) return

result.push({
id:`optimal-${o.id}`,
name:o.name,
address:o.address,
status:o.status || "pending",
date:String(o.datum_start).slice(0,10),
lat:o.lat,
lng:o.lng,
source:"optimal"
})
})

setJobs(result)

},[])

useEffect(()=>{loadJobs()},[loadJobs])

/* HOURS */

useEffect(()=>{

async function loadHours(){

const { data } = await supabase
.from("user_time_entries")
.select("hours")

const total =
(data ?? []).reduce((s:any,r:any)=>s+(Number(r.hours)||0),0)

setWeeklyHours(total)

}

loadHours()

},[])

/* TODAY JOBS */

const todayJobs = jobs.filter(j=>j.date===today)

const done = todayJobs.filter(j=>j.status==="done").length
const started = todayJobs.filter(j=>j.status==="in-progress").length

const progress =
todayJobs.length>0
? Math.round(done/todayJobs.length*100)
:0

/* AI ROUTE */

const mapJobs = useMemo(()=>{

const jobsWithCoords = todayJobs.filter(j=>j.lat && j.lng)

if(jobsWithCoords.length<=1) return jobsWithCoords

const remaining=[...jobsWithCoords]
const route=[remaining.shift()!]

while(remaining.length){

const last=route[route.length-1]

let nearestIndex=0
let shortest=Infinity

remaining.forEach((j,i)=>{

const dx=last.lat!-j.lat!
const dy=last.lng!-j.lng!

const dist=Math.sqrt(dx*dx+dy*dy)

if(dist<shortest){
shortest=dist
nearestIndex=i
}

})

route.push(remaining.splice(nearestIndex,1)[0])

}

return route

},[todayJobs])

/* WEEK STRIP */

const weekDays = Array.from({length:7}).map((_,i)=>{

const d=addDays(new Date(),i-3)

const str=format(d,"yyyy-MM-dd")

const count=jobs.filter(j=>j.date===str).length

return{date:d,count}

})

return(

<div className="relative min-h-screen pb-28">

<div className="space-y-4 bg-zinc-800 p-5 rounded-xl">

{/* HEADER */}

<div>

<h1 className="text-xl font-semibold text-white">
Arbete idag
</h1>

<p className="text-xs text-zinc-400">
{format(new Date(),"EEEE d MMMM",{locale:sv})}
</p>

</div>

{/* PROGRESS */}

<div className="rounded-xl border border-white/5 bg-white/[0.04] p-3">

<p className="text-xs mb-1 text-zinc-300">
Dagens framsteg
</p>

<div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">

<div
className="h-full bg-primary"
style={{width:`${progress}%`}}
/>

</div>

<p className="text-[10px] mt-1 text-right text-zinc-400">
{progress}%
</p>

</div>

{/* STATS */}

<div className="grid grid-cols-2 gap-3">

<Stat label="Totalt" value={todayJobs.length} icon={<CalendarDays size={16}/>}/>
<Stat label="Påbörjade" value={started} icon={<Play size={16}/>}/>
<Stat label="Klara" value={done} icon={<Check size={16}/>}/>
<Stat label={`v.${getISOWeek(new Date())}`} value={`${weeklyHours.toFixed(1)}h`} icon={<Timer size={16}/>}/>

</div>

{/* WEEK */}

<div className="flex gap-2 overflow-x-auto">

{weekDays.map((d,i)=>(

<div key={i} className="min-w-[60px] rounded-xl border border-white/5 bg-white/[0.04] px-2 py-2 text-center">

<p className="text-[9px] text-zinc-400">
{format(d.date,"EEE",{locale:sv})}
</p>

<p className="text-sm font-semibold">
{format(d.date,"d")}
</p>

<p className="text-[10px] text-zinc-300">
{d.count}
</p>

</div>

))}

</div>

{/* MAP */}

{mapJobs.length>0 && <DashboardWorkerMap jobs={mapJobs}/>}

{/* JOB LIST */}

<div className="space-y-2">

{mapJobs.map(job=>(

<div key={job.id} className="rounded-xl border border-white/5 bg-white/[0.04] p-3 flex justify-between items-center">

<div>

<p className="font-medium text-white">
{job.name}
</p>

<p className="text-xs text-zinc-400 flex items-center gap-1">
<MapPin size={12}/>
{job.address}
</p>

</div>

<span className="text-[10px] px-2 py-1 rounded bg-primary/10">
{job.status}
</span>

</div>

))}

</div>

</div>

</div>

)

}

function Stat({label,value,icon}:{label:string,value:any,icon:any}){

return(

<div className="rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2.5 flex items-center justify-between">

<div>

<p className="text-[9px] uppercase text-zinc-400">
{label}
</p>

<p className="text-lg font-semibold text-white">
{value}
</p>

</div>

<div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
{icon}
</div>

</div>

)

}