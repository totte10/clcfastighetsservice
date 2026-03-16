import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Route, Loader2, Navigation } from "lucide-react"

import { format } from "date-fns"
import { sv } from "date-fns/locale"

import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useLoadScript
} from "@react-google-maps/api"

interface Job{
  id:string
  name:string
  address:string
  lat:number
  lng:number
  status:string
  date?:string
}

export default function RoutePlanningPage(){

  const { user } = useAuth()

  const [jobs,setJobs] = useState<Job[]>([])
  const [optimized,setOptimized] = useState<Job[]>([])
  const [directions,setDirections] = useState<any>(null)
  const [loading,setLoading] = useState(true)

  const [selectedDate,setSelectedDate] = useState(
    format(new Date(),"yyyy-MM-dd")
  )

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  })

  /* LOAD JOBS */

  const loadJobs = useCallback(async()=>{

    if(!user) return

    setLoading(true)

    const { data,error } = await supabase
      .from("projects")
      .select("id,name,address,lat,lng,status,datum_planerat")

    if(error){
      console.log("Supabase error",error)
      setLoading(false)
      return
    }

    const points:Job[] = []

    ;(data ?? []).forEach(r=>{

      if(!r.lat || !r.lng) return

      const date = r.datum_planerat
        ? r.datum_planerat.slice(0,10)
        : undefined

      /* visa alla om inget datum */
      if(date && date !== selectedDate) return

      points.push({
        id:r.id,
        name:r.name || "Projekt",
        address:r.address || "",
        lat:Number(r.lat),
        lng:Number(r.lng),
        status:r.status === "done" ? "done":"pending",
        date
      })

    })

    setJobs(points)
    setLoading(false)

  },[user,selectedDate])

  useEffect(()=>{
    loadJobs()
  },[loadJobs])


  /* ROUTE OPTIMIZATION */

  useEffect(()=>{

    if(!isLoaded) return
    if(jobs.length < 2) return

    const directionsService = new google.maps.DirectionsService()

    const origin = {
      lat:jobs[0].lat,
      lng:jobs[0].lng
    }

    const destination = {
      lat:jobs[jobs.length-1].lat,
      lng:jobs[jobs.length-1].lng
    }

    const waypoints = jobs.slice(1,-1).map(j=>({
      location:{lat:j.lat,lng:j.lng}
    }))

    directionsService.route({

      origin,
      destination,
      waypoints,
      optimizeWaypoints:true,
      travelMode:google.maps.TravelMode.DRIVING

    },
    (result,status)=>{

      if(status==="OK" && result){

        setDirections(result)

        const order = result.routes[0].waypoint_order

        const optimizedRoute = [
          jobs[0],
          ...order.map((i:number)=>jobs[i+1]),
          jobs[jobs.length-1]
        ]

        setOptimized(optimizedRoute)

      }

    })

  },[jobs,isLoaded])


  const routeJobs = optimized.length ? optimized : jobs


  const openNavigation = (job:Job)=>{

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`,
      "_blank"
    )

  }


  const center =
    routeJobs.length
      ? {lat:routeJobs[0].lat,lng:routeJobs[0].lng}
      : {lat:57.7089,lng:11.9746}


  return(

    <div className="space-y-6">

      {/* HEADER */}

      <h1 className="text-2xl font-bold flex items-center gap-2">

        <Route className="h-6 w-6"/>

        Ruttplanering – {format(new Date(selectedDate),"d MMMM",{locale:sv})}

      </h1>


      {/* DATE SELECTOR */}

      <div className="flex gap-2 overflow-x-auto">

        {Array.from({length:7}).map((_,i)=>{

          const d = new Date()
          d.setDate(d.getDate()+i)

          const iso = format(d,"yyyy-MM-dd")

          return(

            <button
              key={iso}
              onClick={()=>setSelectedDate(iso)}
              className={`px-3 py-1 rounded-lg border text-sm
              ${iso===selectedDate?"bg-primary text-white":""}`}
            >

              {format(d,"d MMM",{locale:sv})}

            </button>

          )

        })}

      </div>


      {loading ?(

        <div className="flex justify-center p-12">

          <Loader2 className="animate-spin"/>

        </div>

      ):(
        
        <>

          {/* MAP */}

          {isLoaded && (

            <div className="h-[400px] w-full rounded-xl overflow-hidden border">

              <GoogleMap
                zoom={11}
                center={center}
                mapContainerStyle={{
                  width:"100%",
                  height:"100%"
                }}
              >

                {routeJobs.map((job,index)=>{

                  const color =
                    job.status==="done"
                      ? "#22c55e"
                      : "#ef4444"

                  return(

                    <Marker
                      key={job.id}
                      position={{lat:job.lat,lng:job.lng}}
                      label={{
                        text:String(index+1),
                        color:"#fff"
                      }}
                      icon={{
                        path:google.maps.SymbolPath.CIRCLE,
                        scale:12,
                        fillColor:color,
                        fillOpacity:1,
                        strokeColor:"#fff",
                        strokeWeight:2
                      }}
                    />

                  )

                })}

                {directions && (
                  <DirectionsRenderer directions={directions}/>
                )}

              </GoogleMap>

            </div>

          )}


          {/* JOB LIST */}

          <div className="grid gap-3">

            {routeJobs.map((job,index)=>{

              const done = job.status==="done"

              return(

                <Card key={job.id}>

                  <CardContent className="p-4 flex items-center gap-4">

                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">

                      {index+1}

                    </div>

                    <div className="flex-1">

                      <p className="font-medium text-sm">

                        {job.name}

                      </p>

                      <p className="text-xs text-muted-foreground">

                        {job.address}

                      </p>

                      <Badge variant="outline" className="text-[10px] mt-1">

                        {done?"Klar":"Ej klar"}

                      </Badge>

                    </div>

                    <Button
                      size="sm"
                      onClick={()=>openNavigation(job)}
                      className="gap-2"
                    >

                      <Navigation className="h-4 w-4"/>

                      Navigera

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
