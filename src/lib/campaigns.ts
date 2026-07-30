import type { Campaign, Session } from "./types";

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
  for (const id of session.sentToCampaignIds) {
    const campaign = campaigns.find((c) => c.id === id);
    if (campaign && !seen.has(id)) {
      seen.add(id);
      named.push({ name: campaign.name, draft: false });
    }
  }
  for (const id of session.draftCampaignIds) {
    const campaign = campaigns.find((c) => c.id === id);
    if (campaign && !seen.has(id)) {
      seen.add(id);
      named.push({ name: campaign.name, draft: true });
    }
  }
  return named;
}
