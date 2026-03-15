import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api"
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

const containerStyle = {
  width: "100%",
  height: "420px"
}

const center = {
  lat: 57.7089,
  lng: 11.9746
}

export function FleetMap({ jobs = [] }: any) {

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  })

  const [workers,setWorkers] = useState<any[]>([])

  async function loadWorkers(){

    const { data } = await supabase
      .from("worker_locations")
      .select("*")

    setWorkers(data || [])

  }

  useEffect(()=>{

    loadWorkers()

    const channel = supabase
      .channel("worker_locations")
      .on(
        "postgres_changes",
        { event:"*", schema:"public", table:"worker_locations" },
        ()=>loadWorkers()
      )
      .subscribe()

    return ()=>supabase.removeChannel(channel)

  },[])

  if(!isLoaded) return <div className="p-6 text-white">Laddar karta...</div>

  const validJobs = jobs.filter((j:any)=>j.lat && j.lng)

  return(

<GoogleMap
mapContainerStyle={containerStyle}
center={center}
zoom={11}
options={{
disableDefaultUI:true,
zoomControl:true
}}
>

{/* JOB MARKERS */}

{validJobs.map((job:any)=>(
<Marker
key={job.id}
position={{
lat:Number(job.lat),
lng:Number(job.lng)
}}
/>
))}

{/* WORKER GPS */}

{workers.map((w:any)=>(
<Marker
key={w.user_id}
position={{
lat:Number(w.lat),
lng:Number(w.lng)
}}
icon={{
url:"https://maps.google.com/mapfiles/ms/icons/green-dot.png"
}}
/>
))}

{/* ROUTE */}

<Polyline
path={validJobs.map((j:any)=>({
lat:Number(j.lat),
lng:Number(j.lng)
}))}
options={{
strokeColor:"#22c55e",
strokeWeight:4
}}
/>

</GoogleMap>

  )
}
