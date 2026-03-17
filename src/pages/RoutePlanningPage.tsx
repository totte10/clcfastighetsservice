import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import {
  Route,
  Loader2,
  Navigation,
  CloudRain,
  Wind,
  Thermometer
} from "lucide-react"

import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  TrafficLayer,
  Polygon,
  useLoadScript
} from "@react-google-maps/api"

interface Job {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  status: string
  type: string
}

interface Weather {
  temp: number
  rain: number
  wind: number
}

export default function RoutePlanningPage() {

  const { user } = useAuth()

  const [jobs, setJobs] = useState<Job[]>([])
  const [directions, setDirections] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [weather, setWeather] = useState<Weather | null>(null)

  const [area, setArea] = useState<any[]>([]) // 🔥 AI AREA

  const mapRef = useRef<any>(null)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  })

  /* ---------------- LOAD JOBS ---------------- */

  const loadJobs = useCallback(async () => {

    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {

      const { data } = await supabase
        .from("projects")
        .select("id,name,address,lat,lng,status")

      const list: Job[] = []

      ;(data ?? []).forEach(r => {

        if (!r.lat || !r.lng) return

        list.push({
          id: r.id,
          name: r.name || "Projekt",
          address: r.address || "",
          lat: Number(r.lat),
          lng: Number(r.lng),
          status: r.status === "done" ? "done" : "pending",
          type: "project"
        })

      })

      setJobs(list)

    } catch (e) {
      console.log("Job load error", e)
    }

    setLoading(false)

  }, [user])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])


  /* ---------------- WEATHER ---------------- */

  useEffect(() => {

    async function loadWeather() {

      try {

        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=57.7089&longitude=11.9746&current=temperature_2m,precipitation,wind_speed_10m"
        )

        const data = await res.json()

        if (!data?.current) return

        setWeather({
          temp: data.current.temperature_2m,
          rain: data.current.precipitation,
          wind: data.current.wind_speed_10m
        })

      } catch {
        console.log("Weather error")
      }

    }

    loadWeather()

  }, [])


  /* ---------------- ROUTE ---------------- */

  useEffect(() => {

    if (!isLoaded || jobs.length < 2) return

    const service = new window.google.maps.DirectionsService()

    service.route({

      origin: jobs[0],
      destination: jobs[jobs.length - 1],
      waypoints: jobs.slice(1, -1).map(j => ({
        location: { lat: j.lat, lng: j.lng }
      })),
      optimizeWaypoints: true,
      travelMode: window.google.maps.TravelMode.DRIVING

    },
      (result, status) => {

        if (status === "OK" && result) {
          setDirections(result)
        }

      })

  }, [jobs, isLoaded])


  /* ---------------- AI AREA ---------------- */

  async function createAreaFromAddress(address: string) {

    try {

      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`
      )

      const data = await res.json()

      if (!data.results?.length) return

      const loc = data.results[0].geometry.location

      const offset = 0.0003

      const polygon = [
        { lat: loc.lat + offset, lng: loc.lng - offset },
        { lat: loc.lat + offset, lng: loc.lng + offset },
        { lat: loc.lat - offset, lng: loc.lng + offset },
        { lat: loc.lat - offset, lng: loc.lng - offset },
      ]

      setArea(polygon)

      // 🔥 AUTO ZOOM
      if (mapRef.current) {
        mapRef.current.panTo({ lat: loc.lat, lng: loc.lng })
        mapRef.current.setZoom(15)
      }

    } catch (e) {
      console.log("Geocode error", e)
    }

  }

  /* 🔥 GLOBAL AI HOOK (kan anropas från chat) */

  useEffect(() => {

    ;(window as any).highlightAddress = (address: string) => {
      createAreaFromAddress(address)
    }

  }, [])


  /* ---------------- CENTER ---------------- */

  const center =
    jobs.length
      ? { lat: jobs[0].lat, lng: jobs[0].lng }
      : { lat: 57.7089, lng: 11.9746 }


  /* ---------------- UI ---------------- */

  return (

    <div className="space-y-6">

      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Route className="h-6 w-6" />
        Ruttplanering
      </h1>


      {/* WEATHER */}

      {weather && (

        <div className="grid grid-cols-3 gap-3">

          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <Thermometer size={16} />
              {weather.temp}°C
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <CloudRain size={16} />
              {weather.rain} mm
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <Wind size={16} />
              {weather.wind} m/s
            </CardContent>
          </Card>

        </div>

      )}


      {/* MAP */}

      {!isLoaded ? (

        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin" />
        </div>

      ) : (

        <div className="h-[420px] rounded-xl overflow-hidden border">

          <GoogleMap
            zoom={11}
            center={center}
            mapContainerStyle={{ width: "100%", height: "100%" }}
            onLoad={(map) => (mapRef.current = map)}
          >

            <TrafficLayer />

            {/* MARKERS */}

            {jobs.map((job, i) => (
              <Marker
                key={job.id}
                position={{ lat: job.lat, lng: job.lng }}
                label={{ text: String(i + 1), color: "#fff" }}
              />
            ))}

            {/* ROUTE */}

            {directions && <DirectionsRenderer directions={directions} />}

            {/* 🔥 AREA */}

            {area.length > 0 && (
              <Polygon
                paths={area}
                options={{
                  fillColor: "#22c55e",
                  fillOpacity: 0.3,
                  strokeColor: "#22c55e",
                  strokeWeight: 2
                }}
              />
            )}

          </GoogleMap>

        </div>

      )}


      {/* JOB LIST */}

      <div className="grid gap-3">

        {jobs.map((job, i) => (

          <Card key={job.id}>

            <CardContent className="p-4 flex items-center gap-4">

              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {i + 1}
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium">{job.name}</p>
                <p className="text-xs text-muted-foreground">{job.address}</p>

                <Badge className="text-[10px] mt-1">
                  {job.status === "done" ? "Klar" : "Ej klar"}
                </Badge>
              </div>

              <Button
                size="sm"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`
                  )
                }
              >
                <Navigation size={16} />
              </Button>

            </CardContent>

          </Card>

        ))}

      </div>

    </div>

  )

}