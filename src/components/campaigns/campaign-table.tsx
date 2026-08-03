import { ArrowRight, FileEdit } from "lucide-react";
import { CAMPAIGN_STATE, endsLabel } from "@/lib/campaigns";
import { cn } from "@/lib/utils";
import type { Campaign, CampaignState } from "@/lib/types";
import { CampaignContextMenu } from "./campaign-context-menu";

export function CampaignTable({
  rows,
  now,
  onOpen,
}: {
  rows: {
    campaign: Campaign;
    state: CampaignState;
    drafts: number;
    submitted: number;
  }[];
  now: number;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="w-full overflow-hidden rounded-(--r-surface) bg-(--surface-raised) shadow-sm inset-ring-1 inset-ring-(--ink)/[0.06]">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-(--ink)/[0.06] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground/80">
              <th className="px-4 py-3 font-medium">Campaign</th>
              <th className="px-10 py-3 font-medium">Status</th>
              <th className="px-10 py-3 font-medium">Posts</th>
              <th className="px-10 py-3 font-medium">End date</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--ink)/[0.04]">
            {rows.map((row) => {
              const { campaign, state, drafts, submitted } = row;
              const tone = CAMPAIGN_STATE[state];
              const ends = endsLabel(campaign.endDate, now);
              const needsPost = state === "draft" && submitted === 0;

              return (
                <tr
                  key={campaign.id}
                  onClick={() => onOpen(campaign.id)}
                  className="group cursor-pointer bg-transparent transition-colors hover:bg-(--ink)/[0.02]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--ink)/[0.03] inset-ring-1 inset-ring-(--ink)/[0.08]">
                        {campaign.logoUrl ? (
                          <img src={campaign.logoUrl} alt="" className="size-full rounded-[7px] object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground/50">{campaign.name.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate font-semibold text-foreground/90">
                          {campaign.name}
                        </span>
                        <span className="mt-0.5 inline-flex items-center rounded-(--r-inner) bg-(--ink)/[0.06] px-1.5 py-px text-[9.5px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.06em] text-muted-foreground/85">
                          {campaign.tag}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-3 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex h-5 items-center gap-1.5 rounded-(--r-pill) px-1.5 text-[10px] font-medium inset-ring-1",
                        tone.chip,
                      )}
                    >
                      <span aria-hidden className={cn("size-1.5 rounded-(--r-round)", tone.dot)} />
                      {tone.label}
                    </span>
                  </td>
                  <td className="px-10 py-3 whitespace-nowrap">
                    <div className="flex flex-col justify-center">
                      <span className="text-muted-foreground">
                        <span className="font-medium tabular-nums text-foreground/85">{submitted}</span>
                      </span>
                      {drafts > 0 && (
                        <span className="mt-0.5 flex items-center gap-1 text-[10.5px] text-amber-300/90">
                          <FileEdit className="size-2.5 shrink-0" />
                          <span className="tabular-nums">{drafts}</span> waiting
                        </span>
                      )}
                      {needsPost && drafts === 0 && (
                        <span className="mt-0.5 text-[10.5px] text-muted-foreground/70">Needs post</span>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-3 whitespace-nowrap">
                    <div className="flex flex-col justify-center">
                      <span className="text-muted-foreground">{ends.date}</span>
                      {ends.soon && (
                        <span className="mt-0.5 text-[10.5px] text-amber-300/80">{ends.soon}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/30 transition-colors group-hover:bg-(--ink)/[0.04] group-hover:text-foreground/80">
                        <ArrowRight className="size-4" />
                      </span>
                      <CampaignContextMenu campaignId={campaign.id} onOpen={() => onOpen(campaign.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
