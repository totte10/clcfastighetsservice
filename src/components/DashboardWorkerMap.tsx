import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

interface MapJob {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
  type: string;
}

interface DashboardWorkerMapProps {
  jobs: MapJob[];
}

export function DashboardWorkerMap({ jobs }: DashboardWorkerMapProps) {

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  });

  const validJobs = jobs.filter(
    j => j.lat && j.lng && !isNaN(j.lat) && !isNaN(j.lng)
  );

  if (!isLoaded || validJobs.length === 0) return null;

  const center = {
    lat: validJobs[0].lat,
    lng: validJobs[0].lng
  };

  return (

    <div className="h-[320px] w-full rounded-2xl overflow-hidden">

      <GoogleMap
        zoom={11}
        center={center}
        mapContainerStyle={{
          width: "100%",
          height: "100%"
        }}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        }}
      >

        {validJobs.map(job => {

          const color =
            job.status === "done"
              ? "#22c55e"
              : job.status === "in-progress"
              ? "#f59e0b"
              : "#ef4444";

          return (
            <Marker
              key={job.id}
              position={{ lat: job.lat, lng: job.lng }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2
              }}
              title={`${job.name} - ${job.address}`}
            />
          );

        })}

      </GoogleMap>

    </div>

  );
}
