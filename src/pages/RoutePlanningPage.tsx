import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

import { Route, Loader2, ExternalLink, Navigation } from "lucide-react"

import { format } from "date-fns"
import { sv } from "date-fns/locale"

import { useLoadScript } from "@react-google-maps/api"

import AdvancedMap from "@/components/AdvancedMap"


interface JobPoint {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  status: string
  type: string
  date?: string | null
}


/* SAFE DATE FUNCTION */

function safeDate(date?: string | null){

  if(!date) return null

  const d = new Date(date)

  if(isNaN(d.getTime())) return null

  return d

}


export default function RoutePlanningPage(){

  const { user } = useAuth()

  const [jobs,setJobs] = useState<JobPoint[]>([])
  const [optimizedJobs,setOptimizedJobs] = useState<JobPoint[]>([])
  const [loading,setLoading] = useState(true)
  const [directions,setDirections] = useState<any>(null)
  const [avoidHighways,setAvoidHighways] = useState(true)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  })


  /* LOAD JOBS FROM ALL TABLES */

  const loadJobs = useCallback(async () => {

    if(!user) return

    setLoading(true)

    const [projects,tidx,egna,tmm,optimal] = await Promise.all([

      supabase.from("projects")
      .select("id,name,address,lat,lng,status,datum_planerat"),

      supabase.from("tidx_entries")
      .select("id,omrade,address,lat,lng,status,datum_planerat"),

      supabase.from("egna_entries")
      .select("id,address,lat,lng,blow_status,sweep_status,datum_planerat"),

      supabase.from("tmm_entries")
      .select("id,beskrivning,address,lat,lng,status,datum"),

      supabase.from("optimal_entries")
      .select("id,name,address,lat,lng,status,datum_start")

    ])

    const points:JobPoint[] = []


    /* PROJECTS */

    projects.data?.forEach(r => {

      if(!r.lat || !r.lng) return

      points.push({
        id:r.id,
        name:r.name || "Projekt",
        address:r.address || "",
        lat:r.lat,
        lng:r.lng,
        status:r.status === "done" ? "done" : "pending",
        type:"project",
        date:r.datum_planerat
      })

    })


    /* TIDX */

    tidx.data?.forEach(r => {

      if(!r.lat || !r.lng) return

      points.push({
        id:`tidx-${r.id}`,
        name:r.omrade || "TIDX",
        address:r.address || "",
        lat:r.lat,
        lng:r.lng,
        status:r.status === "done" ? "done" : "pending",
        type:"tidx",
        date:r.datum_planerat
      })

    })


    /* EGNA */

    egna.data?.forEach(r => {

      if(!r.lat || !r.lng) return

      const done =
        r.blow_status === "done" &&
        r.sweep_status === "done"

      points.push({
        id:`egna-${r.id}`,
        name:"Egna område",
        address:r.address || "",
        lat:r.lat,
        lng:r.lng,
        status: done ? "done" : "pending",
        type:"egna",
        date:r.datum_planerat
      })

    })


    /* TMM */

    tmm.data?.forEach(r => {

      if(!r.lat || !r.lng) return

      points.push({
        id:`tmm-${r.id}`,
        name:r.beskrivning || "TMM",
        address:r.address || "",
        lat:r.lat,
        lng:r.lng,
        status:r.status === "done" ? "done" : "pending",
        type:"tmm",
        date:r.datum
      })

    })


    /* OPTIMAL */

    optimal.data?.forEach(r => {

      if(!r.lat || !r.lng) return

      points.push({
        id:`optimal-${r.id}`,
        name:r.name || "Optimal",
        address:r.address || "",
        lat:r.lat,
        lng:r.lng,
        status:r.status === "done" ? "done" : "pending",
        type:"optimal",
        date:r.datum_start
      })

    })


    setJobs(points)
    setLoading(false)

  },[user])


  useEffect(()=>{
    loadJobs()
  },[loadJobs])



  /* GOOGLE ROUTE OPTIMIZATION */

  useEffect(()=>{

    if(!isLoaded) return
    if(jobs.length < 2) return

    const directionsService = new google.maps.DirectionsService()

    const origin = {
      lat: jobs[0].lat,
      lng: jobs[0].lng
    }

    const destination = {
      lat: jobs[jobs.length-1].lat,
      lng: jobs[jobs.length-1].lng
    }

    const waypoints = jobs.slice(1,-1).map(j=>({
      location:{lat:j.lat,lng:j.lng}
    }))

    directionsService.route({

      origin,
      destination,
      waypoints,
      optimizeWaypoints:true,
      travelMode: google.maps.TravelMode.DRIVING,
      avoidHighways: avoidHighways

    },
    (result,status)=>{

      if(status==="OK" && result){

        setDirections(result)

        const order = result.routes[0].waypoint_order

        const optimized = [
          jobs[0],
          ...order.map((i:number)=>jobs[i+1]),
          jobs[jobs.length-1]
        ]

        setOptimizedJobs(optimized)

      }

    })

  },[jobs,avoidHighways,isLoaded])


  const routeJobs = optimizedJobs.length ? optimizedJobs : jobs


  const openNavigation = (job:JobPoint)=>{

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`,
      "_blank"
    )

  }


  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between flex-wrap gap-4">

        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Route className="h-6 w-6 text-primary"/>
          Ruttplanering – {format(new Date(),"d MMMM",{locale:sv})}
        </h1>

      </div>


      {loading ? (

        <div className="flex justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary"/>
        </div>

      ) : (

        <>

          {isLoaded && (
            <AdvancedMap jobs={routeJobs} directions={directions}/>
          )}

          <div className="grid gap-3">

            {routeJobs.map((job,index)=>{

              const isDone = job.status === "done"

              const d = safeDate(job.date)

              return(

                <Card key={job.id}>

                  <CardContent className="p-4 flex items-center gap-4">

                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                      {index+1}
                    </div>

                    <div className="flex-1">

                      <p className="font-medium text-sm">
                        {job.name}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {job.address}
                      </p>

                      {d && (

                        <p className="text-xs text-muted-foreground">
                          {format(d,"d MMM",{locale:sv})}
                        </p>

                      )}

                      <Badge
                        variant="outline"
                        className={`text-[10px] mt-1 ${
                          isDone ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {isDone ? "Klar" : "Ej klar"}
                      </Badge>

                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={()=>openNavigation(job)}
                    >
                      <ExternalLink className="h-3 w-3"/>
                    </Button>

                  </CardContent>

                </Card>

              )

            })}

          </div>

        </>

      )}

    </div>

  )

}
