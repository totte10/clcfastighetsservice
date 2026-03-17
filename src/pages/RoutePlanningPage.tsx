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

  if(!user){
    setLoading(false)
    return
  }

  setLoading(true)

  try{

    const [projects,egna,tidx,optimal,tmm] = await Promise.all([

      supabase
        .from("projects")
        .select("id,name,address,lat,lng,status,datum_planerat"),

      supabase
        .from("egna_entries")
        .select("id,address,lat,lng,datum_planerat,blow_status,sweep_status"),

      supabase
        .from("tidx_entries")
        .select("id,omrade,address,lat,lng,status,datum_planerat"),

      supabase
        .from("optimal_entries")
        .select("id,name,address,lat,lng,status,datum_start"),

      supabase
        .from("tmm_entries")
        .select("id,name,address,lat,lng,status,datum_planerat")

    ])

    const list:Job[] = []

    /* PROJECTS */

    ;(projects.data ?? []).forEach(r=>{

      if(!r.lat || !r.lng) return

      const d = r.datum_planerat?.slice(0,10)

      if(d && d !== selectedDate) return

      list.push({
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


    /* EGNA */

    ;(egna.data ?? []).forEach(r=>{

      if(!r.lat || !r.lng) return

      const d = r.datum_planerat?.slice(0,10)

      if(d && d !== selectedDate) return

      const done =
        r.blow_status === "done" &&
        r.sweep_status === "done"

      list.push({
        id:r.id,
        name:"Egna område",
        address:r.address || "",
        lat:Number(r.lat),
        lng:Number(r.lng),
        status:done ? "done":"pending",
        type:"egna",
        date:d
      })

    })


    /* TIDX */

    ;(tidx.data ?? []).forEach(r=>{

      if(!r.lat || !r.lng) return

      const d = r.datum_planerat?.slice(0,10)

      if(d && d !== selectedDate) return

      list.push({
        id:r.id,
        name:r.omrade || "Tidx område",
        address:r.address || "",
        lat:Number(r.lat),
        lng:Number(r.lng),
        status:r.status === "done" ? "done":"pending",
        type:"tidx",
        date:d
      })

    })


    /* OPTIMAL */

    ;(optimal.data ?? []).forEach(r=>{

      if(!r.lat || !r.lng) return

      const d = r.datum_planerat?.slice(0,10)

      if(d && d !== selectedDate) return

      list.push({
        id:r.id,
        name:r.name || "Optimal",
        address:r.address || "",
        lat:Number(r.lat),
        lng:Number(r.lng),
        status:r.status === "done" ? "done":"pending",
        type:"optimal",
        date:d
      })

    })


    /* TMM */

    ;(tmm.data ?? []).forEach(r=>{

      if(!r.lat || !r.lng) return

      const d = r.datum_planerat?.slice(0,10)

      if(d && d !== selectedDate) return

      list.push({
        id:r.id,
        name:r.name || "TMM",
        address:r.address || "",
        lat:Number(r.lat),
        lng:Number(r.lng),
        status:r.status === "done" ? "done":"pending",
        type:"tmm",
        date:d
      })

    })


    setJobs(list)

  }catch(e){

    console.log("Job load error",e)

  }

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

  const directionsService =
    new window.google.maps.DirectionsService()

  const origin = jobs[0]
  const destination = jobs[jobs.length-1]

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


const routeJobs =
  optimized.length ? optimized : jobs


const center =
  routeJobs.length
  ? {lat:routeJobs[0].lat,lng:routeJobs[0].lng}
  : {lat:57.7089,lng:11.9746}


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
<p className="text-xs text-muted-foreground">Temperatur</p>
<p className="font-semibold">{weather.temp}°C</p>
</div>
</CardContent>
</Card>

<Card>
<CardContent className="p-4 flex items-center gap-3">
<CloudRain className="w-5 h-5 text-blue-500"/>
<div>
<p className="text-xs text-muted-foreground">Nederbörd</p>
<p className="font-semibold">{weather.rain} mm</p>
</div>
</CardContent>
</Card>

<Card>
<CardContent className="p-4 flex items-center gap-3">
<Wind className="w-5 h-5 text-gray-500"/>
<div>
<p className="text-xs text-muted-foreground">Vind</p>
<p className="font-semibold">{weather.wind} m/s</p>
</div>
</CardContent>
</Card>

<Card>
<CardContent className="p-4 flex items-center">
<Badge variant="outline">Driftinfo</Badge>
</CardContent>
</Card>

</div>

)}


{/* MAP */}

{!isLoaded ? (

<div className="flex justify-center p-10">
<Loader2 className="animate-spin"/>
</div>

):( 

<div className="h-[420px] w-full rounded-xl overflow-hidden border">

<GoogleMap
zoom={11}
center={center}
mapContainerStyle={{width:"100%",height:"100%"}}
>

<TrafficLayer />

{routeJobs.map((job,index)=>(
<Marker
key={`${job.type}-${job.id}`}
position={{lat:job.lat,lng:job.lng}}
label={{text:String(index+1),color:"#fff"}}
/>
))}

{directions && (
<DirectionsRenderer directions={directions}/>
)}

</GoogleMap>

</div>

)}


{/* JOB LIST */}

<div className="grid gap-3">

{routeJobs.map((job,index)=>{

const done = job.status==="done"

return(

<Card key={`${job.type}-${job.id}`}>

<CardContent className="p-4 flex items-center gap-4">

<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
{index+1}
</div>

<div className="flex-1">

<p className="font-medium text-sm">{job.name}</p>
<p className="text-xs text-muted-foreground">{job.address}</p>

<Badge variant="outline" className="text-[10px] mt-1">
{done?"Klar":"Ej klar"}
</Badge>

</div>

<Button
size="sm"
onClick={()=>window.open(
`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`
)}
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
