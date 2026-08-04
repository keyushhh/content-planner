"use client";

import { ChevronRight, X, PencilLine, CheckCircle2, Send } from "lucide-react";
import { useLifecycleStrip } from "@/lib/lifecycle";
import { Hint } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const PIPELINE_STEPS: { id: "draft" | "wip" | "approved"; label: string; icon: typeof PencilLine }[] = [
  { id: "draft", label: "Draft", icon: PencilLine },
  { id: "wip", label: "WIP", icon: Send },
  { id: "approved", label: "Approved", icon: CheckCircle2 },
];

/** Teaches the post lifecycle until the user has a few posts, or dismisses it. */
export function LifecycleStrip({
  postCount,
  sessions,
  statusFilter,
  onSelectStatus,
}: {
  postCount: number;
  sessions: { status: "draft" | "wip" | "approved" }[];
  statusFilter: ("draft" | "wip" | "approved")[];
  onSelectStatus: (status: "draft" | "wip" | "approved" | null) => void;
}) {
  const { dismissed, dismiss } = useLifecycleStrip();

  // Calculate live counts per status
  const counts = {
    all: sessions.length,
    draft: sessions.filter((s) => s.status === "draft").length,
    wip: sessions.filter((s) => s.status === "wip").length,
    approved: sessions.filter((s) => s.status === "approved").length,
  };

  if (dismissed && postCount < 3) return null;

  return (
    <div className="mb-4 flex shrink-0 items-center justify-between gap-4 rounded-(--r-surface) bg-surface/40 backdrop-blur-md px-4 py-2 shadow-(--lift-sm) inset-ring-1 inset-ring-border/40 duration-300 animate-in fade-in slide-in-from-top-1">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
          Pipeline
        </span>

        <button
          onClick={() => onSelectStatus(null)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-all duration-150 active:scale-95",
            statusFilter.length === 0
              ? "bg-foreground/10 text-foreground font-semibold inset-ring-1 inset-ring-foreground/20"
              : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          )}
        >
          All
          <span className="rounded-full bg-muted/60 px-1.5 py-0.2 text-[10.5px] font-normal">
            {counts.all}
          </span>
        </button>

        {PIPELINE_STEPS.map(({ icon: Icon, label, id }, i) => {
          const count = counts[id] ?? 0;
          const isActive = statusFilter.length === 1 && statusFilter[0] === id;

          return (
            <span key={label} className="flex items-center gap-2">
              <button
                onClick={() => onSelectStatus(isActive ? null : id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-all duration-150 active:scale-95",
                  isActive
                    ? "bg-violet-500/20 text-violet-300 font-semibold inset-ring-1 inset-ring-violet-400/40 shadow-xs"
                    : "text-muted-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                )}
              >
                <Icon className={cn("size-3.5 shrink-0", isActive ? "text-violet-300" : "text-muted-foreground")} />
                <span className="whitespace-nowrap">{label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10.5px] font-normal transition-colors",
                    isActive ? "bg-violet-500/30 text-violet-200" : "bg-muted/60 text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>

              {i < PIPELINE_STEPS.length - 1 && (
                <ChevronRight
                  aria-hidden
                  className="size-3.5 shrink-0 text-muted-foreground/30"
                />
              )}
            </span>
          );
        })}
      </div>

      <Hint label="Dismiss strip">
        <button
          onClick={dismiss}
          aria-label="Hide the lifecycle pipeline"
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-colors duration-150 hover:bg-foreground/5 hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </Hint>
    </div>
  );
}
