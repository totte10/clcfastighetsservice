import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { format } from "date-fns"

export default function PlanningPage() {

  const { user, loading } = useAuth()

  const [jobs, setJobs] = useState<any[]>([])
  const [error, setError] = useState("")
  const [selectedDate] = useState(format(new Date(), "yyyy-MM-dd"))

  useEffect(() => {
    if (!user) return

    const load = async () => {

      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")

        if (error) {
          console.error(error)
          setError(error.message)
          return
        }

        setJobs(data || [])

      } catch (e:any) {
        console.error(e)
        setError("Crash")
      }
    }

    load()
  }, [user])

  // 🔥 STOPPAR ALLA CRASHES
  if (loading) return <div style={{color:"white",padding:20}}>Laddar...</div>

  if (!user) return <div style={{color:"white",padding:20}}>Inte inloggad</div>

  if (error) return <div style={{color:"red",padding:20}}>Error: {error}</div>

  // 🔥 SAFE FILTER
  const filtered = jobs.filter(j => {
    if (!j?.datum_planerat) return false
    return j.datum_planerat.slice(0,10) === selectedDate
  })

  return (
    <div style={{background:"#0B1220",minHeight:"100vh",padding:20,color:"white"}}>

      <h1>Planering</h1>

      {filtered.length === 0 && (
        <p style={{opacity:0.5}}>Inga jobb idag</p>
      )}

      {filtered.map(job => (
        <div
          key={job.id}
          style={{
            background:"#111827",
            padding:12,
            borderRadius:12,
            marginBottom:10
          }}
        >
          <p>{job.name}</p>
          <p style={{fontSize:12,opacity:0.6}}>
            {job.address}
          </p>
        </div>
      ))}

    </div>
  )
}