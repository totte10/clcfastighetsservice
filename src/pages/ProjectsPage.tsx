import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AreaMap } from "@/components/AreaMap";
import { EntryImageUpload } from "@/components/EntryImageUpload";
import { geocodeAddress } from "@/lib/geocode";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Map, Loader2, Trash2, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkerAssignment } from "@/components/WorkerAssignment";

type Status = "pending" | "in-progress" | "done";

interface Project {
  id: string;
  project_number?: string;
  name: string;
  address: string;
  description: string;
  status: Status;
  lat: number | null;
  lng: number | null;
  images: string[];
}

function getMarkerColor(status: Status): "green" | "orange" | "red" {
  if (status === "done") return "green";
  if (status === "in-progress") return "orange";
  return "red";
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState("");
  const [form, setForm] = useState({ name: "", address: "", description: "", project_number: "" });
  const { toast } = useToast();

  const loadProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setProjects(
      (data ?? []).map((r) => ({
        id: r.id,
        project_number: r.project_number ?? "",
        name: r.name,
        address: r.address,
        description: r.description ?? "",
        status: r.status as Status,
        lat: r.lat,
        lng: r.lng,
        images: r.images ?? [],
      }))
    );
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const channel = supabase
      .channel("projects_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => loadProjects())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadProjects]);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      toast({ title: "Fyll i namn och adress", variant: "destructive" });
      return;
    }

    const coords = await geocodeAddress(form.address);

    const { error } = await supabase.from("projects").insert({
      name: form.name,
      address: form.address,
      description: form.description,
      project_number: form.project_number || undefined,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    });

    if (error) {
      toast({ title: "Kunde inte skapa projekt", variant: "destructive" });
      return;
    }

    toast({ title: "Projekt skapat!" });

    setShowDialog(false);
    setForm({ name: "", address: "", description: "", project_number: "" });
    loadProjects();
  };

  const handleUpdate = async (id: string, updates: Partial<Project>) => {
    const mapped: Record<string, unknown> = {};

    if (updates.status !== undefined) mapped.status = updates.status;
    if (updates.description !== undefined) mapped.description = updates.description;
    if (updates.images !== undefined) mapped.images = updates.images;
    if (updates.project_number !== undefined) mapped.project_number = updates.project_number;

    await supabase.from("projects").update(mapped).eq("id", id);

    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleDelete = async (id: string) => {
    await supabase.from("projects").delete().eq("id", id);
    toast({ title: "Projekt borttaget!" });
    loadProjects();
  };

  const handleGeocodeAll = useCallback(async () => {
    const toGeocode = projects.filter((p) => p.lat == null || p.lng == null);

    if (toGeocode.length === 0) return;

    setGeocoding(true);

    for (let i = 0; i < toGeocode.length; i++) {
      const p = toGeocode[i];

      setGeocodeProgress(`${i + 1}/${toGeocode.length}: ${p.address}`);

      const coords = await geocodeAddress(p.address);

      if (coords) {
        await supabase
          .from("projects")
          .update({ lat: coords.lat, lng: coords.lng })
          .eq("id", p.id);
      }

      if (i < toGeocode.length - 1)
        await new Promise((r) => setTimeout(r, 1100));
    }

    setGeocoding(false);
    setGeocodeProgress("");
    loadProjects();
  }, [projects, loadProjects]);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;

    const q = search.toLowerCase();

    return projects.filter((p) =>
      `${p.name} ${p.address} ${p.project_number ?? ""} ${p.description ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [projects, search]);

  const mapMarkers = useMemo(
    () =>
      projects
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({
          lat: p.lat!,
          lng: p.lng!,
          label: `${p.project_number || "Projekt"} - ${p.name}`,
          color: getMarkerColor(p.status),
        })),
    [projects]
  );

  const done = projects.filter((p) => p.status === "done").length;
  const inProgress = projects.filter((p) => p.status === "in-progress").length;
  const geocodedCount = projects.filter((p) => p.lat != null).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projekt</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {done}/{projects.length} klara · {inProgress} pågår
          </p>
        </div>

        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nytt projekt
        </Button>
      </div>

      {/* Map */}
      <Card className="glass-card">
        <CardHeader className="pb-3 flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            Karta ({geocodedCount}/{projects.length})
          </CardTitle>

          {geocodedCount < projects.length && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleGeocodeAll}
              disabled={geocoding}
              className="gap-2"
            >
              {geocoding ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Map className="h-3 w-3" />
              )}
              {geocoding ? "Söker..." : "Hämta positioner"}
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {mapMarkers.length > 0 ? (
            <AreaMap
              className="h-72 md:h-96 w-full rounded-lg overflow-hidden"
              markers={mapMarkers}
            />
          ) : (
            <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Inga kartpositioner ännu
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök projekt..."
          className="pl-10"
        />
      </div>

    </div>
  );
}
