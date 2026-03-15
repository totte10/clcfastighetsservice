import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { FleetMap } from "@/components/maps/FleetMap"

export default function FleetControlPage(){

const [jobs,setJobs] = useState<any[]>([])

async function loadJobs(){

const tables=[
"projects",
"tidx_entries",
"egna_entries",
"tmm_entries",
"optimal_entries"
]

const result:any[]=[]

for(const t of tables){

const { data } = await supabase
.from(t)
.select("*")

data?.forEach((row:any)=>{

if(!row.lat || !row.lng) return

result.push({
id:`${t}-${row.id}`,
lat:row.lat,
lng:row.lng
})

})

}

setJobs(result)

}

useEffect(()=>{
loadJobs()
},[])

return(

<div className="space-y-4">

<h1 className="text-xl font-semibold text-white">
Fleet Control Center
</h1>

<div className="rounded-xl overflow-hidden border border-white/10">

<FleetMap jobs={jobs}/>

</div>

</div>

)

}
