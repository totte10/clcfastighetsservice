import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Play, Square, Check } from "lucide-react";

export default function JobDetails() {

  const { id } = useParams();

  const [job, setJob] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<any>(null);

  async function loadJob() {

    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    setJob(data);

  }

  useEffect(() => {
    loadJob();
  }, []);

  async function startTimeTracking() {

    const start = new Date().toISOString();

    setStartTime(start);
    setRunning(true);

    await supabase.from("user_time_entries").insert({
      project_id: id,
      start_time: start
    });

  }

  async function stopTimeTracking() {

    const end = new Date().toISOString();

    setRunning(false);

    await supabase
      .from("user_time_entries")
      .update({ end_time: end })
      .eq("project_id", id)
      .is("end_time", null);

  }

  async function markDone() {

    await supabase
      .from("projects")
      .update({ status: "done" })
      .eq("id", id);

    loadJob();

  }

  async function uploadPhoto(e: any) {

    const file = e.target.files[0];

    if (!file) return;

    const filePath = `${id}/${Date.now()}_${file.name}`;

    await supabase.storage
      .from("job-images")
      .upload(filePath, file);

  }

  if (!job) return <p className="p-4">Loading...</p>;

  return (

    <div className="space-y-6">

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

          {!running &&

            <Button onClick={startTimeTracking} className="gap-2">

              <Play size={16} />
              Starta tid

            </Button>

          }

          {running &&

            <Button onClick={stopTimeTracking} className="gap-2">

              <Square size={16} />
              Stoppa tid

            </Button>

          }

        </CardContent>

      </Card>


      {/* UPLOAD IMAGE */}

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


      {/* MARK DONE */}

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
