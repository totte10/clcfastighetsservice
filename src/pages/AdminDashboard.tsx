import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ClipboardList, Map, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {

  const navigate = useNavigate();

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
          onClick={() => navigate("/admin-planner")}
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
