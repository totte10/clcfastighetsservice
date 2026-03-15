import { useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"

export function useWorkerGPS(){

useEffect(()=>{

if(!navigator.geolocation) return

const watch = navigator.geolocation.watchPosition(

async(pos)=>{

const { latitude, longitude, speed, heading } = pos.coords

await supabase
.from("worker_locations")
.upsert({
lat: latitude,
lng: longitude,
speed: speed,
heading: heading,
updated_at: new Date()
})

},

(err)=>console.log(err),

{
enableHighAccuracy:true,
maximumAge:5000,
timeout:10000
}

)

return ()=>navigator.geolocation.clearWatch(watch)

},[])

}
