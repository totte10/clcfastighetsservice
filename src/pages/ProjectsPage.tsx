import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AreaMap } from "@/components/AreaMap";
import { Map, Loader2, Search } from "lucide-react";

type Status = "pending" | "in-progress" | "done";

interface Project {
  id: string;
  source: string;
  name: string;
  address: string;
  status: Status;
  lat: number | null;
  lng: number | null;
}

function getMarkerColor(status: Status): "green" | "orange" | "red" {
  if (status === "done") return "green";
  if (status === "in-progress") return "orange";
  return "red";
}

export default function ProjectsPage() {

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * 🚀 Hämtar ALLA adresser från alla tabeller
   */
  const loadProjects = useCallback(async () => {

    setLoading(true);

    const sources = [
      { table: "tmm_entries", label: "TMM" },
      { table: "optimal_entries", label: "OPTIMAL" },
      { table: "egna_entries", label: "EGNA" },
      { table: "tidx_entries", label: "TIDX" }
    ];

    const results = await Promise.all(
      sources.map(async (s) => {

        const { data } = await supabase
          .from(s.table)
          .select("id,address,name,status,lat,lng")
          .order("created_at", { ascending: false });

        return (data || []).map((row: any) => ({
          id: row.id,
          source: s.label,
          name: row.name || "Adress",
          address: row.address || "",
          status: row.status || "pending",
          lat: row.lat,
          lng: row.lng
        }));

      })
    );

    const merged = results.flat();

    setProjects(merged);
    setLoading(false);

  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  /**
   * 🔎 Search filter
   */
  const filteredProjects = useMemo(() => {

    if (!search.trim()) return projects;

    const q = search.toLowerCase();

    return projects.filter(p =>
      `${p.name} ${p.address} ${p.source}`
        .toLowerCase()
        .includes(q)
    );

  }, [projects, search]);

  /**
   * 🗺 Map markers
   */
  const mapMarkers = useMemo(() => {

    return filteredProjects
      .filter(p => p.lat && p.lng)
      .map(p => ({
        lat: p.lat!,
        lng: p.lng!,
        label: `[${p.source}] ${p.address}`,
        color: getMarkerColor(p.status)
      }));

  }, [filteredProjects]);

  const done = projects.filter(p => p.status === "done").length;
  const inProgress = projects.filter(p => p.status === "in-progress").length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alla Projekt</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {done}/{projects.length} klara · {inProgress} pågår
        </p>
      </div>

      {/* Map */}
      <Card className="glass-card">

        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            Karta ({mapMarkers.length})
          </CardTitle>
        </CardHeader>

        <CardContent>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin" />
            </div>
          ) : mapMarkers.length > 0 ? (
            <AreaMap
              className="h-72 md:h-96 w-full rounded-lg overflow-hidden"
              markers={mapMarkers}
            />
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">
                Inga kartpositioner
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
          placeholder="Sök adress eller kund..."
          className="pl-10"
        />

      </div>

    </div>
  );
}
