import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Search } from "lucide-react";

interface Entry {
  id: string
  address: string
  name?: string
  source: string
  type?: string
  planned_date?: string
  status?: string
  lat?: number
  lng?: number
}

export default function ProjectsPage(){

const [entries,setEntries] = useState<Entry[]>([])
const [search,setSearch] = useState("")
const [loading,setLoading] = useState(true)

const [selected,setSelected] = useState<Entry | null>(null)
const [finishOpen,setFinishOpen] = useState(false)

const [startTime,setStartTime] = useState("")
const [endTime,setEndTime] = useState("")
const [comment,setComment] = useState("")
const [loads,setLoads] = useState("")

async function load(){

const tables = [
{table:"tmm_entries",label:"TMM"},
{table:"optimal_entries",label:"Optimal"},
{table:"egna_entries",label:"Egna"},
{table:"tidx_entries",label:"Tidx"}
]

const results = await Promise.all(

tables.map(async t=>{

const {data} = await supabase
.from(t.table)
.select("*")

return (data||[]).map((r:any)=>({

id:r.id,
address:r.address || r.street || "",
name:r.name || "",
type:r.type || "",
planned_date:r.planned_date,
status:r.status || "Ej påbörjad",
lat:r.lat,
lng:r.lng,
source:t.label

}))

})

)

setEntries(results.flat())
setLoading(false)

}

useEffect(()=>{load()},[])

function startJob(entry:Entry){

const now = new Date()
const time = now.toTimeString().slice(0,5)

setStartTime(time)

supabase
.from("active_clocks")
.insert({
entry_id:entry.id,
start_time:now
})

}

function openFinish(entry:Entry){

setSelected(entry)
setFinishOpen(true)

const now = new Date()
setEndTime(now.toTimeString().slice(0,5))

}

async function finishJob(){

if(!selected) return

await supabase
.from("time_entries")
.insert({
entry_id:selected.id,
start_time:startTime,
end_time:endTime,
loads:loads,
comment:comment
})

await supabase
.from("entries_status")
.update({status:"done"})
.eq("entry_id",selected.id)

setFinishOpen(false)

}

const filtered = useMemo(()=>{

if(!search) return entries

const q = search.toLowerCase()

return entries.filter(e=>
`${e.address} ${e.source} ${e.type}`
.toLowerCase()
.includes(q)
)

},[entries,search])

return(

<div className="space-y-4">

<Input
placeholder="Sök adress"
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

{loading && <Loader2 className="animate-spin"/>}

{filtered.map(entry=>(

<Card key={entry.id} className="glass-card">

<CardContent className="space-y-4 pt-4 pb-4">

<div className="flex justify-between">

<div>

<p className="font-semibold text-sm">

{entry.address}

</p>

<p className="text-xs text-muted-foreground">

{entry.type} · {entry.source}

</p>

{entry.planned_date &&

<p className="text-xs text-primary">

📅 {new Date(entry.planned_date).toLocaleDateString()}

</p>

}

</div>

<span className="text-xs bg-muted px-2 py-1 rounded">

{entry.status}

</span>

</div>

<div className="flex gap-2">

<Button
variant="outline"
onClick={()=>startJob(entry)}
>

▶ Starta

</Button>

<Button
className="bg-green-600 hover:bg-green-700"
onClick={()=>openFinish(entry)}
>

✓ Klar

</Button>

</div>

</CardContent>

</Card>

))}

<Dialog open={finishOpen} onOpenChange={setFinishOpen}>

<DialogContent className="space-y-4">

<h2 className="font-semibold text-lg">

Slutför uppdrag

</h2>

<div>

<label>Starttid</label>

<Input
value={startTime}
onChange={(e)=>setStartTime(e.target.value)}
/>

</div>

<div>

<label>Sluttid</label>

<Input
value={endTime}
onChange={(e)=>setEndTime(e.target.value)}
/>

</div>

<div>

<label>Antal lass flis</label>

<Input
value={loads}
onChange={(e)=>setLoads(e.target.value)}
/>

</div>

<div>

<label>Kommentar</label>

<Input
value={comment}
onChange={(e)=>setComment(e.target.value)}
/>

</div>

<Button
className="w-full bg-green-600"
onClick={finishJob}
>

Markera som klar

</Button>

</DialogContent>

</Dialog>

</div>

)

}
