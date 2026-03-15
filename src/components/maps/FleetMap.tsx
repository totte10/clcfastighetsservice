import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"

const containerStyle = {
  width: "100%",
  height: "420px"
}

const center = {
  lat: 57.7089,
  lng: 11.9746
}

export function FleetMap({ jobs = [] }: any) {

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  })

  if (loadError) {
    return <div>Google Maps kunde inte laddas</div>
  }

  if (!isLoaded) {
    return <div>Laddar karta...</div>
  }

  const validJobs = jobs.filter((j:any)=> j.lat && j.lng)

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
