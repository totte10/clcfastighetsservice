import Map, { Marker, Popup } from "react-map-gl"
import "mapbox-gl/dist/mapbox-gl.css"

import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

interface Worker{
id:string
user_id:string
project_id:string
lat:number
lng:number
updated_at:string
}

interface Job{
id:string
name:string
address:string
lat?:number
lng?:number
status:string
}

export function DispatchMap({jobs}:{jobs:Job[]}){

const [workers,setWorkers] = useState<Worker[]>([])
const [selectedWorker,setSelectedWorker] = useState<Worker | null>(null)

async function loadWorkers(){

const { data } = await supabase
.from("worker_locations")
.select("*")

setWorkers(data ?? [])

}

useEffect(()=>{

loadWorkers()

const channel = supabase
.channel("worker_locations_live")
.on(
"postgres_changes",
{event:"*",schema:"public",table:"worker_locations"},
()=> loadWorkers()
)
.subscribe()

return ()=>{ supabase.removeChannel(channel) }

},[])

return(

<div className="w-full h-[420px] rounded-xl overflow-hidden border border-white/10">

<Map
mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
initialViewState={{
latitude:57.70,
longitude:12.00,
zoom:10
}}
style={{width:"100%",height:"100%"}}
mapStyle="mapbox://styles/mapbox/dark-v11"
>

{/* JOB MARKERS */}

{jobs
.filter(j=>j.lat && j.lng)
.map(job=>(
<Marker
key={job.id}
longitude={job.lng!}
latitude={job.lat!}
>

<div className="
w-3 h-3
bg-blue-500
rounded-full
shadow-lg
shadow-blue-500/50
"/>

</Marker>
))}

{/* WORKER MARKERS */}

{workers.map(worker=>(
<Marker
key={worker.id}
longitude={worker.lng}
latitude={worker.lat}
>

<button
onClick={()=>setSelectedWorker(worker)}
className="
w-4 h-4
bg-green-500
rounded-full
shadow-lg
shadow-green-500/50
animate-pulse
"
/>

</Marker>
))}

{/* WORKER POPUP */}

{selectedWorker && (

<Popup
longitude={selectedWorker.lng}
latitude={selectedWorker.lat}
onClose={()=>setSelectedWorker(null)}
closeButton={true}
>

<div className="text-sm">

<p className="font-semibold">
Arbetare
</p>

<p className="text-xs text-muted-foreground">
Projekt: {selectedWorker.project_id}
</p>

</div>

</Popup>

)}

</Map>

</div>

)

}
