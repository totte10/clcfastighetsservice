import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api"
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

const containerStyle = {
width: "100%",
height: "500px"
}

const center = {
lat: 57.7089,
lng: 11.9746
}

export function FleetMap({ jobs }: any){

const { isLoaded } = useJsApiLoader({
googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
})

const [workers,setWorkers] = useState<any[]>([])

useEffect(()=>{

loadWorkers()

const channel = supabase
.channel("fleet-live")
.on(
"postgres_changes",
{ event:"*", schema:"public", table:"worker_locations"},
()=>loadWorkers()
)
.subscribe()

return ()=>supabase.removeChannel(channel)

},[])

async function loadWorkers(){

const { data } = await supabase
.from("worker_locations")
.select("*")

setWorkers(data || [])

}

if(!isLoaded) return null

return(

<GoogleMap
mapContainerStyle={containerStyle}
center={center}
zoom={10}
options={{
disableDefaultUI:true,
zoomControl:true
}}
>

{jobs.map((job:any)=>(

<Marker
key={job.id}
position={{lat:job.lat,lng:job.lng}}
/>

))}

{workers.map((worker:any)=>(

<Marker
key={worker.user_id}
position={{lat:worker.lat,lng:worker.lng}}
icon={{
url:"https://maps.google.com/mapfiles/ms/icons/green-dot.png"
}}
/>

))}

<Polyline
path={jobs.map((j:any)=>({lat:j.lat,lng:j.lng}))}
options={{
strokeColor:"#22c55e",
strokeWeight:4
}}
/>

</GoogleMap>

)

}
