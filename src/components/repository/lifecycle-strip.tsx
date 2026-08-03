"use client";

import { ChevronRight, X } from "lucide-react";
import { JOURNEY_STEPS, useLifecycleStrip } from "@/lib/lifecycle";
import { Hint } from "@/components/ui/tooltip";

/** Teaches the post lifecycle until the user has a few posts, or dismisses it. */
export function LifecycleStrip({ postCount }: { postCount: number }) {
  const { dismissed, dismiss } = useLifecycleStrip();

  if (dismissed || postCount >= 3) return null;

  return (
    <div className="mb-4 flex shrink-0 items-center justify-between gap-4 rounded-(--r-surface) bg-(--ink)/[0.028] px-4 py-2.5 shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.07] duration-500 animate-in fade-in slide-in-from-top-1 motion-reduce:animate-none">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground/70">
          How it works
        </span>
        {JOURNEY_STEPS.map(({ icon: Icon, label }, i) => (
          <span key={label} className="flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <Icon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="whitespace-nowrap text-[12.5px] font-medium text-foreground/80">
                {label}
              </span>
            </span>
            {i < JOURNEY_STEPS.length - 1 && (
              <ChevronRight
                aria-hidden
                className="size-3.5 shrink-0 text-muted-foreground/40"
              />
            )}
          </span>
        ))}
      </div>

      <Hint label="Hide this">
        <button
          onClick={dismiss}
          aria-label="Hide the lifecycle explainer"
          className="flex size-6 shrink-0 items-center justify-center rounded-(--r-pill) text-muted-foreground/60 transition-colors duration-150 hover:bg-(--ink)/[0.07] hover:text-foreground/90"
        >
          <X className="size-3.5" />
        </button>
      </Hint>
    </div>
  );
}
