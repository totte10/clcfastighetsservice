import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GoogleMapView } from "@/components/GoogleMapView";
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
import { FolderOpen, Plus, Search, Map, Loader2, Trash2, Hash, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkerAssignment } from "@/components/WorkerAssignment";

type Status = "pending" | "in-progress" | "done";

interface Project {
  id: string;
  project_number: string;
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
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState("");
  const [form, setForm] = useState({ name: "", address: "", description: "", project_number: "" });
  const { toast } = useToast();

  const loadProjects = useCallback(async () => {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (error) { console.error(error); return; }
    setProjects(
      (data ?? []).map((r) => ({
        id: r.id,
        project_number: r.project_number,
        name: r.name,
        address: r.address,
        description: r.description,
        status: r.status as Status,
        lat: r.lat,
        lng: r.lng,
        images: r.images ?? [],
      }))
    );
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  useEffect(() => {
    const channel = supabase
      .channel("projects_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => loadProjects())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
    if (error) { toast({ title: "Kunde inte skapa projekt", variant: "destructive" }); return; }
    toast({ title: "Projekt skapat!" });
    setShowDialog(false);
    setForm({ name: "", address: "", description: "", project_number: "" });
    loadProjects();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
        await supabase.from("projects").update({ lat: coords.lat, lng: coords.lng }).eq("id", p.id);
      }
      if (i < toGeocode.length - 1) await new Promise((r) => setTimeout(r, 1100));
    }
    setGeocoding(false);
    setGeocodeProgress("");
    loadProjects();
  }, [projects, loadProjects]);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.project_number.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [projects, search]);

  const mapMarkers = useMemo(
    () => projects.filter((p) => p.lat != null && p.lng != null).map((p) => ({
      lat: p.lat!, lng: p.lng!, label: `${p.project_number} - ${p.name}`, color: getMarkerColor(p.status), id: p.id,
    })),
    [projects]
  );

  const done = projects.filter((p) => p.status === "done").length;
  const inProgress = projects.filter((p) => p.status === "in-progress").length;
  const geocodedCount = projects.filter((p) => p.lat != null).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projekt</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {done}/{projects.length} klara · {inProgress} pågår
          </p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          className="gap-2"
          style={{ background: "linear-gradient(135deg,#F4A261,#E76F51)" }}
        >
          <Plus className="h-4 w-4" /> Nytt projekt
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-primary">{done}</p>
            <p className="text-xs text-muted-foreground">Klara</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{inProgress}</p>
            <p className="text-xs text-muted-foreground">Pågår</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-red-400">{projects.length - done - inProgress}</p>
            <p className="text-xs text-muted-foreground">Ej påbörjad</p>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Map className="h-4 w-4 text-primary" /> Karta ({geocodedCount}/{projects.length})
            </CardTitle>
            {geocodedCount < projects.length && (
              <Button size="sm" variant="outline" onClick={handleGeocodeAll} disabled={geocoding} className="gap-2 h-7 text-xs">
                {geocoding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Map className="h-3 w-3" />}
                {geocoding ? geocodeProgress || "Söker..." : "Hämta positioner"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <GoogleMapView markers={mapMarkers} height="260px" zoom={10} />
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sök namn, adress, projektnummer..." className="pl-10" />
      </div>

      {/* Project list */}
      <div className="space-y-2">
        {filteredProjects.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {search ? `Inga resultat för "${search}"` : "Inga projekt ännu. Klicka 'Nytt projekt' för att skapa."}
          </p>
        )}
        {filteredProjects.map((project) => (
          <button
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`)}
            className="w-full text-left transition-all duration-150 active:scale-[0.99]"
          >
            <div
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(244,162,97,0.1)" }}
              >
                <FolderOpen size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] tracking-wider uppercase text-primary font-semibold">
                    #{project.project_number}
                  </span>
                  <StatusBadge status={project.status} />
                  {project.lat != null && <span className="text-[10px] text-emerald-400">📍</span>}
                </div>
                <p className="text-sm font-semibold text-foreground leading-tight truncate">{project.name}</p>
                <p className="text-xs text-muted-foreground truncate">{project.address}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground/40 flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {/* New project dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nytt projekt</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Projektnamn *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="T.ex. Vinterunderhåll Kungsholmen" />
            </div>
            <div className="space-y-2">
              <Label>Adress *</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Gatuadress, stad" />
            </div>
            <div className="space-y-2">
              <Label>Projektnummer (lämna tomt för auto)</Label>
              <Input value={form.project_number} onChange={(e) => setForm({ ...form, project_number: e.target.value })} placeholder="T.ex. P-2026-0001" />
            </div>
            <div className="space-y-2">
              <Label>Beskrivning</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Avbryt</Button>
            <Button onClick={handleAdd} style={{ background: "linear-gradient(135deg,#F4A261,#E76F51)" }}>Skapa projekt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
