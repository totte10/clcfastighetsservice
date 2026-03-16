import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { MapPin, Navigation, Loader2, CloudSnow, CloudRain, Wind } from "lucide-react"

import { format } from "date-fns"
import { sv } from "date-fns/locale"

import { useLoadScript } from "@react-google-maps/api"

import AdvancedMap from "@/components/AdvancedMap"

interface Job {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  status: string
  type: string
  date?: string | null
}

interface Weather {
  temp: number
  rain: number
  wind: number
}

export default function Dashboard() {

  const { user } = useAuth()

  const [jobs,setJobs] = useState<Job[]>([])
  const [loading,setLoading] = useState(true)
  const [weather,setWeather] = useState<Weather | null>(null)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  })

  /* ---------------- LOAD JOBS ---------------- */

  const loadJobs = useCallback(async () => {

    if(!user) return

    setLoading(true)

    try{

      const [projects,tidx,egna] = await Promise.all([

        supabase
          .from("projects")
          .select("id,name,address,lat,lng,status,datum_planerat"),

        supabase
          .from("tidx_entries")
          .select("id,omrade,address,lat,lng,status,datum_planerat"),

        supabase
          .from("egna_entries")
          .select("id,address,lat,lng,datum_planerat,blow_status,sweep_status")

      ])

      const points:Job[] = []

      /* PROJECTS */

      projects.data?.forEach(r => {

        if(r.lat !== null && r.lng !== null){

          points.push({
            id:r.id,
            name:r.name ?? "Projekt",
            address:r.address ?? "",
            lat:r.lat,
            lng:r.lng,
            status:r.status ?? "pending",
            type:"project",
            date:r.datum_planerat
          })

        }

      })

      /* TIDX */

      tidx.data?.forEach(r => {

        if(r.lat !== null && r.lng !== null){

          points.push({
            id:r.id,
            name:r.omrade ?? "Tidx",
            address:r.address ?? "",
            lat:r.lat,
            lng:r.lng,
            status:r.status ?? "pending",
            type:"tidx",
            date:r.datum_planerat
          })

        }

      })

      /* EGNA */

      egna.data?.forEach(r => {

        if(r.lat !== null && r.lng !== null){

          const done =
            r.blow_status === "done" &&
            r.sweep_status === "done"

          points.push({
            id:r.id,
            name:"Egna område",
            address:r.address ?? "",
            lat:r.lat,
            lng:r.lng,
            status:done ? "done" : "pending",
            type:"egna",
            date:r.datum_planerat
          })

        }

      })

      setJobs(points)

    }catch(err){

      console.error("Load jobs error:",err)

    }

    setLoading(false)

  },[user])

  useEffect(()=>{
    loadJobs()
  },[loadJobs])


  /* ---------------- WEATHER ---------------- */

  const loadWeather = async () => {

    try{

      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=57.7089&longitude=11.9746&current=temperature_2m,precipitation,wind_speed_10m"
      )

      const data = await res.json()

      if(!data || !data.current) return

      setWeather({
        temp:data.current.temperature_2m ?? 0,
        rain:data.current.precipitation ?? 0,
        wind:data.current.wind_speed_10m ?? 0
      })

    }catch(err){

      console.log("Weather error",err)

    }

  }

  useEffect(()=>{
    loadWeather()
  },[])


  /* ---------------- NAVIGATION ---------------- */

  const openNavigation = (job:Job) => {

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`,
      "_blank"
    )

  }


  /* ---------------- DATE SAFE ---------------- */

  const safeDate = (date?:string | null) => {

    if(!date) return null

    const parsed = Date.parse(date)

    if(isNaN(parsed)) return null

    return format(new Date(parsed),"d MMM",{locale:sv})

  }


  return(

    <div className="space-y-6">

      {/* HEADER */}

      <div>

        <h1 className="text-2xl font-bold">
          Operations Center
        </h1>

        <p className="text-sm text-muted-foreground">
          {format(new Date(),"EEEE d MMMM",{locale:sv})}
        </p>

      </div>


      {/* WEATHER */}

      {weather && (

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CloudSnow className="w-5 h-5 text-blue-500"/>
              <div>
                <p className="text-xs text-muted-foreground">Temperatur</p>
                <p className="font-semibold">{weather.temp}°C</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CloudRain className="w-5 h-5 text-blue-400"/>
              <div>
                <p className="text-xs text-muted-foreground">Nederbörd</p>
                <p className="font-semibold">{weather.rain} mm</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Wind className="w-5 h-5 text-gray-400"/>
              <div>
                <p className="text-xs text-muted-foreground">Vind</p>
                <p className="font-semibold">{weather.wind} m/s</p>
              </div>
            </CardContent>
          </Card>

        </div>

      )}


      {/* MAP */}

      {loading ? (

        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin"/>
        </div>

      ) : (

        isLoaded && (
          <AdvancedMap
            jobs={jobs}
            directions={null}
          />
        )

      )}


      {/* JOB LIST */}

      <div className="grid gap-3">

        {jobs.map(job => {

          const isDone = job.status === "done"

          return(

            <Card key={`${job.type}-${job.id}`}>

              <CardContent className="p-4 flex items-center gap-4">

                <MapPin className="w-4 h-4 text-muted-foreground"/>

                <div className="flex-1">

                  <p className="font-medium text-sm">
                    {job.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {job.address}
                  </p>

                  {safeDate(job.date) && (

                    <p className="text-[10px] text-muted-foreground mt-1">
                      {safeDate(job.date)}
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
                  <Navigation className="w-4 h-4"/>
                </Button>

              </CardContent>

            </Card>

          )

        })}

      </div>

    </div>

  )

}
