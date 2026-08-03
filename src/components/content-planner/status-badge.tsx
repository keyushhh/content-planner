import { Badge } from "@/components/ui/badge";
import { Hint } from "@/components/ui/tooltip";
import { Circle, CheckCircle2, PencilLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionStatus } from "@/lib/types";

export const STATUS_TONE: Record<
  SessionStatus,
  { label: string; meaning: string; dot: string; text: string; bar: string }
> = {
  approved: {
    label: "Approved",
    meaning: "Ready for a campaign. Send it from the Campaign column.",
    dot: "bg-live-400",
    text: "text-live-300",
    bar: "bg-live-400/80",
  },
  wip: {
    label: "WIP",
    meaning: "Work in progress. Approve it to make it sendable.",
    dot: "bg-violet-400",
    text: "text-violet-300",
    bar: "bg-violet-400/80",
  },
  draft: {
    label: "Draft",
    meaning: "Still being written. Nothing leaves the repository yet.",
    dot: "bg-muted-foreground/60",
    text: "text-muted-foreground",
    bar: "bg-(--ink)/20",
  },
};

const DOT = STATUS_TONE;

export function StatusBadge({
  status,
  variant = "pill",
  hint = true,
}: {
  status: SessionStatus;
  variant?: "pill" | "dot";
  /** Off where a tooltip would fight something else, like the tour scrim. */
  hint?: boolean;
}) {
  const badge = <StatusBadgeBody status={status} variant={variant} />;
  if (!hint) return badge;
  return (
    <Hint label={STATUS_TONE[status].meaning}>
      <span className="inline-flex">{badge}</span>
    </Hint>
  );
}

function StatusBadgeBody({
  status,
  variant,
}: {
  status: SessionStatus;
  variant: "pill" | "dot";
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
        className="!h-6.5 !px-2.5 !py-0 inline-flex items-center gap-1.5 rounded-(--r-pill) border-live-500/50 bg-live-500/10 text-xs font-medium text-live-400"
      >
        <CheckCircle2 className="size-3.5 shrink-0 text-live-400" />
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
