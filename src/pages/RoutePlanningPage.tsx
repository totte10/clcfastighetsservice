import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { Route, Navigation, MapPin, Loader2, ExternalLink } from "lucide-react";

import { format } from "date-fns";
import { sv } from "date-fns/locale";

import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useLoadScript
} from "@react-google-maps/api";

interface JobPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
  type: string;
  order?: number;
}

function optimizeRoute(points: JobPoint[]): JobPoint[] {
  if (points.length <= 2) return points.map((p, i) => ({ ...p, order: i + 1 }));

  const visited = new Set<number>();
  const result: JobPoint[] = [];

  let current = 0;
  visited.add(0);
  result.push({ ...points[0], order: 1 });

  while (visited.size < points.length) {
    let nearest = -1;
    let minDist = Infinity;

    for (let i = 0; i < points.length; i++) {
      if (visited.has(i)) continue;

      const d = haversine(
        points[current].lat,
        points[current].lng,
        points[i].lat,
        points[i].lng
      );

      if (d < minDist) {
        minDist = d;
        nearest = i;
      }
    }

    if (nearest === -1) break;

    visited.add(nearest);
    current = nearest;

    result.push({
      ...points[nearest],
      order: result.length + 1
    });
  }

  return result;
}

function haversine(lat1:number, lon1:number, lat2:number, lon2:number) {
  const R = 6371;

  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;

  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2)**2;

  return R * 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

export default function RoutePlanningPage() {

  const { user } = useAuth();

  const [jobs,setJobs] = useState<JobPoint[]>([]);
  const [optimizedJobs,setOptimizedJobs] = useState<JobPoint[]>([]);
  const [loading,setLoading] = useState(true);

  const [directions,setDirections] = useState<any>(null);

  const [avoidHighways,setAvoidHighways] = useState(true);

  const todayStr = format(new Date(),"yyyy-MM-dd");

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  });

  const loadJobs = useCallback(async () => {

    if(!user) return;

    setLoading(true);

    const { data } = await supabase
      .from("projects")
      .select("id,name,address,lat,lng,status,datum_planerat");

    const points:JobPoint[] = [];

    (data ?? []).forEach(r => {

      if(r.lat && r.lng && (r.datum_planerat || "").startsWith(todayStr)){

        points.push({
          id:r.id,
          name:r.name,
          address:r.address,
          lat:r.lat,
          lng:r.lng,
          status:r.status,
          type:"project"
        });

      }

    });

    setJobs(points);

    const opt = optimizeRoute(points);

    setOptimizedJobs(opt);

    setLoading(false);

  },[user,todayStr]);

  useEffect(()=>{
    loadJobs();
  },[loadJobs]);

  useEffect(()=>{

    if(!isLoaded) return;

    if(optimizedJobs.length < 2) return;

    const directionsService = new google.maps.DirectionsService();

    const origin = {
      lat: optimizedJobs[0].lat,
      lng: optimizedJobs[0].lng
    };

    const destination = {
      lat: optimizedJobs[optimizedJobs.length-1].lat,
      lng: optimizedJobs[optimizedJobs.length-1].lng
    };

    const waypoints = optimizedJobs
      .slice(1,-1)
      .map(j => ({
        location:{lat:j.lat,lng:j.lng}
      }));

    directionsService.route({

      origin,
      destination,
      waypoints,

      travelMode: google.maps.TravelMode.DRIVING,

      avoidHighways: avoidHighways

    },
    (result,status)=>{

      if(status==="OK"){

        setDirections(result);

      }

    });

  },[optimizedJobs,avoidHighways,isLoaded]);

  const openNavigation = (job:JobPoint)=>{

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`,
      "_blank"
    );

  };

  const center = optimizedJobs.length
    ? {lat:optimizedJobs[0].lat,lng:optimizedJobs[0].lng}
    : {lat:57.7089,lng:11.9746};

  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between flex-wrap gap-4">

        <h1 className="text-2xl font-bold flex items-center gap-2">

          <Route className="h-6 w-6 text-primary"/>

          Ruttplanering – {format(new Date(),"d MMMM",{locale:sv})}

        </h1>

        <div className="flex items-center gap-4">

          <div className="flex items-center gap-2">

            <Switch
              id="avoid-hw"
              checked={avoidHighways}
              onCheckedChange={setAvoidHighways}
            />

            <Label htmlFor="avoid-hw" className="text-xs">
              Undvik motorvägar
            </Label>

          </div>

        </div>

      </div>

      {loading ? (

        <div className="flex justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary"/>
        </div>

      ) : (

        <>
          {isLoaded && (

            <div className="h-[400px] w-full rounded-xl overflow-hidden border">

              <GoogleMap

                zoom={11}

                center={center}

                mapContainerStyle={{
                  width:"100%",
                  height:"100%"
                }}

              >

                {optimizedJobs.map(job=>{

                  const color =
                    job.status==="done"
                      ? "#22c55e"
                      : job.status==="in-progress"
                      ? "#f59e0b"
                      : "#ef4444";

                  return(

                    <Marker

                      key={job.id}

                      position={{lat:job.lat,lng:job.lng}}

                      label={{
                        text:String(job.order),
                        color:"#fff"
                      }}

                      icon={{
                        path:google.maps.SymbolPath.CIRCLE,
                        scale:12,
                        fillColor:color,
                        fillOpacity:1,
                        strokeColor:"#fff",
                        strokeWeight:2
                      }}

                    />

                  );

                })}

                {directions && (

                  <DirectionsRenderer
                    directions={directions}
                  />

                )}

              </GoogleMap>

            </div>

          )}

          <div className="grid gap-3">

            {optimizedJobs.map(job=>{

              const statusColor =
                job.status==="done"
                  ? "text-success"
                  : job.status==="in-progress"
                  ? "text-warning"
                  : "text-destructive";

              return(

                <Card key={job.id}>

                  <CardContent className="p-4 flex items-center gap-4">

                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                      {job.order}
                    </div>

                    <div className="flex-1">

                      <p className="font-medium text-sm">{job.name}</p>

                      <p className="text-xs text-muted-foreground">
                        {job.address}
                      </p>

                      <Badge
                        variant="outline"
                        className={`text-[10px] mt-1 ${statusColor}`}
                      >

                        {job.status==="done"
                          ?"Klar"
                          :job.status==="in-progress"
                          ?"Påbörjad"
                          :"Ej påbörjad"}

                      </Badge>

                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={()=>openNavigation(job)}
                    >

                      <ExternalLink className="h-3 w-3"/>

                      Navigera

                    </Button>

                  </CardContent>

                </Card>

              );

            })}

          </div>

        </>

      )}

    </div>

  );

}
