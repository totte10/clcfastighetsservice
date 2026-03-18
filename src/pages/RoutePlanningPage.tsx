import { useState, useEffect, useCallback } from "react"
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

import { format } from "date-fns"
import { sv } from "date-fns/locale"

import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  TrafficLayer,
  useLoadScript
} from "@react-google-maps/api"

interface Job {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  status: string
  date?: string
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
  const [optimized, setOptimized] = useState<Job[]>([])
  const [directions, setDirections] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [weather, setWeather] = useState<Weather | null>(null)

  const [selectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  )

  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  })

  /* 📍 GET USER GPS */

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        })
      },
      err => console.log("GPS error", err)
    )
  }, [])

  /* LOAD JOBS */

  const loadJobs = useCallback(async () => {

    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {

      const [projects, egna, tidx, optimal, tmm] = await Promise.all([

        supabase.from("projects").select("*"),
        supabase.from("egna_entries").select("*"),
        supabase.from("tidx_entries").select("*"),
        supabase.from("optimal_entries").select("*"),
        supabase.from("tmm_entries").select("*")

      ])

      const list: Job[] = []

      const addJob = (job: Job) => {
        if (!job.lat || !job.lng) return
        if (job.date !== selectedDate) return
        if (job.status === "done") return
        list.push(job)
      }

      ;(projects.data ?? []).forEach(r => {
        addJob({
          id: r.id,
          name: r.name || "Projekt",
          address: r.address || "",
          lat: Number(r.lat),
          lng: Number(r.lng),
          status: r.status === "done" ? "done" : "pending",
          type: "project",
          date: r.datum_planerat?.slice(0, 10)
        })
      })

      ;(egna.data ?? []).forEach(r => {
        const done = r.blow_status === "done" && r.sweep_status === "done"

        addJob({
          id: r.id,
          name: "Egna område",
          address: r.address || "",
          lat: Number(r.lat),
          lng: Number(r.lng),
          status: done ? "done" : "pending",
          type: "egna",
          date: r.datum_planerat?.slice(0, 10)
        })
      })

      ;(tidx.data ?? []).forEach(r => {
        addJob({
          id: r.id,
          name: r.omrade || "Tidx",
          address: r.address || "",
          lat: Number(r.lat),
          lng: Number(r.lng),
          status: r.status === "done" ? "done" : "pending",
          type: "tidx",
          date: r.datum_planerat?.slice(0, 10)
        })
      })

      ;(optimal.data ?? []).forEach(r => {
        addJob({
          id: r.id,
          name: r.name || "Optimal",
          address: r.address || "",
          lat: Number(r.lat),
          lng: Number(r.lng),
          status: r.status === "done" ? "done" : "pending",
          type: "optimal",
          date: r.datum_start?.slice(0, 10)
        })
      })

      ;(tmm.data ?? []).forEach(r => {
        addJob({
          id: r.id,
          name: r.beskrivning || "TMM",
          address: r.address || "",
          lat: Number(r.lat),
          lng: Number(r.lng),
          status: r.status === "done" ? "done" : "pending",
          type: "tmm",
          date: r.datum?.slice(0, 10)
        })
      })

      setJobs(list)

    } catch (e) {
      console.log(e)
    }

    setLoading(false)

  }, [user, selectedDate])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  /* WEATHER */

  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=57.7089&longitude=11.9746&current=temperature_2m,precipitation,wind_speed_10m")
      .then(r => r.json())
      .then(data => {
        setWeather({
          temp: data.current.temperature_2m,
          rain: data.current.precipitation,
          wind: data.current.wind_speed_10m
        })
      })
  }, [])

  /* 🚀 ROUTE OPTIMIZATION */

  useEffect(() => {

    if (!isLoaded) return
    if (jobs.length === 0) return

    const directionsService = new window.google.maps.DirectionsService()

    const origin = userLocation || {
      lat: jobs[0].lat,
      lng: jobs[0].lng
    }

    const destination = jobs[jobs.length - 1]

    const waypoints = jobs.slice(0, -1).map(j => ({
      location: { lat: j.lat, lng: j.lng }
    }))

    directionsService.route({
      origin,
      destination,
      waypoints,
      optimizeWaypoints: true,
      travelMode: window.google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: "bestguess"
      }
    },
      (result, status) => {

        if (status === "OK" && result) {

          setDirections(result)

          const order = result.routes[0].waypoint_order

          const optimizedRoute = [
            ...order.map((i: number) => jobs[i]),
            destination
          ]

          setOptimized(optimizedRoute)

        }

      })

  }, [jobs, isLoaded, userLocation])

  const routeJobs = optimized.length ? optimized : jobs

  const center = routeJobs.length
    ? { lat: routeJobs[0].lat, lng: routeJobs[0].lng }
    : { lat: 57.7089, lng: 11.9746 }

  return (

    <div className="space-y-6">

      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Route className="h-6 w-6" />
        Ruttplanering – {format(new Date(), "d MMMM", { locale: sv })}
      </h1>

      {/* WEATHER */}

      {weather && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <Card><CardContent className="p-4 flex gap-3">
            <Thermometer /> {weather.temp}°C
          </CardContent></Card>

          <Card><CardContent className="p-4 flex gap-3">
            <CloudRain /> {weather.rain} mm
          </CardContent></Card>

          <Card><CardContent className="p-4 flex gap-3">
            <Wind /> {weather.wind} m/s
          </CardContent></Card>

        </div>
      )}

      {/* MAP */}

      {!isLoaded ? (
        <Loader2 className="animate-spin" />
      ) : (
        <div className="h-[420px] rounded-xl overflow-hidden">

          <GoogleMap
            zoom={11}
            center={center}
            mapContainerStyle={{ width: "100%", height: "100%" }}
          >

            <TrafficLayer />

            {routeJobs.map((job, i) => (
              <Marker
                key={job.id}
                position={{ lat: job.lat, lng: job.lng }}
                label={{ text: String(i + 1), color: "#fff" }}
              />
            ))}

            {directions && <DirectionsRenderer directions={directions} />}

          </GoogleMap>

        </div>
      )}

      {/* JOB LIST */}

      {routeJobs.map((job, i) => (
        <Card key={job.id}>
          <CardContent className="p-4 flex justify-between">

            <div>
              <p>{i + 1}. {job.name}</p>
              <p className="text-xs">{job.address}</p>
            </div>

            <Button
              onClick={() =>
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`)
              }
            >
              <Navigation />
            </Button>

          </CardContent>
        </Card>
      ))}

    </div>
  )
}