import {
GoogleMap,
Marker,
Polyline,
useJsApiLoader
} from "@react-google-maps/api"

import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

interface Job{
id:string
lat:number
lng:number
status?:string
address?:string
}

interface Worker{
user_id:string
lat:number
lng:number
status?:string
}

const containerStyle={
width:"100%",
height:"420px"
}

const center={
lat:57.7089,
lng:11.9746
}

export function DispatchMap({jobs}:{jobs:Job[]}){

const {isLoaded}=useJsApiLoader({
googleMapsApiKey:import.meta.env.VITE_GOOGLE_MAPS_KEY
})

const [workers,setWorkers]=useState<Worker[]>([])

useEffect(()=>{

loadWorkers()

const channel=supabase
.channel("worker_locations_live")
.on(
"postgres_changes",
{event:"*",schema:"public",table:"worker_locations"},
()=>loadWorkers()
)
.subscribe()

return()=>supabase.removeChannel(channel)

},[])

async function loadWorkers(){

const {data}=await supabase
.from("worker_locations")
.select("*")

setWorkers(data||[])

}

if(!isLoaded) return null

return(

<GoogleMap
mapContainerStyle={containerStyle}
center={center}
zoom={11}
options={{
disableDefaultUI:true,
zoomControl:true,
streetViewControl:false
}}
>

{/* JOB MARKERS */}

{jobs.map(job=>{

let color="blue"

if(job.status==="done") color="green"
if(job.status==="in-progress") color="yellow"

return(

<Marker
key={job.id}
position={{lat:job.lat,lng:job.lng}}
icon={{
url:`https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
}}
onClick={()=>{
if(job.address){
window.open(
`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address)}`,
"_blank"
)
}
}}
/>

)

})}

{/* WORKERS */}

{workers.map(worker=>(

<Marker
key={worker.user_id}
position={{
lat:worker.lat,
lng:worker.lng
}}
icon={{
url:"https://maps.google.com/mapfiles/ms/icons/green-dot.png"
}}
/>

))}

{/* ROUTE */}

{jobs.length>1 &&(

<Polyline
path={jobs.map(j=>({lat:j.lat,lng:j.lng}))}
options={{
strokeColor:"#22c55e",
strokeWeight:4
}}
/>

)}

</GoogleMap>

)

}
