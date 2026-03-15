import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"

const containerStyle = {
  width: "100%",
  height: "420px"
}

const defaultCenter = {
  lat: 57.7089,
  lng: 11.9746
}

export function FleetMap({ jobs = [] }: any) {

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY

  if (!apiKey) {
    return (
      <div style={{padding:20,color:"#f87171"}}>
        Google Maps API key saknas
      </div>
    )
  }

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey
  })

  if (loadError) {
    return (
      <div style={{padding:20,color:"#f87171"}}>
        Kunde inte ladda Google Maps
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div style={{padding:20,color:"#9ca3af"}}>
        Laddar karta...
      </div>
    )
  }

  const validJobs =
    Array.isArray(jobs)
      ? jobs.filter((job:any)=> job?.lat && job?.lng)
      : []

  const center =
    validJobs.length > 0
      ? {
          lat: Number(validJobs[0].lat),
          lng: Number(validJobs[0].lng)
        }
      : defaultCenter

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={10}
    >

      {validJobs.map((job:any)=>(
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
