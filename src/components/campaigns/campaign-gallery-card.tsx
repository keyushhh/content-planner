import { FileEdit, ArrowRight, Image as ImageIcon } from "lucide-react";
import { CAMPAIGN_STATE, endsLabel, platformsOf } from "@/lib/campaigns";
import { platformMeta } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import type { Campaign, CampaignState } from "@/lib/types";
import { CampaignContextMenu } from "./campaign-context-menu";

export function CampaignGalleryCard({
  campaign,
  state,
  drafts,
  submitted,
  now,
  onOpen,
}: {
  campaign: Campaign;
  state: CampaignState;
  drafts: number;
  submitted: number;
  now: number;
  onOpen: () => void;
}) {
  const tone = CAMPAIGN_STATE[state];
  const ends = endsLabel(campaign.endDate, now);
  const needsPost = state === "draft" && submitted === 0;

  return (
    <button
      onClick={onOpen}
      className="group flex h-full w-full flex-col overflow-hidden rounded-(--r-surface) bg-(--surface-raised) text-left shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.07] transition-[box-shadow,background-color,scale] duration-200 hover:shadow-(--lift-md) hover:inset-ring-(--ink)/[0.12] active:scale-[0.995]"
    >
      <div className="relative h-[120px] w-full bg-(--ink)/[0.03]">
        {campaign.headerUrl ? (
          <img src={campaign.headerUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-(--ink)/[0.02]">
            <ImageIcon className="size-6 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute -bottom-5 left-5 flex size-12 items-center justify-center rounded-[14px] bg-background p-1 shadow-sm inset-ring-1 inset-ring-(--ink)/[0.08]">
          {campaign.logoUrl ? (
            <img src={campaign.logoUrl} alt="" className="size-full rounded-[10px] object-cover bg-(--ink)/[0.02]" />
          ) : (
            <div className="flex size-full items-center justify-center rounded-[10px] bg-(--ink)/[0.04]">
              <span className="text-[13px] font-bold text-muted-foreground/50">{campaign.name.substring(0, 2).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <span
            className={cn(
              "flex h-6 items-center gap-1.5 rounded-(--r-pill) bg-background/95 px-2 text-[10.5px] font-medium shadow-sm inset-ring-1 backdrop-blur-md",
              tone.chip,
            )}
          >
            <span aria-hidden className={cn("size-1.5 rounded-(--r-round)", tone.dot)} />
            {tone.label}
          </span>
        </div>
      </div>
      
      <span className="flex min-w-0 flex-1 flex-col px-5 pb-4 pt-8">
        <span className="block truncate text-[15px] font-semibold tracking-[-0.01em]">
          {campaign.name}
        </span>
        <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="shrink-0 rounded-(--r-inner) bg-(--ink)/[0.06] px-1.5 py-px text-[9.5px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.06em] text-muted-foreground/85">
            {campaign.tag}
          </span>
          <span className="truncate">{ends.date}</span>
          {ends.soon && (
            <>
              <span aria-hidden className="shrink-0 text-muted-foreground/30">·</span>
              <span className="shrink-0 text-amber-300/80">{ends.soon}</span>
            </>
          )}
        </span>
        <span className="mt-4 flex flex-wrap items-center gap-1.5">
          {platformsOf(campaign).map((id) => {
            const meta = platformMeta(id);
            return (
              <span
                key={id}
                className={cn(
                  "flex h-[22px] items-center gap-1.5 rounded-(--r-pill) px-2 text-[10.5px] font-medium inset-ring-1",
                  meta.tint,
                )}
              >
                <span aria-hidden className={cn("size-1 rounded-(--r-round)", meta.dot)} />
                {meta.label}
              </span>
            );
          })}
        </span>
      </span>

      <span className="flex items-center justify-between gap-3 border-t border-(--ink)/[0.06] bg-(--ink)/[0.015] px-5 py-3">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px]">
          <span className="text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground/85">
              {submitted}
            </span>{" "}
            {submitted === 1 ? "post" : "posts"}
          </span>
          {drafts > 0 && (
            <span className="flex items-center gap-1 text-amber-300/90">
              <FileEdit className="size-3 shrink-0" />
              <span className="tabular-nums">{drafts}</span> waiting
            </span>
          )}
          {needsPost && drafts === 0 && (
            <span className="text-muted-foreground/70">Needs a post</span>
          )}
        </span>
        <span className="flex size-6 shrink-0 items-center justify-center rounded-(--r-pill) text-muted-foreground/50 transition-[color,translate] duration-200 group-hover:translate-x-0.5 group-hover:text-foreground/80">
          <ArrowRight className="size-3.5" />
        </span>
      </span>
    </button>
  );
}
