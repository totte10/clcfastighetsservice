import { useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

export function useWorkerGPS(){

const { user } = useAuth()

useEffect(()=>{

if(!user) return

const id = navigator.geolocation.watchPosition(async pos=>{

await supabase
.from("worker_locations")
.upsert({
user_id:user.id,
lat:pos.coords.latitude,
lng:pos.coords.longitude,
updated_at:new Date()
})

},{
enableHighAccuracy:true
})

return ()=>navigator.geolocation.clearWatch(id)

},[user])

}
