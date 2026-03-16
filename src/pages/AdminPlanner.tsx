import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { GoogleMap, Marker, DirectionsRenderer, useLoadScript } from "@react-google-maps/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

export default function AdminPlanner() {

  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  });

  async function loadJobs() {

    const { data } = await supabase
      .from("projects")
      .select("*")
      .neq("status", "done");

    if (data) setJobs(data);

  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function buildRoute(job:any) {

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition((pos) => {

      const origin = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      const destination = {
        lat: job.lat,
        lng: job.lng
      };

      const directionsService = new google.maps.DirectionsService();

      directionsService.route(
        {
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === "OK") {
            setRoute(result);
          }
        }
      );

    });

  }

  if (!isLoaded) return <p>Laddar karta...</p>;

  return (

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">

      {/* MAP */}

      <div className="md:col-span-2">

        <GoogleMap
          zoom={11}
          center={{ lat: 59.3293, lng: 18.0686 }}
          mapContainerStyle={{ width: "100%", height: "600px" }}
        >

          {jobs.map(job => (

            <Marker
              key={job.id}
              position={{ lat: job.lat, lng: job.lng }}
              onClick={() => {
                setSelectedJob(job)
                buildRoute(job)
              }}
            />

          ))}

          {route && (
            <DirectionsRenderer directions={route}/>
          )}

        </GoogleMap>

      </div>

      {/* JOB LIST */}

      <div className="space-y-3">

        <Card>

          <CardHeader>
            <CardTitle>Uppdrag</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">

            {jobs.map(job => (

              <div
                key={job.id}
                className="p-3 rounded-lg border cursor-pointer"
                onClick={()=>{
                  setSelectedJob(job)
                  buildRoute(job)
                }}
              >

                <p className="font-medium">
                  {job.name}
                </p>

                <p className="text-xs text-muted-foreground">
                  {job.address}
                </p>

              </div>

            ))}

          </CardContent>

        </Card>

        {selectedJob && (

          <Card>

            <CardHeader>
              <CardTitle>{selectedJob.name}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">

              <Button
                className="w-full"
                onClick={()=>{
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${selectedJob.lat},${selectedJob.lng}`,
                    "_blank"
                  )
                }}
              >
                Start navigation
              </Button>

            </CardContent>

          </Card>

        )}

      </div>

    </div>

  );

}
