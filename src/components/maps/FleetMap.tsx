import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"

interface Job {
  id: string
  lat?: number | null
  lng?: number | null
}

const containerStyle = {
  width: "100%",
  height: "420px"
}

const center = {
  lat: 57.7089,
  lng: 11.9746
}

export function FleetMap({ jobs = [] }: { jobs?: Job[] }) {

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey || ""
  })

  if (!apiKey) {
    return (
      <div className="h-[420px] flex items-center justify-center text-zinc-400">
        Google Maps API key saknas
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-[420px] flex items-center justify-center text-zinc-400">
        Laddar karta...
      </div>
    )
  }

  const validJobs =
    jobs.filter(j => j?.lat && j?.lng)

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={11}
    >

      {validJobs.map(job => (

        <Marker
          key={job.id}
          position={{
            lat: Number(job.lat),
            lng: Number(job.lng)
          }}
        />

      ))}

    </GoogleMap>
  )
}
