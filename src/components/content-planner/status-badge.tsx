import { Badge } from "@/components/ui/badge";
import { Circle, CheckCircle2, PencilLine } from "lucide-react";
import type { SessionStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: SessionStatus }) {
  if (status === "approved") {
    return (
      <Badge
        variant="outline"
        className="!h-6.5 !px-2.5 !py-0 inline-flex items-center gap-1.5 rounded-full border-emerald-500/50 bg-emerald-500/10 text-xs font-medium text-emerald-400"
      >
        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
        <span>Approved</span>
      </Badge>
    );
  }
  if (status === "wip") {
    return (
      <Badge
        variant="outline"
        className="!h-6.5 !px-2.5 !py-0 inline-flex items-center gap-1.5 rounded-full border-violet-500/50 bg-violet-500/10 text-xs font-medium text-violet-400"
      >
        <PencilLine className="size-3.5 shrink-0 text-violet-400" />
        <span>WIP</span>
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="!h-6.5 !px-2.5 !py-0 inline-flex items-center gap-1.5 rounded-full border-border/80 bg-accent/30 text-xs font-medium text-muted-foreground"
    >
      <Circle className="size-3.5 shrink-0 text-muted-foreground/70" />
      <span>Draft</span>
    </Badge>
  );
}
