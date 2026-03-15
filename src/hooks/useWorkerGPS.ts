import { useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

export function useWorkerGPS(project?:string){

const { user } = useAuth()

useEffect(()=>{

if(!user) return

const watch = navigator.geolocation.watchPosition(async pos=>{

await supabase
.from("worker_locations")
.upsert({
user_id:user.id,
lat:pos.coords.latitude,
lng:pos.coords.longitude,
project_id:null,
updated_at:new Date()
})

})

return ()=>navigator.geolocation.clearWatch(watch)

},[user])

}
