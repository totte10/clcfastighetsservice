import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Play, Square, Check } from "lucide-react";

export default function JobDetails() {

  const { id } = useParams();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);



  async function loadJob() {

    if (!id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error loading job:", error);
      setLoading(false);
      return;
    }

    setJob(data);
    setLoading(false);

  }



  useEffect(() => {
    loadJob();
  }, [id]);



  async function startTimeTracking() {

    if (!id) return;

    const start = new Date().toISOString();

    setRunning(true);

    const { error } = await supabase
      .from("user_time_entries")
      .insert({
        project_id: id,
        start_time: start
      });

    if (error) console.error(error);

  }



  async function stopTimeTracking() {

    if (!id) return;

    const end = new Date().toISOString();

    setRunning(false);

    const { error } = await supabase
      .from("user_time_entries")
      .update({ end_time: end })
      .eq("project_id", id)
      .is("end_time", null);

    if (error) console.error(error);

  }



  async function markDone() {

    if (!id) return;

    const { error } = await supabase
      .from("projects")
      .update({ status: "done" })
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    loadJob();

  }



  async function uploadPhoto(e: any) {

    if (!id) return;

    const file = e.target.files?.[0];
    if (!file) return;

    const filePath = `${id}/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from("job-images")
      .upload(filePath, file);

    if (error) console.error(error);

  }



  if (loading) {
    return <p className="p-4">Laddar uppdrag...</p>;
  }

  if (!job) {
    return <p className="p-4">Uppdrag hittades inte.</p>;
  }



  return (

    <div className="space-y-6">

      {/* JOB INFO */}

      <Card>

        <CardHeader>
          <CardTitle>{job.name}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">

          <p className="text-sm text-muted-foreground">
            {job.address}
          </p>

          <p className="text-sm">
            Status: {job.status}
          </p>

        </CardContent>

      </Card>



      {/* TIME TRACKING */}

      <Card>

        <CardHeader>
          <CardTitle>Tidrapport</CardTitle>
        </CardHeader>

        <CardContent className="flex gap-3">

          {!running && (
            <Button onClick={startTimeTracking} className="gap-2">
              <Play size={16} />
              Starta tid
            </Button>
          )}

          {running && (
            <Button onClick={stopTimeTracking} className="gap-2">
              <Square size={16} />
              Stoppa tid
            </Button>
          )}

        </CardContent>

      </Card>



      {/* IMAGE UPLOAD */}

      <Card>

        <CardHeader>
          <CardTitle>Bilder</CardTitle>
        </CardHeader>

        <CardContent>

          <input
            type="file"
            accept="image/*"
            onChange={uploadPhoto}
          />

        </CardContent>

      </Card>



      {/* COMPLETE JOB */}

      <Button
        onClick={markDone}
        className="w-full gap-2"
      >

        <Check size={16} />
        Markera klart

      </Button>

    </div>

  );

}