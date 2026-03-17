import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Play, Square, Check, RotateCcw } from "lucide-react";

export default function JobDetails() {

  const { id } = useParams();
  const { user } = useAuth();

  const [job, setJob] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const [deponi, setDeponi] = useState("");
  const [comment, setComment] = useState("");
  const [image, setImage] = useState<any>(null);

  async function loadJob() {
    if (!id) return;
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    setJob(data);
  }

  useEffect(() => {
    loadJob();
  }, [id]);

  async function startTime() {
    if (!id || !user) return;
    setRunning(true);
    await supabase.from("user_time_entries").insert([{
      user_id: user.id,
      start_time: new Date().toISOString(),
      project: id,
    }]);
  }

  async function stopTime() {
    if (!id || !user) return;
    setRunning(false);
    await supabase
      .from("user_time_entries")
      .update({
        end_time: new Date().toISOString(),
        notes: comment,
      })
      .eq("user_id", user.id)
      .eq("project", id)
      .is("end_time", null);
  }

  async function uploadImage() {
    if (!image || !id) return;
    const filePath = `${id}/${Date.now()}_${image.name}`;
    await supabase.storage
      .from("job-images")
      .upload(filePath, image);
  }

  async function markDone() {
    await uploadImage();
    await supabase
      .from("projects")
      .update({ status: "done" })
      .eq("id", id);
  }

  async function undoJob() {
    await supabase
      .from("projects")
      .update({ status: "pending" })
      .eq("id", id);
  }

  if (!job) {
    return <p className="p-6">Laddar uppdrag...</p>;
  }

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>{job.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{job.address}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tidsregistrering</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          {!running && (
            <Button onClick={startTime} className="gap-2">
              <Play size={16} /> Starta
            </Button>
          )}
          {running && (
            <Button onClick={stopTime} className="gap-2">
              <Square size={16} /> Stoppa
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Deponi</CardTitle></CardHeader>
        <CardContent>
          <select
            value={deponi}
            onChange={(e) => setDeponi(e.target.value)}
            className="w-full p-2 rounded-md bg-background border"
          >
            <option value="">Välj deponi</option>
            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
              <option key={n} value={n}>Deponi {n}</option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Kommentar</CardTitle></CardHeader>
        <CardContent>
          <Input
            placeholder="Skriv kommentar..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lägg till bild</CardTitle></CardHeader>
        <CardContent>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0])}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button className="flex-1 gap-2" onClick={markDone}>
          <Check size={16}/> Klar
        </Button>
        <Button variant="outline" className="flex-1 gap-2" onClick={undoJob}>
          <RotateCcw size={16}/> Ångra
        </Button>
      </div>
    </div>
  );
}
