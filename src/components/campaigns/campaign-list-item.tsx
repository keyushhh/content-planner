import { FileEdit, ArrowRight } from "lucide-react";
import { CAMPAIGN_STATE, endsLabel, platformsOf } from "@/lib/campaigns";
import { platformMeta } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import type { Campaign, CampaignState } from "@/lib/types";
import { CampaignContextMenu } from "./campaign-context-menu";

export function CampaignListItem({
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
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-(--r-surface) bg-(--surface-raised) p-3 pr-4 text-left shadow-sm inset-ring-1 inset-ring-(--ink)/[0.06] transition-[box-shadow,background-color,scale] duration-200 hover:shadow-(--lift-sm) hover:inset-ring-(--ink)/[0.12] active:scale-[0.995]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-(--ink)/[0.03] inset-ring-1 inset-ring-(--ink)/[0.08]">
        {campaign.logoUrl ? (
          <img src={campaign.logoUrl} alt="" className="size-full rounded-[9px] object-cover" />
        ) : (
          <span className="text-[12px] font-bold text-muted-foreground/50">{campaign.name.substring(0, 2).toUpperCase()}</span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-6">
        <div className="flex min-w-[200px] flex-1 flex-col justify-center">
          <span className="block truncate text-[14px] font-semibold tracking-[-0.01em]">
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
        </div>

        <div className="hidden shrink-0 items-center gap-1.5 @[700px]:flex">
          {platformsOf(campaign).map((id) => {
            const meta = platformMeta(id);
            return (
              <span
                key={id}
                className={cn(
                  "flex size-6 items-center justify-center rounded-full inset-ring-1",
                  meta.tint,
                )}
                title={meta.label}
              >
                <span aria-hidden className={cn("size-1.5 rounded-full", meta.dot)} />
              </span>
            );
          })}
        </div>

        <div className="hidden min-w-[140px] shrink-0 flex-col items-end gap-1 @[900px]:flex">
          <span
            className={cn(
              "flex h-5 items-center gap-1.5 rounded-(--r-pill) px-1.5 text-[10px] font-medium inset-ring-1",
              tone.chip,
            )}
          >
            <span aria-hidden className={cn("size-1.5 rounded-(--r-round)", tone.dot)} />
            {tone.label}
          </span>
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground/85">{submitted}</span> posts
            </span>
            {drafts > 0 && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="flex items-center gap-1 text-amber-300/90">
                  <FileEdit className="size-3 shrink-0" />
                  <span className="tabular-nums">{drafts}</span> waiting
                </span>
              </>
            )}
            {needsPost && drafts === 0 && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-muted-foreground/70">Needs post</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-[color,translate] duration-200 group-hover:translate-x-0.5 group-hover:bg-(--ink)/[0.04] group-hover:text-foreground/80">
          <ArrowRight className="size-4" />
        </div>
        <CampaignContextMenu campaignId={campaign.id} onOpen={onOpen} />
      </div>
    </div>
  );
}
