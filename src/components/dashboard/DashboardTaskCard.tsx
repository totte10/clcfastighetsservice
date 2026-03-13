import { useState } from "react";
import { Link } from "react-router-dom";
import { Fan, Wind, Wrench, Building2, Hammer, Check, Play, MapPin, Truck, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskCompletionDialog, type CompletionData } from "./TaskCompletionDialog";

export type Status = "pending" | "in-progress" | "done";
export type SourceType = "tidx" | "egna" | "tmm" | "optimal" | "project";

export interface DailyTask {
  id: string;
  realId: string;
  address: string;
  projectName: string;
  serviceLabel: string;
  status: Status;
  assignedUsers: string[];
  scheduledDate: string;
  source: SourceType;
  sourceField: string;
  lat?: number | null;
  lng?: number | null;
  isSweep?: boolean;
  flisLass?: number;
}

export type { CompletionData };

const sourceConfig: Record<SourceType, { icon: typeof Fan; color: string; label: string; route: string }> = {
  tidx: { icon: Wind, color: "bg-emerald-500/15 text-emerald-400", label: "Tidx", route: "/tidx" },
  egna: { icon: Fan, color: "bg-sky-500/15 text-sky-400", label: "Egna", route: "/egna" },
  tmm: { icon: Wrench, color: "bg-amber-500/15 text-amber-400", label: "TMM", route: "/tmm" },
  optimal: { icon: Building2, color: "bg-violet-500/15 text-violet-400", label: "Optimal", route: "/optimal" },
  project: { icon: Hammer, color: "bg-rose-500/15 text-rose-400", label: "Projekt", route: "/projects" },
};

const statusStyles: Record<Status, string> = {
  pending: "bg-muted text-muted-foreground",
  "in-progress": "bg-warning/15 text-warning border-warning/30",
  done: "bg-success/15 text-success border-success/30",
};

const statusLabels: Record<Status, string> = {
  pending: "Ej påbörjad",
  "in-progress": "Pågår",
  done: "Klar",
};

interface Props {
  task: DailyTask;
  onStart: (task: DailyTask) => void;
  onComplete: (task: DailyTask, data: CompletionData) => Promise<void>;
  onUndo?: (task: DailyTask) => void;
  updating: string | null;
  showDate?: boolean;
}

export function DashboardTaskCard({ task, onStart, onComplete, updating, showDate }: Props) {
  const isUpdating = updating === task.id;
  const isDone = task.status === "done";
  const config = sourceConfig[task.source];
  const Icon = config.icon;
  const [showCompletion, setShowCompletion] = useState(false);

  return (
    <>
      <div className={`group relative rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 transition-all duration-200 hover:border-border hover:bg-card ${isDone ? "opacity-50" : ""} ${isUpdating ? "animate-pulse" : ""}`}>
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.color.split(" ")[0]}`}>
            <Icon className={`h-4 w-4 ${config.color.split(" ")[1]}`} />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm text-foreground leading-tight truncate">{task.address}</p>
              <Badge variant="outline" className={`shrink-0 text-[10px] px-1.5 py-0 h-5 border ${statusStyles[task.status]}`}>
                {statusLabels[task.status]}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">{task.serviceLabel}</span>
              <span className="text-border text-[10px]">·</span>
              <Link to={config.route} className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors">
                {config.label}
              </Link>
              {task.assignedUsers.length > 0 && (
                <>
                  <span className="text-border text-[10px]">·</span>
                  <div className="flex items-center gap-1">
                    {task.assignedUsers.slice(0, 2).map((u, i) => (
                      <span key={i} className="text-[11px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">{u}</span>
                    ))}
                    {task.assignedUsers.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{task.assignedUsers.length - 2}</span>
                    )}
                  </div>
                </>
              )}
              {isDone && task.flisLass && task.flisLass > 0 && (
                <>
                  <span className="text-border text-[10px]">·</span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                    <Truck className="h-3 w-3" />{task.flisLass} lass
                  </span>
                </>
              )}
              {showDate && task.scheduledDate && (
                <>
                  <span className="text-border text-[10px]">·</span>
                  <span className="text-[11px] text-muted-foreground">{task.scheduledDate}</span>
                </>
              )}
              {task.lat && task.lng && (
                <MapPin className="h-3 w-3 text-muted-foreground/50 ml-0.5" />
              )}
            </div>
          </div>
        </div>

        {!isDone && (
          <div className="flex items-center gap-1.5 mt-3 pl-12">
            {task.status === "pending" && (
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 border-warning/30 text-warning hover:bg-warning/10" onClick={() => onStart(task)} disabled={isUpdating}>
                <Play className="h-3 w-3" />Starta
              </Button>
            )}
            <Button size="sm" className="h-7 text-[11px] gap-1" onClick={() => setShowCompletion(true)} disabled={isUpdating}>
              <Check className="h-3 w-3" />Klar
            </Button>
          </div>
        )}
      </div>

      <TaskCompletionDialog
        open={showCompletion}
        onOpenChange={setShowCompletion}
        task={task}
        onComplete={onComplete}
      />
    </>
  );
}
