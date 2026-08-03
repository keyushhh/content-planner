"use client";

import { MonitorPlay, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { Campaign } from "@/lib/types";

/**
 * Placeholder. The header slot exists so adding the real feature doesn't mean re-laying out
 * the action cluster, but what Screen Setup actually configures hasn't been specced yet.
 */
export function ScreenSetupSheet({
  open,
  onOpenChange,
  campaign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        side="right"
        aria-label="Screen Setup"
        className="flex !w-[464px] !max-w-[calc(100vw-2rem)] flex-col gap-0 border-0 bg-(--surface-canvas) p-0 text-foreground shadow-(--lift-edge)"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-px [background-image:var(--specular-v)]"
        />

        <div className="flex shrink-0 items-start justify-between gap-3 px-7 pb-4 pt-6">
          <div className="min-w-0">
            <div className="mb-2 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="shrink-0 font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/60">
                Campaign
              </span>
              <span className="truncate font-medium text-foreground/85">
                {campaign.name}
              </span>
            </div>
            <h2 className="text-[21px] font-semibold leading-tight tracking-[-0.022em] text-balance">
              Screen Setup
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-snug text-muted-foreground text-pretty">
              Not built yet.
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="-mr-2 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-(--r-pill) text-muted-foreground outline-none transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground focus-visible:inset-ring-2 focus-visible:inset-ring-violet-400/60 active:scale-(--press)"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 [background-image:var(--wash-page)] px-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-(--r-round) bg-(--ink)/[0.05] text-muted-foreground/60">
            <MonitorPlay className="size-5" />
          </span>
          <p className="text-[13.5px] font-medium text-foreground">
            Screen Setup isn&rsquo;t wired up
          </p>
          <p className="max-w-[34ch] text-[12.5px] leading-snug text-muted-foreground text-pretty">
            The control is here so this campaign&rsquo;s header won&rsquo;t need rearranging
            later. Tell us what it should configure and it can be built.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
