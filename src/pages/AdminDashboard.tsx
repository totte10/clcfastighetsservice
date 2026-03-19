import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ClipboardList, Map, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // 🔥 HÄMTA JOBS
  const { data: jobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6 p-4">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">
          Admin Dashboard
        </h1>

        <p className="text-sm text-muted-foreground">
          Hantera uppdrag, planering och tidsrapporter
        </p>
      </div>


      {/* 🔥 SNABB ÖVERSIKT (NY) */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Dina uppdrag</h2>

        {jobs?.slice(0, 3).map((job: any) => (
          <Card key={job.id}>
            <CardContent className="p-4 space-y-1">
              <p className="font-medium">{job.title}</p>
              <p className="text-sm text-muted-foreground">{job.date}</p>

              <p
                className={`text-xs font-medium ${
                  job.status === "completed"
                    ? "text-green-500"
                    : job.status === "in_progress"
                    ? "text-blue-500"
                    : "text-yellow-500"
                }`}
              >
                {job.status}
              </p>
            </CardContent>
          </Card>
        ))}

      </div>


      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* PLANERING */}
        <Card
          className="cursor-pointer hover:scale-[1.02] transition"
          onClick={() => navigate("/planning")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard size={18}/>
              Uppdragsplanering
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-muted-foreground">
            Planera uppdrag och scheman
          </CardContent>
        </Card>


        {/* ROUTE PLANNER */}
        <Card
          className="cursor-pointer hover:scale-[1.02] transition"
          onClick={() => navigate("/route-planning")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map size={18}/>
              Ruttplanering
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-muted-foreground">
            Se alla uppdrag på karta
          </CardContent>
        </Card>


        {/* TIME REPORTS */}
        <Card
          className="cursor-pointer hover:scale-[1.02] transition"
          onClick={() => navigate("/time/reports")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList size={18}/>
              Tidsrapporter
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-muted-foreground">
            Hantera och exportera tider
          </CardContent>
        </Card>

      </div>

    </div>
  );
}