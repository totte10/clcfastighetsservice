import {
  GoogleMap,
  Marker,
  DirectionsRenderer
} from "@react-google-maps/api"

interface Job {
  id:string
  lat:number
  lng:number
  status:string
}

interface Props{
  jobs:Job[]
  directions:any
}

export default function AdvancedMap({jobs,directions}:Props){

  const center =
    jobs.length > 0
      ? {lat:Number(jobs[0].lat),lng:Number(jobs[0].lng)}
      : {lat:57.7089,lng:11.9746}

  return(

    <div className="h-[400px] w-full rounded-xl overflow-hidden border">

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

        {jobs?.map((job,index)=>{

          if(!job.lat || !job.lng) return null

          const color =
            job.status === "done"
              ? "#22c55e"
              : "#ef4444"

          return(

            <Marker
              key={job.id}
              position={{
                lat:Number(job.lat),
                lng:Number(job.lng)
              }}
              label={{
                text:String(index+1),
                color:"#fff"
              }}
            />

          )

        })}

        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers:true
            }}
          />
        )}

      </GoogleMap>

    </div>

  )

}
