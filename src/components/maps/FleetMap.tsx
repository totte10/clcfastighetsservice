import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

interface Job {
  id: string;
  lat?: number | null;
  lng?: number | null;
}

interface Worker {
  user_id: string;
  lat?: number | null;
  lng?: number | null;
}

const containerStyle = {
  width: "100%",
  height: "420px",
};

const center = {
  lat: 57.7089,
  lng: 11.9746,
};

export function FleetMap({ jobs = [], workers = [] }: { jobs?: Job[]; workers?: Worker[] }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-[420px] bg-zinc-900 text-red-400">
        Google Maps API key saknas
      </div>
    );
  }

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-[420px] bg-zinc-900 text-red-400">
        Kunde inte ladda Google Maps
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-[420px] bg-zinc-900 text-zinc-400">Laddar karta...</div>;
  }

  const validJobs = (jobs || []).filter((j) => j?.lat && j?.lng);

  const validWorkers = (workers || []).filter((w) => w?.lat && w?.lng);

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={11}>
      {validJobs.map((job) => (
        <Marker
          key={job.id}
          position={{
            lat: Number(job.lat),
            lng: Number(job.lng),
          }}
        />
      ))}

      {validWorkers.map((worker) => (
        <Marker
          key={worker.user_id}
          position={{
            lat: Number(worker.lat),
            lng: Number(worker.lng),
          }}
          icon={{
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          }}
        />
      ))}
    </GoogleMap>
  );
}
