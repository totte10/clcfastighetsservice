import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import DispatchColumn from "./DispatchColumn"

export default function DispatchBoard(){

const [workers,setWorkers] = useState<any[]>([])
const [jobs,setJobs] = useState<any[]>([])

useEffect(()=>{

async function load(){

const {data:profiles} = await supabase
.from("profiles")
.select("id,full_name")

const {data:projects} = await supabase
.from("projects")
.select("*")

setWorkers(profiles ?? [])
setJobs(projects ?? [])

}

load()

},[])

return(

<div className="flex gap-4 overflow-x-auto pb-10">

{workers.map(worker=>{

const workerJobs = jobs.filter(
j => j.assigned_user === worker.id
)

return(

<DispatchColumn
key={worker.id}
worker={worker}
jobs={workerJobs}
/>

)

})}

</div>

)

}
