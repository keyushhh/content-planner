import type { Campaign, CampaignState, Session } from "./types";

export const CAMPAIGN_STATE: Record<
  CampaignState,
  { label: string; chip: string; dot: string }
> = {
  draft: {
    label: "Draft",
    chip: "bg-(--ink)/[0.06] text-muted-foreground inset-ring-(--ink)/[0.10]",
    dot: "bg-muted-foreground/60",
  },
  live: {
    label: "Live",
    chip: "bg-emerald-500/[0.13] text-emerald-200 inset-ring-emerald-400/30",
    dot: "bg-emerald-400",
  },
  ended: {
    label: "Ended",
    chip: "bg-amber-500/[0.10] text-amber-200/85 inset-ring-amber-400/25",
    dot: "bg-amber-400/80",
  },
};

export function hasEnded(campaign: Campaign, now = Date.now()) {
  if (!campaign.endDate || campaign.endDate === "TBD") return false;
  const parsed = new Date(campaign.endDate);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() < now;
}

export function campaignState(campaign: Campaign, now = Date.now()): CampaignState {
  if (hasEnded(campaign, now)) return "ended";
  return campaign.inWozku ? "live" : "draft";
}

export function canGoLive(
  campaign: Campaign,
  sessions: Session[],
  now = Date.now(),
) {
  return (
    campaignState(campaign, now) === "draft" &&
    campaignSubmitted(sessions, campaign).length > 0
  );
}

export function endsLabel(endDate: string, now = Date.now()) {
  if (!endDate || endDate === "TBD") return { date: "No end date", soon: null };
  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) return { date: "No end date", soon: null };
  const date = parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const days = Math.ceil((parsed.getTime() - now) / 86400000);
  if (days < 0) return { date: `Ended ${date}`, soon: null };
  if (days === 0) return { date: `Ends ${date}`, soon: "today" };
  if (days === 1) return { date: `Ends ${date}`, soon: "tomorrow" };
  if (days <= 14) return { date: `Ends ${date}`, soon: `${days} days left` };
  return { date: `Ends ${date}`, soon: null };
}

export function isDraftIn(session: Session, campaignId: string) {
  return session.draftCampaignIds.includes(campaignId);
}

export function isSubmittedIn(
  session: Session,
  campaign: Pick<Campaign, "id" | "sessionIds">,
) {
  return (
    session.sentToCampaignIds.includes(campaign.id) ||
    campaign.sessionIds.includes(session.id)
  );
}

export function campaignDrafts(sessions: Session[], campaignId: string) {
  return sessions.filter((s) => isDraftIn(s, campaignId));
}

export function campaignSubmitted(
  sessions: Session[],
  campaign: Pick<Campaign, "id" | "sessionIds">,
) {
  return sessions.filter(
    (s) => isSubmittedIn(s, campaign) && !isDraftIn(s, campaign.id),
  );
}

export function campaignMembers(
  sessions: Session[],
  campaign: Pick<Campaign, "id" | "sessionIds">,
) {
  return sessions.filter(
    (s) => isDraftIn(s, campaign.id) || isSubmittedIn(s, campaign),
  );
}

export function campaignNamesFor(session: Session, campaigns: Campaign[]) {
  const seen = new Set<string>();
  const named: { name: string; draft: boolean }[] = [];
  for (const id of session.draftCampaignIds) {
    const campaign = campaigns.find((c) => c.id === id);
    if (campaign && !seen.has(id)) {
      seen.add(id);
      named.push({ name: campaign.name, draft: true });
    }
  }
  for (const id of session.sentToCampaignIds) {
    const campaign = campaigns.find((c) => c.id === id);
    if (campaign && !seen.has(id)) {
      seen.add(id);
      named.push({ name: campaign.name, draft: false });
    }
  }
  return named;
}
