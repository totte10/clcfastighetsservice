import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
  MapPin,
  Navigation,
  Loader2,
  CloudRain,
  Wind,
  Thermometer
} from "lucide-react"

import { format } from "date-fns"
import { sv } from "date-fns/locale"

import {
  GoogleMap,
  Marker,
  TrafficLayer,
  useLoadScript
} from "@react-google-maps/api"

interface Job{
  id:string
  name:string
  address:string
  lat:number
  lng:number
  status:string
  type:string
}

interface Weather{
  temp:number
  rain:number
  wind:number
}

export default function Dashboard(){

  const { user } = useAuth()

  const [jobs,setJobs] = useState<Job[]>([])
  const [loading,setLoading] = useState(true)
  const [weather,setWeather] = useState<Weather | null>(null)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  })


  /* LOAD JOBS */

  const loadJobs = useCallback(async()=>{

    if(!user) return

    setLoading(true)

    const [projects,tidx,egna] = await Promise.all([

      supabase.from("projects")
      .select("id,name,address,lat,lng,status"),

      supabase.from("tidx_entries")
      .select("id,omrade,address,lat,lng,status"),

      supabase.from("egna_entries")
      .select("id,address,lat,lng,blow_status,sweep_status")

    ])

    const list:Job[] = []

    ;(projects.data ?? []).forEach(r=>{

      if(!r.lat || !r.lng) return

      list.push({
        id:r.id,
        name:r.name ?? "Projekt",
        address:r.address ?? "",
        lat:Number(r.lat),
        lng:Number(r.lng),
        status:r.status ?? "pending",
        type:"project"
      })

    })

    ;(tidx.data ?? []).forEach(r=>{

      if(!r.lat || !r.lng) return

      list.push({
        id:r.id,
        name:r.omrade ?? "Tidx område",
        address:r.address ?? "",
        lat:Number(r.lat),
        lng:Number(r.lng),
        status:r.status ?? "pending",
        type:"tidx"
      })

    })

    ;(egna.data ?? []).forEach(r=>{

      if(!r.lat || !r.lng) return

      const done =
        r.blow_status === "done" &&
        r.sweep_status === "done"

      list.push({
        id:r.id,
        name:"Egna område",
        address:r.address ?? "",
        lat:Number(r.lat),
        lng:Number(r.lng),
        status: done ? "done" : "pending",
        type:"egna"
      })

    })

    setJobs(list)
    setLoading(false)

  },[user])


  useEffect(()=>{
    loadJobs()
  },[loadJobs])


  /* WEATHER */

  const loadWeather = async()=>{

    try{

      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=57.7089&longitude=11.9746&current=temperature_2m,precipitation,wind_speed_10m"
      )

      const data = await res.json()

      if(!data?.current) return

      setWeather({
        temp:data.current.temperature_2m,
        rain:data.current.precipitation,
        wind:data.current.wind_speed_10m
      })

    }catch{
      console.log("Weather error")
    }

  }

  useEffect(()=>{
    loadWeather()
  },[])


  /* NAVIGATION */

  const openNavigation = (job:Job)=>{

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`,
      "_blank"
    )

  }


  /* MAP CENTER */

  const center =
    jobs.length > 0
      ? {lat:jobs[0].lat,lng:jobs[0].lng}
      : {lat:57.7089,lng:11.9746}


  /* SLIP RISK */

  const slipRisk =
    weather &&
    weather.temp <= 0 &&
    weather.rain > 0


  return(

    <div className="space-y-6">

      {/* HEADER */}

      <div>

        <h1 className="text-2xl font-bold">
          Operations Center
        </h1>

        <p className="text-sm text-muted-foreground">
          {format(
            new Date(Date.now() + 2 * 60 * 60 * 1000),
            "EEEE d MMMM HH:mm",
            {locale:sv}
          )}
        </p>

      </div>


      {/* WEATHER */}

      {weather && (

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Thermometer className="w-5 h-5 text-orange-500"/>
              <div>
                <p className="text-xs text-muted-foreground">
                  Temperatur
                </p>
                <p className="font-semibold">{weather.temp}°C</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CloudRain className="w-5 h-5 text-blue-500"/>
              <div>
                <p className="text-xs text-muted-foreground">
                  Nederbörd
                </p>
                <p className="font-semibold">{weather.rain} mm</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Wind className="w-5 h-5 text-gray-500"/>
              <div>
                <p className="text-xs text-muted-foreground">
                  Vind
                </p>
                <p className="font-semibold">{weather.wind} m/s</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center">
              {slipRisk ? (
                <Badge variant="destructive">Halkrisk</Badge>
              ) : (
                <Badge variant="outline">Normal drift</Badge>
              )}
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

          <div className="h-[420px] w-full rounded-xl overflow-hidden border">

            <GoogleMap
              zoom={11}
              center={center}
              mapContainerStyle={{
                width:"100%",
                height:"100%"
              }}
              options={{
                fullscreenControl:false,
                streetViewControl:false,
                mapTypeControl:true
              }}
            >

              <TrafficLayer />

              {jobs.map((job,index)=>(

                <Marker
                  key={job.id}
                  position={{lat:job.lat,lng:job.lng}}
                  label={{
                    text:String(index+1),
                    color:"#fff"
                  }}
                />

              ))}

            </GoogleMap>

          </div>

        )

      )}


      {/* JOB LIST */}

      <div className="grid gap-3">

        {jobs.map(job=>{

          const done = job.status === "done"

          return(

            <Card key={`${job.type}-${job.id}`}>

              <CardContent className="p-4 flex items-center gap-4">

                <MapPin className="w-4 h-4 text-muted-foreground"/>

                <div className="flex-1">

                  <p className="font-medium text-sm">{job.name}</p>

                  <p className="text-xs text-muted-foreground">
                    {job.address}
                  </p>

                  <Badge
                    variant="outline"
                    className={`text-[10px] mt-1 ${
                      done ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {done ? "Klar" : "Ej klar"}
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
