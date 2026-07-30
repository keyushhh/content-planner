import { Badge } from "@/components/ui/badge";
import { Circle, CheckCircle2, PencilLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionStatus } from "@/lib/types";

export const STATUS_TONE: Record<
  SessionStatus,
  { label: string; dot: string; text: string; bar: string }
> = {
  approved: {
    label: "Approved",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    bar: "bg-emerald-400/80",
  },
  wip: {
    label: "WIP",
    dot: "bg-violet-400",
    text: "text-violet-300",
    bar: "bg-violet-400/80",
  },
  draft: {
    label: "Draft",
    dot: "bg-muted-foreground/60",
    text: "text-muted-foreground",
    bar: "bg-(--ink)/20",
  },
};

const DOT = STATUS_TONE;

export function StatusBadge({
  status,
  variant = "pill",
}: {
  status: SessionStatus;
  variant?: "pill" | "dot";
}) {
  if (variant === "dot") {
    const { label, dot, text } = DOT[status];
    return (
      <span className={cn("inline-flex items-center gap-2 text-xs font-medium", text)}>
        <span aria-hidden className={cn("size-1.5 shrink-0 rounded-(--r-round)", dot)} />
        {label}
      </span>
    );
  }

  if (status === "approved") {
    return (
      <Badge
        variant="outline"
        className="!h-6.5 !px-2.5 !py-0 inline-flex items-center gap-1.5 rounded-(--r-pill) border-emerald-500/50 bg-emerald-500/10 text-xs font-medium text-emerald-400"
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
        className="!h-6.5 !px-2.5 !py-0 inline-flex items-center gap-1.5 rounded-(--r-pill) border-violet-500/50 bg-violet-500/10 text-xs font-medium text-violet-400"
      >
        <PencilLine className="size-3.5 shrink-0 text-violet-400" />
        <span>WIP</span>
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="!h-6.5 !px-2.5 !py-0 inline-flex items-center gap-1.5 rounded-(--r-pill) border-border/80 bg-accent/30 text-xs font-medium text-muted-foreground"
    >
      <Circle className="size-3.5 shrink-0 text-muted-foreground/70" />
      <span>Draft</span>
    </Badge>
  );
}
