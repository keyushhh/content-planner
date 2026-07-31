"use client";

import { ImageIcon, Link2, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { platformMeta } from "@/lib/platforms";
import { isRichTextEmpty } from "@/lib/rich-text";
import type { NewCampaign } from "@/lib/types";

export function CampaignLandingPreview({
  draft,
  className,
}: {
  draft: NewCampaign;
  className?: string;
}) {
  const primary = draft.platforms[0];
  const shareLabel = primary
    ? `Share on ${platformMeta(primary).label}`
    : "Share this post";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-(--r-surface) bg-(--surface-raised) shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.08]",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-(--ink)/[0.06] bg-(--surface-panel) px-3 py-2">
        <span aria-hidden className="flex items-center gap-1">
          <span className="size-2 rounded-(--r-round) bg-(--ink)/[0.14]" />
          <span className="size-2 rounded-(--r-round) bg-(--ink)/[0.14]" />
          <span className="size-2 rounded-(--r-round) bg-(--ink)/[0.14]" />
        </span>
        <span className="ml-1.5 min-w-0 flex-1 truncate rounded-(--r-pill) bg-(--ink)/[0.05] px-2.5 py-0.5 text-[10.5px] text-muted-foreground/70">
          wozku.com/campaigns/
          <span className="text-muted-foreground/45">6a6b3232e051c</span>
        </span>
      </div>

      <div className="relative">
        {draft.headerUrl ? (
          <div className="aspect-[1920/400] w-full overflow-hidden bg-(--ink)/[0.04]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={draft.headerUrl}
              alt=""
              draggable={false}
              className="size-full object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-[1920/400] w-full flex-col items-center justify-center gap-1 bg-(--ink)/[0.03] text-muted-foreground/40">
            <ImageIcon className="size-4" />
            <span className="text-[10.5px]">Header image</span>
          </div>
        )}

        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
          <span
            className={cn(
              "flex size-14 items-center justify-center overflow-hidden rounded-(--r-float) bg-(--surface-raised) shadow-(--lift-md) inset-ring-1",
              draft.logoUrl ? "inset-ring-(--ink)/[0.10]" : "inset-ring-(--ink)/[0.07]",
            )}
          >
            {draft.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={draft.logoUrl}
                alt=""
                draggable={false}
                className="size-full object-cover"
              />
            ) : (
              <ImageIcon className="size-4 text-muted-foreground/40" />
            )}
          </span>
        </div>
      </div>

      <div className="px-6 pb-6 pt-9 text-center">
        <h3 className="text-[17px] font-semibold leading-tight tracking-[-0.015em] text-balance">
          {draft.name.trim() || (
            <span className="text-muted-foreground/45">Your campaign name</span>
          )}
        </h3>

        {isRichTextEmpty(draft.description) ? (
          <p className="mx-auto mt-2 max-w-[38ch] text-[12.5px] leading-[1.6] text-muted-foreground/45 text-pretty">
            Tell people what this campaign is and why they should share it.
          </p>
        ) : (
          <div
            className="rich-text mx-auto mt-2 max-w-[42ch] text-left text-[12.5px] leading-[1.6] text-foreground/80"
            dangerouslySetInnerHTML={{ __html: draft.description }}
          />
        )}

        <div className="mt-5 flex justify-center">
          <span className="pointer-events-none flex h-9 items-center gap-1.5 rounded-(--r-pill) bg-violet-600 px-4 text-[12.5px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15">
            <Share2 className="size-3.5" />
            {shareLabel}
          </span>
        </div>
      </div>

      <div className="border-t border-(--ink)/[0.06] bg-(--ink)/[0.015] px-6 py-3.5">
        <span className="block text-[10px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/55">
          Post-share behavior
        </span>
        <p className="mt-1.5 text-[12px] leading-snug text-foreground/75 text-pretty">
          {draft.thankYou.trim() || (
            <span className="text-muted-foreground/45">Your thank you message</span>
          )}
        </p>
        <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground/60">
          <Link2 className="size-3 shrink-0" />
          <span className="truncate">
            {draft.redirectUrl.trim() || "Stays on this page"}
          </span>
        </p>
      </div>
    </div>
  );
}
