import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Route, Loader2, Navigation } from "lucide-react"

import { format } from "date-fns"
import { sv } from "date-fns/locale"

import {
GoogleMap,
Marker,
DirectionsRenderer,
useLoadScript
} from "@react-google-maps/api"



interface Job{
id:string
name:string
address:string
lat:number
lng:number
status:string
type:string
date?:string | null
}



export default function RoutePlanningPage(){

const { user } = useAuth()

const [jobs,setJobs] = useState<Job[]>([])
const [optimized,setOptimized] = useState<Job[]>([])
const [directions,setDirections] = useState<any>(null)

const [loading,setLoading] = useState(true)

const [selectedDate,setSelectedDate] = useState(
format(new Date(),"yyyy-MM-dd")
)

const { isLoaded } = useLoadScript({
googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
})



/* LOAD ALL JOB TYPES */

const loadJobs = useCallback(async()=>{

if(!user) return

setLoading(true)

const [projects,tidx,egna,tmm,optimal] = await Promise.all([

supabase
.from("projects")
.select("id,name,address,lat,lng,status,datum_planerat"),

supabase
.from("tidx_entries")
.select("id,omrade,address,lat,lng,status,datum_planerat"),

supabase
.from("egna_entries")
.select("id,address,lat,lng,blow_status,sweep_status,datum_planerat"),

supabase
.from("tmm_entries")
.select("id,beskrivning,address,lat,lng,status,datum"),

supabase
.from("optimal_entries")
.select("id,name,address,lat,lng,status,datum_start")

])

const points:Job[] = []

/* PROJECTS */

projects.data?.forEach(r=>{

if(!r.lat || !r.lng) return

points.push({
id:`project-${r.id}`,
name:r.name || "Projekt",
address:r.address || "",
lat:r.lat,
lng:r.lng,
status:r.status || "pending",
type:"project",
date:r.datum_planerat?.slice(0,10) || null
})

})


/* TIDX */

tidx.data?.forEach(r=>{

if(!r.lat || !r.lng) return

points.push({
id:`tidx-${r.id}`,
name:r.omrade || "TIDX",
address:r.address || "",
lat:r.lat,
lng:r.lng,
status:r.status || "pending",
type:"tidx",
date:r.datum_planerat?.slice(0,10) || null
})

})


/* EGNA */

egna.data?.forEach(r=>{

if(!r.lat || !r.lng) return

const done =
r.blow_status==="done" &&
r.sweep_status==="done"

points.push({
id:`egna-${r.id}`,
name:"Egna område",
address:r.address || "",
lat:r.lat,
lng:r.lng,
status:done?"done":"pending",
type:"egna",
date:r.datum_planerat?.slice(0,10) || null
})

})


/* TMM */

tmm.data?.forEach(r=>{

if(!r.lat || !r.lng) return

points.push({
id:`tmm-${r.id}`,
name:r.beskrivning || "TMM",
address:r.address || "",
lat:r.lat,
lng:r.lng,
status:r.status || "pending",
type:"tmm",
date:r.datum?.slice(0,10) || null
})

})


/* OPTIMAL */

optimal.data?.forEach(r=>{

if(!r.lat || !r.lng) return

points.push({
id:`optimal-${r.id}`,
name:r.name || "Optimal",
address:r.address || "",
lat:r.lat,
lng:r.lng,
status:r.status || "pending",
type:"optimal",
date:r.datum_start?.slice(0,10) || null
})

})


/* FILTER BY DATE */

const filtered = points.filter(j=>{

if(!j.date) return true

return j.date === selectedDate

})


setJobs(filtered)

setLoading(false)

},[user,selectedDate])



useEffect(()=>{
loadJobs()
},[loadJobs])



/* GOOGLE ROUTE OPTIMIZER */

useEffect(()=>{

if(!isLoaded) return
if(jobs.length < 2) return

const service = new google.maps.DirectionsService()

const origin = {
lat:jobs[0].lat,
lng:jobs[0].lng
}

const destination = {
lat:jobs[jobs.length-1].lat,
lng:jobs[jobs.length-1].lng
}

const waypoints = jobs.slice(1,-1).map(j=>({
location:{lat:j.lat,lng:j.lng}
}))

service.route({

origin,
destination,
waypoints,
optimizeWaypoints:true,
travelMode:google.maps.TravelMode.DRIVING

},
(result,status)=>{

if(status==="OK" && result){

setDirections(result)

const order = result.routes[0].waypoint_order

const optimizedRoute = [
jobs[0],
...order.map((i:number)=>jobs[i+1]),
jobs[jobs.length-1]
]

setOptimized(optimizedRoute)

}

})

},[jobs,isLoaded])



const routeJobs = optimized.length ? optimized : jobs



const openNavigation = (job:Job)=>{

window.open(
`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`,
"_blank"
)

}



/* MARKER COLOR PER TYPE */

const getColor = (type:string)=>{

if(type==="project") return "#3b82f6"
if(type==="tidx") return "#f97316"
if(type==="egna") return "#a855f7"
if(type==="tmm") return "#eab308"
if(type==="optimal") return "#22c55e"

return "#ef4444"

}



const center = routeJobs.length
? {lat:routeJobs[0].lat,lng:routeJobs[0].lng}
: {lat:57.7089,lng:11.9746}



return(

<div className="space-y-6">


<h1 className="text-2xl font-bold flex items-center gap-2">

<Route className="h-6 w-6"/>

Ruttplanering – {format(new Date(selectedDate),"d MMMM",{locale:sv})}

</h1>



{/* DATE SELECTOR */}

<div className="flex gap-2 overflow-x-auto">

{Array.from({length:7}).map((_,i)=>{

const d = new Date()

d.setDate(d.getDate()+i)

const iso = format(d,"yyyy-MM-dd")

return(

<button
key={iso}
onClick={()=>setSelectedDate(iso)}
className={`px-3 py-1 rounded-lg border text-sm
${iso===selectedDate?"bg-primary text-white":""}`}
>

{format(d,"d MMM",{locale:sv})}

</button>

)

})}

</div>



{loading ? (

<div className="flex justify-center p-10">

<Loader2 className="animate-spin"/>

</div>

):(


<>

{isLoaded && (

<div className="h-[400px] w-full rounded-xl overflow-hidden border">

<GoogleMap
zoom={11}
center={center}
mapContainerStyle={{width:"100%",height:"100%"}}
>

{routeJobs.map((job,index)=>(

<Marker
key={job.id}
position
