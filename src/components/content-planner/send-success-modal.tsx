"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

const EASE = "cubic-bezier(0.2,0,0,1)";

/**
 * Sending to a campaign is the moment the work leaves your hands, so it gets a
 * modal rather than a toast: a toast is for things you may safely miss, and
 * "who can now see this" is not one of them. It also answers the question the
 * toast could not — WHICH campaigns, and what happens to the post now.
 */
export function SendSuccessModal({
  open,
  onOpenChange,
  sessionTitle,
  plural,
  campaigns,
  onViewCampaign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionTitle: string;
  /** True when the title names several posts, so the verb agrees with it. */
  plural?: boolean;
  campaigns: Campaign[];
  /** Offered only when there is one obvious place to go next. */
  onViewCampaign?: (campaignId: string) => void;
}) {
  // The seal draws itself after the dialog has arrived, so the two animations
  // read as one gesture landing rather than two things starting at once.
  const [sealed, setSealed] = useState(false);

  // Rewound during render, the way the other dialogs in here do it: an effect
  // for this would let one frame of the finished state through on reopen.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setSealed(false);
  }

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setSealed(true), 120);
    return () => clearTimeout(t);
  }, [open]);

  const single = campaigns.length === 1 ? campaigns[0] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[440px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-(--r-surface) border-0 bg-(--surface-dialog) p-0 text-foreground shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.09] sm:max-w-[440px]"
      >
        <div
          aria-hidden
          className="h-px w-full shrink-0 [background-image:var(--specular)]"
        />

        {/* One warm wash behind the seal. The glow belongs to the moment, not
            to the dialog, so it fades out above the content. */}
        <div className="relative [background-image:var(--wash-success)] px-6 pb-5 pt-7">
          <DialogHeader className="items-center p-0 text-center">
            <span
              className={cn(
                "relative flex size-14 items-center justify-center rounded-(--r-pill) bg-emerald-500/12 text-emerald-400 inset-ring-1 inset-ring-emerald-400/30 transition-[scale,opacity] duration-500",
                sealed ? "scale-100 opacity-100" : "scale-90 opacity-0",
              )}
              style={{ transitionTimingFunction: EASE }}
            >
              {/* A ring that expands and fades once — the visual "sent" sound. */}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-0 rounded-(--r-pill) ring-1 ring-emerald-400/50 transition-[scale,opacity] duration-700 motion-reduce:hidden",
                  sealed ? "scale-[1.45] opacity-0" : "scale-100 opacity-100",
                )}
                style={{ transitionTimingFunction: EASE }}
              />
              <Check className="size-6" strokeWidth={2.5} />
            </span>

            <DialogTitle className="mt-4 text-[18px] font-semibold tracking-[-0.015em]">
              Sent to {campaigns.length === 1 ? "campaign" : `${campaigns.length} campaigns`}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-[13px] leading-snug text-muted-foreground text-pretty">
              <span className="text-foreground/85">
                {sessionTitle?.trim() || "Untitled content"}
              </span>{" "}
              {plural ? "are" : "is"} now with{" "}
              {single ? (plural ? "the team on them" : "the team on it") : "the teams on them"}.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* The destinations, named. This is the part a toast cannot carry. */}
        <div className="flex flex-col gap-1.5 border-t border-(--ink)/[0.06] px-4 py-4">
          {campaigns.map((campaign, i) => (
            <div
              key={campaign.id}
              className="flex items-center gap-3 rounded-(--r-float) bg-(--ink)/[0.03] px-3 py-2.5 inset-ring-1 inset-ring-(--ink)/[0.06] transition-[opacity,translate] duration-400"
              style={{
                transitionTimingFunction: EASE,
                transitionDelay: `${180 + i * 60}ms`,
                opacity: sealed ? 1 : 0,
                translate: sealed ? "0 0" : "0 6px",
              }}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-(--r-pill) bg-violet-500/12 text-violet-300 inset-ring-1 inset-ring-violet-400/25">
                <Send className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium">
                  {campaign.name}
                </span>
                <span className="block truncate text-[11.5px] text-muted-foreground">
                  {campaign.inWozku ? "Live in Wozku" : "Not yet in Wozku"}
                  {campaign.endDate && campaign.endDate !== "TBD" && (
                    <> · Ends {campaign.endDate}</>
                  )}
                </span>
              </span>
              {/* No tick per row: the seal above already said yes once, and
                  saying it again on every line makes the rows argue for the
                  outcome instead of naming the destination. */}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-(--ink)/[0.06] bg-(--sink)/[0.12] px-5 py-4">
          {single && onViewCampaign && (
            <button
              onClick={() => {
                onOpenChange(false);
                onViewCampaign(single.id);
              }}
              className="flex h-9 items-center gap-1.5 rounded-(--r-pill) px-3.5 text-[13px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
            >
              Open campaign
              <ArrowRight className="size-3.5" />
            </button>
          )}
          <button
            autoFocus
            onClick={() => onOpenChange(false)}
            className="flex h-9 items-center gap-1.5 rounded-(--r-pill) bg-violet-600 px-4 text-[13px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-(--press)"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
