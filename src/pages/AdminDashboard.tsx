import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ClipboardList, Plus, Map } from "lucide-react";
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

        <Card
          className="cursor-pointer hover:scale-[1.02] transition"
          onClick={() => navigate("/create-job")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={18}/>
              Skapa uppdrag
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-muted-foreground">
            Lägg till nya uppdrag
          </CardContent>
        </Card>


        <Card
          className="cursor-pointer hover:scale-[1.02] transition"
          onClick={() => navigate("/planner")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map size={18}/>
              Planera rutter
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-muted-foreground">
            Flytta uppdrag och planera körning
          </CardContent>
        </Card>


        <Card
          className="cursor-pointer hover:scale-[1.02] transition"
          onClick={() => navigate("/time-reports")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList size={18}/>
              Tidsrapporter
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-muted-foreground">
            Exportera till PDF och Fortnox
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
