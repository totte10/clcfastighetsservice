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

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  })

  if (!isLoaded) return <div>Laddar karta...</div>

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={10}
    >

      {jobs.map((job:any)=>(
        <Marker
          key={job.id}
          position={{
            lat: job.lat,
            lng: job.lng
          }}
        />
      ))}

    </GoogleMap>
  )
}
