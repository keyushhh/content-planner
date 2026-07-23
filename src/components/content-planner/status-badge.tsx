import { Badge } from "@/components/ui/badge";
import { Circle, CheckCircle2, PencilLine } from "lucide-react";
import type { SessionStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: SessionStatus }) {
  if (status === "approved") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-medium"
      >
        <CheckCircle2 className="size-3" />
        Approved
      </Badge>
    );
  }
  if (status === "wip") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border-violet-500/40 bg-violet-500/10 text-violet-400 font-medium"
      >
        <PencilLine className="size-3" />
        WIP
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1.5 border-border text-muted-foreground font-medium"
    >
      <Circle className="size-3" />
      Draft
    </Badge>
  );
}
