import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import {
Route,
Loader2,
Navigation,
CloudRain,
Wind,
Thermometer
} from "lucide-react"

import { format } from "date-fns"
import { sv } from "date-fns/locale"

import {
GoogleMap,
Marker,
DirectionsRenderer,
TrafficLayer,
useLoadScript
} from "@react-google-maps/api"

interface Job{
id:string
name:string
address:string
lat:number
lng:number
status:string
date?:string
type:string
}

interface Weather{
temp:number
rain:number
wind:number
}

export default function RoutePlanningPage(){

const { user } = useAuth()

const [jobs,setJobs] = useState<Job[]>([])
const [optimized,setOptimized] = useState<Job[]>([])
const [directions,setDirections] = useState<any>(null)
const [loading,setLoading] = useState(true)

const [weather,setWeather] = useState<Weather | null>(null)

const [selectedDate,setSelectedDate] = useState(
format(new Date(),"yyyy-MM-dd")
)

const { isLoaded } = useLoadScript({
googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
})


/* LOAD JOBS */

const loadJobs = useCallback(async()=>{

if(!user) return

setLoading(true)

const { data } = await supabase
.from("projects")
.select("id,name,address,lat,lng,status,datum_planerat")

const points:Job[] = []

;(data ?? []).forEach(r=>{

if(!r.lat || !r.lng) return

const d = r.datum_planerat?.slice(0,10)

if(d !== selectedDate) return

points.push({
id:r.id,
name:r.name || "Projekt",
address:r.address || "",
lat:Number(r.lat),
lng:Number(r.lng),
status:r.status === "done" ? "done":"pending",
type:"project",
date:d
})

})

setJobs(points)
setLoading(false)

},[user,selectedDate])


useEffect(()=>{
loadJobs()
},[loadJobs])


/* WEATHER */

const loadWeather = async()=>{

try{

const res = await fetch(
"https://api.open-meteo.com/v1/forecast?latitude=57.7089&longitude=11.9746&current=temperature_2m,precipitation,wind_speed_10m"
)

const data = await res.json()

if(!data?.current) return

setWeather({
temp:data.current.temperature_2m,
rain:data.current.precipitation,
wind:data.current.wind_speed_10m
})

}catch{
console.log("Weather error")
}

}

useEffect(()=>{
loadWeather()
},[])


/* ROUTE OPTIMIZATION */

useEffect(()=>{

if(!isLoaded) return
if(jobs.length < 2) return
if(!window.google) return

const directionsService =
new window.google.maps.DirectionsService()

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

directionsService.route({

origin,
destination,
waypoints,
optimizeWaypoints:true,
travelMode:window.google.maps.TravelMode.DRIVING

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


/* NAVIGATION */

const openNavigation = (job:Job)=>{

window.open(
`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`,
"_blank"
)

}


/* MAP CENTER */

const center = routeJobs.length
? {lat:routeJobs[0].lat,lng:routeJobs[0].lng}
: {lat:57.7089,lng:11.9746}


/* SLIP RISK */

const slipRisk =
weather &&
weather.temp <= 0 &&
weather.rain > 0


return(

<div className="space-y-6">

<h1 className="text-2xl font-bold flex items-center gap-2">
<Route className="h-6 w-6"/>
Ruttplanering – {format(new Date(selectedDate),"d MMMM",{locale:sv})}
</h1>


{/* WEATHER */}

{weather && (

<div className="grid grid-cols-2 md:grid-cols-4 gap-4">

<Card>
<CardContent className="p-4 flex items-center gap-3">
<Thermometer className="w-5 h-5 text-orange-500"/>
<div>
<p className="text-xs text-muted-foreground">
Temperatur
</p>
<p className="font-semibold">
{weather.temp}°C
</p>
</div>
</CardContent>
</Card>

<Card>
<CardContent className="p-4 flex items-center gap-3">
<CloudRain className="w-5 h-5 text-blue-500"/>
<div>
<p className="text-xs text-muted-foreground">
Nederbörd
</p>
<p className="font-semibold">
{weather.rain} mm
</p>
</div>
</CardContent>
</Card>

<Card>
<CardContent className="p-4 flex items-center gap-3">
<Wind className="w-5 h-5 text-gray-500"/>
<div>
<p className="text-xs text-muted-foreground">
Vind
</p>
<p className="font-semibold">
{weather.wind} m/s
</p>
</div>
</CardContent>
</Card>

<Card>
<CardContent className="p-4 flex items-center">

{slipRisk ? (
<Badge variant="destructive">
Halkrisk
</Badge>
) : (
<Badge variant="outline">
Normal drift
</Badge>
)}

</CardContent>
</Card>

</div>

)}


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


{/* MAP */}

{loading ? (

<div className="flex justify-center p-10">
<Loader2 className="animate-spin"/>
</div>

):( 

isLoaded && (

<div className="h-[420px] w-full rounded-xl overflow-hidden border">

<GoogleMap
zoom={11}
center={center}
mapContainerStyle={{width:"100%",height:"100%"}}
>

<TrafficLayer />

{routeJobs.map((job,index)=>{

return(

<Marker
key={job.id}
position={{lat:job.lat,lng:job.lng}}
label={{
text:String(index+1),
color:"#fff"
}}
/>

)

})}

{directions && (
<DirectionsRenderer directions={directions}/>
)}

</GoogleMap>

</div>

)

)}


{/* JOB LIST */}

<div className="grid gap-3">

{routeJobs.map((job,index)=>{

const done = job.status==="done"

return(

<Card key={job.id}>

<CardContent className="p-4 flex items-center gap-4">

<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
{index+1}
</div>

<div className="flex-1">

<p className="font-medium text-sm">
{job.name}
</p>

<p className="text-xs text-muted-foreground">
{job.address}
</p>

<Badge variant="outline" className="text-[10px] mt-1">
{done?"Klar":"Ej klar"}
</Badge>

</div>

<Button
size="sm"
onClick={()=>openNavigation(job)}
className="gap-2"
>

<Navigation className="h-4 w-4"/>
Navigera

</Button>

</CardContent>

</Card>

)

})}

</div>

</div>

)

}
