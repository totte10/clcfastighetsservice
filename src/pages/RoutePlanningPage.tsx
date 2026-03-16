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

import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useLoadScript
} from "@react-google-maps/api"

interface JobPoint {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  status: string
  type: string
}

export default function RoutePlanningPage() {

  const { user } = useAuth()

  const [jobs,setJobs] = useState<JobPoint[]>([])
  const [optimizedJobs,setOptimizedJobs] = useState<JobPoint[]>([])
  const [loading,setLoading] = useState(true)

  const [directions,setDirections] = useState<any>(null)

  const [avoidHighways,setAvoidHighways] = useState(true)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  })

  const loadJobs = useCallback(async () => {

    if(!user) return

    setLoading(true)

    const { data } = await supabase
      .from("projects")
      .select("id,name,address,lat,lng,status")

    const points:JobPoint[] = []

    ;(data ?? []).forEach(r => {

      if(r.lat && r.lng){

        points.push({
          id:r.id,
          name:r.name,
          address:r.address,
          lat:r.lat,
          lng:r.lng,
          status:r.status === "done" ? "done" : "pending",
          type:"project"
        })

      }

    })

    setJobs(points)
    setLoading(false)

  },[user])

  useEffect(()=>{
    loadJobs()
  },[loadJobs])

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

  const openNavigation = (job:JobPoint)=>{

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`,
      "_blank"
    )

  }

  const startFullRoute = () => {

    if(optimizedJobs.length === 0) return

    const path = optimizedJobs
      .map(j => `${j.lat},${j.lng}`)
      .join("/")

    window.open(`https://www.google.com/maps/dir/${path}`,"_blank")

  }

  const routeJobs = optimizedJobs.length ? optimizedJobs : jobs

  const center = routeJobs.length
    ? {lat:routeJobs[0].lat,lng:routeJobs[0].lng}
    : {lat:57.7089,lng:11.9746}

  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between flex-wrap gap-4">

        <h1 className="text-2xl font-bold flex items-center gap-2">

          <Route className="h-6 w-6 text-primary"/>

          Ruttplanering – {format(new Date(),"d MMMM",{locale:sv})}

        </h1>

        <div className="flex items-center gap-4">

          <div className="flex items-center gap-2">

            <Switch
              id="avoid-hw"
              checked={avoidHighways}
              onCheckedChange={setAvoidHighways}
            />

            <Label htmlFor="avoid-hw" className="text-xs">
              Undvik motorvägar
            </Label>

          </div>

          {routeJobs.length > 1 && (

            <Button
              size="sm"
              onClick={startFullRoute}
              className="gap-2"
            >
              <Navigation className="h-4 w-4"/>
              Starta rutt
            </Button>

          )}

        </div>

      </div>

      {loading ? (

        <div className="flex justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary"/>
        </div>

      ) : (

        <>

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

          <div className="grid gap-3">

            {routeJobs.map((job,index)=>{

              const statusColor =
                job.status==="done"
                  ? "text-success"
                  : "text-destructive"

              return(

                <Card key={job.id}>

                  <CardContent className="p-4 flex items-center gap-4">

                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                      {index+1}
                    </div>

                    <div className="flex-1">

                      <p className="font-medium text-sm">{job.name}</p>

                      <p className="text-xs text-muted-foreground">
                        {job.address}
                      </p>

                      <Badge
                        variant="outline"
                        className={`text-[10px] mt-1 ${statusColor}`}
                      >
                        {job.status==="done" ? "Klar" : "Ej klar"}
                      </Badge>

                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={()=>openNavigation(job)}
                    >
                      <ExternalLink className="h-3 w-3"/>
                      Navigera
                   
