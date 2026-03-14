import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AreaMap } from "@/components/AreaMap";
import { Map, Search, Loader2 } from "lucide-react";

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

export default function ProjectsPage() {

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadProjects() {

    const tables = [
      { table: "tmm_entries", label: "TMM" },
      { table: "optimal_entries", label: "OPTIMAL" },
      { table: "egna_entries", label: "EGNA" },
      { table: "tidx_entries", label: "TIDX" }
    ];

    const results = await Promise.all(

      tables.map(async (t) => {

        const { data } = await supabase
          .from(t.table)
          .select("*");

        return (data || []).map((row: any) => ({

          id: row.id,
          source: t.label,
          name: row.name || "",
          address: row.address || row.street || "",
          status: row.status || "pending",
          lat: row.lat || null,
          lng: row.lng || null

        }));

      })

    );

    const merged = results.flat();

    setProjects(merged);
    setLoading(false);

  }

  useEffect(() => {
    loadProjects();
  }, []);

  const filtered = useMemo(() => {

    if (!search.trim()) return projects;

    const q = search.toLowerCase();

    return projects.filter(p =>
      `${p.address} ${p.name} ${p.source}`
        .toLowerCase()
        .includes(q)
    );

  }, [projects, search]);

  const markers = useMemo(() => {

    return filtered
      .filter(p => p.lat && p.lng)
      .map(p => ({
        lat: p.lat!,
        lng: p.lng!,
        label: `[${p.source}] ${p.address}`,
        color: "red"
      }));

  }, [filtered]);

  return (

    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold">
          Alla Projekt
        </h1>
      </div>

      <Card>

        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            Karta
          </CardTitle>
        </CardHeader>

        <CardContent>

          {loading ? (

            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin" />
            </div>

          ) : (

            <AreaMap
              className="h-72 w-full rounded-lg overflow-hidden"
              markers={markers}
            />

          )}

        </CardContent>

      </Card>

      <div className="relative">

        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök adress..."
          className="pl-10"
        />

      </div>

      <div className="space-y-3">

        {filtered.map((p) => (

          <Card key={p.id}>

            <CardContent className="pt-4 pb-4">

              <p className="text-xs text-primary font-semibold">
                {p.source}
              </p>

              <p className="text-sm font-medium">
                {p.address}
              </p>

              {p.name && (
                <p className="text-xs text-muted-foreground">
                  {p.name}
                </p>
              )}

            </CardContent>

          </Card>

        ))}

      </div>

    </div>

  );

}
