import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

import "leaflet/dist/leaflet.css";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Job {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  status: string;
}

export default function AdminPlanner() {

  const [jobs, setJobs] = useState<Job[]>([]);

  async function loadJobs() {

    const { data } = await supabase
      .from("projects")
      .select("*");

    if (!data) return;

    const formatted = data.map((j: any) => ({
      id: j.id,
      name: j.name,
      address: j.address,
      lat: j.lat,
      lng: j.lng,
      status: j.status
    }));

    setJobs(formatted);

  }

  useEffect(() => {
    loadJobs();
  }, []);

  const jobsWithCoords = jobs.filter(j => j.lat && j.lng);

  return (

    <div className="space-y-6">

      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-semibold">
          Planering
        </h1>

        <p className="text-sm text-muted-foreground">
          Planera uppdrag och rutter
        </p>
      </div>


      {/* MAP */}

      <Card>

        <CardHeader>
          <CardTitle>Karta</CardTitle>
        </CardHeader>

        <CardContent>

          <MapContainer
            center={[59.3293, 18.0686]}
            zoom={11}
            style={{ height: "400px", width: "100%" }}
          >

            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {jobsWithCoords.map(job => (

              <Marker key={job.id} position={[job.lat!, job.lng!]}>

                <Popup>

                  <strong>{job.name}</strong>

                  <p>{job.address}</p>

                  <p>Status: {job.status}</p>

                </Popup>

              </Marker>

            ))}

          </MapContainer>

        </CardContent>

      </Card>


      {/* JOB LIST */}

      <Card>

        <CardHeader>
          <CardTitle>Alla uppdrag</CardTitle>
        </CardHeader>

        <CardContent>

          <div className="space-y-2">

            {jobs.map(job => (

              <div
                key={job.id}
                className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
              >

                <div>

                  <p className="font-medium">
                    {job.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {job.address}
                  </p>

                </div>

                <span className="text-xs bg-primary/10 px-2 py-1 rounded">

                  {job.status}

                </span>

              </div>

            ))}

          </div>

        </CardContent>

      </Card>

    </div>

  );

}
