import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "pending" | "in-progress" | "done";

const statusConfig: Record<Status, { label: string; className: string }> = {
  pending: { label: "Ej påbörjad", className: "bg-muted text-muted-foreground" },
  "in-progress": { label: "Pågår", className: "bg-warning text-warning-foreground" },
  done: { label: "Klart", className: "bg-success text-success-foreground" },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  return (
    <Badge className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
