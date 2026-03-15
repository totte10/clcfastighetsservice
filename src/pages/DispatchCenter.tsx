import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/integrations/supabase/client"
import { DispatchMap } from "@/components/maps/DispatchMap"

interface Job{
id:string
name:string
address:string
lat:number
lng:number
status:string
}

interface Worker{
user_id:string
lat:number
lng:number
status?:string
}

export default function DispatchCenter(){

const [jobs,setJobs]=useState<Job[]>([])
const [workers,setWorkers]=useState<Worker[]>([])

useEffect(()=>{

loadJobs()
loadWorkers()

const channel=supabase
.channel("dispatch-live")
.on(
"postgres_changes",
{event:"*",schema:"public",table:"worker_locations"},
()=>loadWorkers()
)
.subscribe()

return()=>supabase.removeChannel(channel)

},[])

async function loadJobs(){

const [projects,tidx,egna,tmm,optimal] =
await Promise.all([

supabase.from("projects").select("*"),
supabase.from("tidx_entries").select("*"),
supabase.from("egna_entries").select("*"),
supabase.from("tmm_entries").select("*"),
supabase.from("optimal_entries").select("*")

])

const result:Job[]=[]

projects.data?.forEach((p:any)=>{
if(!p.lat||!p.lng) return
result.push({
id:`project-${p.id}`,
name:p.name || "Projekt",
address:p.address,
lat:p.lat,
lng:p.lng,
status:p.status || "pending"
})
})

tidx.data?.forEach((t:any)=>{
if(!t.lat||!t.lng) return
result.push({
id:`tidx-${t.id}`,
name:t.omrade || t.address,
address:t.address,
lat:t.lat,
lng:t.lng,
status:t.status || "pending"
})
})

egna.data?.forEach((e:any)=>{
if(!e.lat||!e.lng) return
result.push({
id:`egna-${e.id}`,
name:e.address,
address:e.address,
lat:e.lat,
lng:e.lng,
status:"pending"
})
})

tmm.data?.forEach((t:any)=>{
if(!t.lat||!t.lng) return
result.push({
id:`tmm-${t.id}`,
name:t.beskrivning || t.address,
address:t.address,
lat:t.lat,
lng:t.lng,
status:t.status || "pending"
})
})

optimal.data?.forEach((o:any)=>{
if(!o.lat||!o.lng) return
result.push({
id:`optimal-${o.id}`,
name:o.name,
address:o.address,
lat:o.lat,
lng:o.lng,
status:o.status || "pending"
})
})

setJobs(result)

}

async function loadWorkers(){

const {data}=await supabase
.from("worker_locations")
.select("*")

setWorkers(data || [])

}

/* AI ROUTE */

const routeJobs = useMemo(()=>{

if(jobs.length<=1) return jobs

const remaining=[...jobs]
const route=[remaining.shift()!]

while(remaining.length){

const last=route[route.length-1]

let nearestIndex=0
let shortest=Infinity

remaining.forEach((j,i)=>{

const dx=last.lat-j.lat
const dy=last.lng-j.lng

const dist=Math.sqrt(dx*dx+dy*dy)

if(dist<shortest){
shortest=dist
nearestIndex=i
}

})

route.push(remaining.splice(nearestIndex,1)[0])

}

return route

},[jobs])

return(

<div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">

{/* MAP */}

<div className="col-span-8">

<DispatchMap jobs={routeJobs}/>

</div>

{/* SIDE PANEL */}

<div className="col-span-4 bg-zinc-900 rounded-xl p-4 overflow-y-auto">

<h2 className="text-lg font-semibold text-white mb-4">
Fleet Control
</h2>

{/* WORKERS */}

<div className="mb-6">

<h3 className="text-sm text-zinc-400 mb-2">
Maskiner
</h3>

{workers.map(w=>(

<div
key={w.user_id}
className="flex justify-between items-center bg-zinc-800 p-2 rounded mb-2"
>

<span className="text-white text-sm">
{w.user_id}
</span>

<span className="text-xs text-green-400">
Online
</span>

</div>

))}

</div>

{/* JOB LIST */}

<div>

<h3 className="text-sm text-zinc-400 mb-2">
Uppdrag
</h3>

{routeJobs.map(job=>(

<div
key={job.id}
className="bg-zinc-800 p-2 rounded mb-2"
>

<p className="text-white text-sm">
{job.name}
</p>

<p className="text-xs text-zinc-400">
{job.address}
</p>

</div>

))}

</div>

</div>

</div>

)

}
