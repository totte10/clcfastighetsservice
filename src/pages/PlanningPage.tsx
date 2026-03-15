import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Navigate } from "react-router-dom"

import { format } from "date-fns"
import { sv } from "date-fns/locale"

import { Plus, Pencil } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"

interface Job {
  id: string
  name: string
  address: string
  project_number: string
  datum_planerat: string
}

interface Worker {
  id: string
  full_name: string
}

export default function PlanningPage(){

const { user, isAdmin } = useAuth()

const [jobs,setJobs] = useState<Job[]>([])
const [workers,setWorkers] = useState<Worker[]>([])

const [editing,setEditing] = useState<Job | null>(null)
const [creating,setCreating] = useState(false)

const [form,setForm] = useState({
name:"",
address:"",
project_number:"",
datum_planerat:"",
workers:[] as string[]
})



/* LOAD DATA */

async function load(){

const { data:projects } = await supabase
.from("projects")
.select("*")
.order("datum_planerat")

const { data:profiles } = await supabase
.from("profiles")
.select("id,full_name")

setJobs(projects ?? [])
setWorkers(profiles ?? [])

}

useEffect(()=>{
load()
},[])



/* OPEN CREATE */

function openCreate(){

setCreating(true)

setForm({
name:"",
address:"",
project_number:"",
datum_planerat:format(new Date(),"yyyy-MM-dd"),
workers:[]
})

}



/* OPEN EDIT */

function openEdit(job:Job){

setEditing(job)

setForm({
name:job.name,
address:job.address,
project_number:job.project_number ?? "",
datum_planerat:job.datum_planerat ?? "",
workers:[]
})

}



/* TOGGLE WORKER */

function toggleWorker(id:string){

setForm(prev=>({

...prev,
workers: prev.workers.includes(id)
? prev.workers.filter(w=>w!==id)
: [...prev.workers,id]

}))

}



/* SAVE EDIT */

async function saveEdit(){

if(!editing) return

await supabase
.from("projects")
.update({
name:form.name,
address:form.address,
project_number:form.project_number,
datum_planerat:form.datum_planerat
})
.eq("id",editing.id)


await supabase
.from("project_assignments")
.delete()
.eq("entry_id",editing.id)
.eq("entry_type","project")


if(form.workers.length){

await supabase
.from("project_assignments")
.insert(
form.workers.map(uid=>({
entry_id:editing.id,
entry_type:"project",
user_id:uid
}))
)

}

setEditing(null)

await load()

}



/* CREATE JOB */

async function createJob(){

const { data } = await supabase
.from("projects")
.insert({
name:form.name,
address:form.address,
project_number:form.project_number,
datum_planerat:form.datum_planerat
})
.select()
.single()


if(data && form.workers.length){

await supabase
.from("project_assignments")
.insert(
form.workers.map(uid=>({
entry_id:data.id,
entry_type:"project",
user_id:uid
}))
)

}

setCreating(false)

await load()

}



if(!isAdmin) return <Navigate to="/" replace />



return(

<div className="min-h-screen bg-[#070f1f] text-white">

<div className="max-w-md mx-auto px-4 py-6 space-y-6">

{/* HEADER */}

<div className="flex items-center justify-between">

<div>

<h1 className="text-2xl font-bold">
Planering
</h1>

<p className="text-xs text-white/40">
{format(new Date(),"EEEE d MMMM yyyy",{locale:sv})}
</p>

</div>

<button
onClick={openCreate}
className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center hover:bg-blue-400"
>
<Plus className="w-5 h-5"/>
</button>

</div>



{/* JOB LIST */}

<Card className="bg-[#111827] border-white/5">

<CardContent className="space-y-3 p-4">

{jobs.map(job=>(

<div
key={job.id}
className="border border-white/5 rounded-xl p-3 flex justify-between items-center"
>

<div>

<p className="font-medium text-sm">
{job.name}
</p>

<p className="text-xs text-white/40">
{job.address}
</p>

<p className="text-xs text-white/20">
{job.datum_planerat}
</p>

</div>

<Button
size="sm"
variant="outline"
onClick={()=>openEdit(job)}
>

<Pencil className="w-3 h-3 mr-1"/>

Ändra

</Button>

</div>

))}

</CardContent>

</Card>



{/* EDIT */}

{editing && (

<Dialog open onOpenChange={()=>setEditing(null)}>

<DialogContent className="space-y-4">

<DialogHeader>

<DialogTitle>
Redigera uppdrag
</DialogTitle>

</DialogHeader>

<Input
placeholder="Namn"
value={form.name}
onChange={e=>setForm({...form,name:e.target.value})}
/>

<Input
placeholder="Adress"
value={form.address}
onChange={e=>setForm({...form,address:e.target.value})}
/>

<Input
placeholder="Projektnummer"
value={form.project_number}
onChange={e=>setForm({...form,project_number:e.target.value})}
/>

<Input
type="date"
value={form.datum_planerat}
onChange={e=>setForm({...form,datum_planerat:e.target.value})}
/>


<div className="grid grid-cols-2 gap-2">

{workers.map(w=>(

<label key={w.id} className="flex items-center gap-2 text-xs">

<Checkbox
checked={form.workers.includes(w.id)}
onCheckedChange={()=>toggleWorker(w.id)}
/>

{w.full_name}

</label>

))}

</div>

<Button onClick={saveEdit}>
Spara
</Button>

</DialogContent>

</Dialog>

)}



{/* CREATE */}

{creating && (

<Dialog open onOpenChange={()=>setCreating(false)}>

<DialogContent className="space-y-4">

<DialogHeader>

<DialogTitle>
Nytt uppdrag
</DialogTitle>

</DialogHeader>

<Input
placeholder="Namn"
value={form.name}
onChange={e=>setForm({...form,name:e.target.value})}
/>

<Input
placeholder="Adress"
value={form.address}
onChange={e=>setForm({...form,address:e.target.value})}
/>

<Input
placeholder="Projektnummer"
value={form.project_number}
onChange={e=>setForm({...form,project_number:e.target.value})}
/>

<Input
type="date"
value={form.datum_planerat}
onChange={e=>setForm({...form,datum_planerat:e.target.value})}
/>


<div className="grid grid-cols-2 gap-2">

{workers.map(w=>(

<label key={w.id} className="flex items-center gap-2 text-xs">

<Checkbox
checked={form.workers.includes(w.id)}
onCheckedChange={()=>toggleWorker(w.id)}
/>

{w.full_name}

</label>

))}

</div>

<Button onClick={createJob}>
Skapa uppdrag
</Button>

</DialogContent>

</Dialog>

)}

</div>

</div>

)

}
