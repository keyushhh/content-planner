"use client";

import { useEffect, useState } from "react";
import { Calculator, Check, Copy, ExternalLink, Rocket, UserPlus } from "lucide-react";
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

export function GoLiveModal({
  open,
  onOpenChange,
  campaign,
  onInvite,
  onCalculateRoi,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  onInvite: () => void;
  onCalculateRoi: () => void;
}) {
  const [sealed, setSealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setSealed(false);
      setCopied(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setSealed(true), 120);
    return () => clearTimeout(t);
  }, [open]);

  if (!campaign) return null;

  const path = `/c/${campaign.id}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}${path}`;

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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

        <div className="relative [background-image:var(--wash-success)] px-6 pb-5 pt-7">
          <DialogHeader className="items-center p-0 text-center">
            <span
              className={cn(
                "relative flex size-14 items-center justify-center rounded-(--r-pill) bg-live-500/12 text-live-300 inset-ring-1 inset-ring-live-400/30 transition-[scale,opacity] duration-500",
                sealed ? "scale-100 opacity-100" : "scale-90 opacity-0",
              )}
              style={{ transitionTimingFunction: EASE }}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute inset-0 rounded-(--r-pill) ring-1 ring-live-400/50 transition-[scale,opacity] duration-700 motion-reduce:hidden",
                  sealed ? "scale-[1.45] opacity-0" : "scale-100 opacity-100",
                )}
                style={{ transitionTimingFunction: EASE }}
              />
              <Rocket className="size-6" strokeWidth={2.5} />
            </span>

            <DialogTitle className="mt-4 text-[18px] font-semibold tracking-[-0.015em] text-balance">
              {campaign.name} is live
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-[13px] leading-snug text-muted-foreground text-pretty">
              Its public page is open to visitors. Share the link, invite advocates
              to spread it, or come back to see how it&rsquo;s doing.
            </DialogDescription>
          </DialogHeader>

          <div
            className="mt-4 flex items-center gap-1.5 rounded-(--r-float) bg-(--ink)/[0.15] p-1.5 pl-3 transition-[opacity,translate] duration-400"
            style={{
              transitionTimingFunction: EASE,
              opacity: sealed ? 1 : 0,
              translate: sealed ? "0 0" : "0 6px",
            }}
          >
            <span
              title={url}
              className="min-w-0 flex-1 truncate text-left text-[12px] text-foreground/85"
            >
              {url}
            </span>
            <a
              href={path}
              target="_blank"
              rel="noopener noreferrer"
              title="Open the public page"
              className="flex size-7 shrink-0 items-center justify-center rounded-(--r-pill) text-foreground/70 transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.14] hover:text-foreground"
            >
              <ExternalLink className="size-3.5" />
            </a>
            <button
              onClick={handleCopy}
              title="Copy link"
              className="flex size-7 shrink-0 items-center justify-center rounded-(--r-pill) text-foreground/70 transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.14] hover:text-foreground"
            >
              {copied ? (
                <Check className="size-3.5 text-live-300" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-(--ink)/[0.06] px-4 py-4">
          <button
            onClick={() => {
              onOpenChange(false);
              onInvite();
            }}
            className="flex items-center gap-3 rounded-(--r-float) bg-(--ink)/[0.03] px-3 py-2.5 text-left transition-[background-color,opacity,translate] duration-400 inset-ring-1 inset-ring-(--ink)/[0.06] hover:bg-(--ink)/[0.055]"
            style={{
              transitionTimingFunction: EASE,
              transitionDelay: "180ms",
              opacity: sealed ? 1 : 0,
              translate: sealed ? "0 0" : "0 6px",
            }}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-(--r-pill) bg-violet-500/12 text-violet-300 inset-ring-1 inset-ring-violet-400/25">
              <UserPlus className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-medium">
                Invite advocates
              </span>
              <span className="block truncate text-[11.5px] text-muted-foreground">
                Get others sharing it from their own accounts
              </span>
            </span>
          </button>

          <button
            onClick={() => {
              onOpenChange(false);
              onCalculateRoi();
            }}
            className="flex items-center gap-3 rounded-(--r-float) bg-(--ink)/[0.03] px-3 py-2.5 text-left transition-[background-color,opacity,translate] duration-400 inset-ring-1 inset-ring-(--ink)/[0.06] hover:bg-(--ink)/[0.055]"
            style={{
              transitionTimingFunction: EASE,
              transitionDelay: "240ms",
              opacity: sealed ? 1 : 0,
              translate: sealed ? "0 0" : "0 6px",
            }}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-(--r-pill) bg-amber-500/12 text-amber-300 inset-ring-1 inset-ring-amber-400/25">
              <Calculator className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-medium">
                Estimate its ROI
              </span>
              <span className="block truncate text-[11.5px] text-muted-foreground">
                See what shares and clicks are likely worth
              </span>
            </span>
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-(--ink)/[0.06] bg-(--sink)/[0.12] px-5 py-4">
          <button
            autoFocus
            onClick={() => onOpenChange(false)}
            className="flex h-9 items-center gap-1.5 rounded-(--r-pill) bg-live-500 px-4 text-[13px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,scale] duration-150 hover:bg-live-500/85 active:scale-(--press)"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
