import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Clock, Minus } from "lucide-react";

type Status = "pending" | "in-progress" | "done";

const statusConfig: Record<Status, { label: string; className: string; icon: React.ElementType }> = {
  pending: {
    label: "Ej påbörjad",
    className: "bg-muted/80 text-muted-foreground border border-border/50",
    icon: Minus,
  },
  "in-progress": {
    label: "Pågår",
    className: "bg-warning/15 text-warning border border-warning/20",
    icon: Clock,
  },
  done: {
    label: "Klart",
    className: "bg-success/15 text-success border border-success/20",
    icon: Check,
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge className={cn("text-[11px] font-medium gap-1 px-2 py-0.5 transition-colors duration-200", config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
