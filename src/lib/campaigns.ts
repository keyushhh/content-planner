import { isRichTextEmpty } from "./rich-text";
import { migrateContest } from "./contest";
import { migrateScreenTheme } from "./screen-theme";
import type {
  Campaign,
  CampaignSettings,
  CampaignState,
  NewCampaign,
  Session,
} from "./types";

export const CAMPAIGN_STATE: Record<
  CampaignState,
  { label: string; meaning: string; chip: string; dot: string }
> = {
  draft: {
    label: "Draft",
    meaning: "Not published yet. Submit posts, then take it live.",
    chip: "bg-(--ink)/[0.06] text-muted-foreground inset-ring-(--ink)/[0.10]",
    dot: "bg-muted-foreground/60",
  },
  live: {
    label: "Live",
    meaning: "Published on Wozku. Its public page is open to visitors.",
    chip: "bg-live-500/[0.13] text-live-200 inset-ring-live-400/30",
    dot: "bg-live-400",
  },
  /* Sky, not amber: green reads live and amber reads ended, and a pause is neither
     finished nor a problem — it is on hold. */
  paused: {
    label: "Paused",
    meaning: "Published but on hold. Its public page is unavailable until you resume it.",
    chip: "bg-sky-500/[0.12] text-sky-200 inset-ring-sky-400/30",
    dot: "bg-sky-400",
  },
  ended: {
    label: "Ended",
    meaning: "Its end date has passed, so it is no longer collecting shares.",
    chip: "bg-amber-500/[0.10] text-amber-200/85 inset-ring-amber-400/25",
    dot: "bg-amber-400/80",
  },
};

export const BLANK_SETTINGS: CampaignSettings = {
  multiPostIntervals: false,
  holdAndFire: false,
  sendToAdvocates: false,
  communityInvitation: false,
  jobRoles: [],
};

export function blankCampaign(): NewCampaign {
  return {
    name: "",
    tag: "",
    endDate: "",
    platforms: ["linkedin"],
    logoUrl: "",
    headerUrl: "",
    description: "",
    thankYou: "",
    redirectUrl: "",
    linkedInCompanyId: "",
    settings: { ...BLANK_SETTINGS },
  };
}

export function migrateCampaign(c: Campaign): Campaign {
  return {
    ...c,
    platforms: Array.isArray(c.platforms) ? c.platforms : ["linkedin"],
    sessionIds: Array.isArray(c.sessionIds) ? c.sessionIds : [],
    paused: c.paused ?? false,
    stopped: c.stopped ?? false,
    hiddenSessionIds: Array.isArray(c.hiddenSessionIds) ? c.hiddenSessionIds : [],
    tag: c.tag || "NEW",
    endDate: c.endDate ?? "",
    logoUrl: c.logoUrl ?? "",
    headerUrl: c.headerUrl ?? "",
    description: c.description ?? "",
    thankYou: c.thankYou ?? "",
    redirectUrl: c.redirectUrl ?? "",
    settings: { ...BLANK_SETTINGS, ...(c.settings ?? {}) },
    theme: migrateScreenTheme(c.theme),
    contest: migrateContest(c.contest),
  };
}

export const CAMPAIGN_REQUIRED: {
  key: keyof NewCampaign;
  label: string;
  filled: (c: NewCampaign) => boolean;
}[] = [
  { key: "logoUrl", label: "Logo", filled: (c) => c.logoUrl.trim().length > 0 },
  { key: "name", label: "Campaign name", filled: (c) => c.name.trim().length > 0 },
  {
    key: "headerUrl",
    label: "Header image",
    filled: (c) => c.headerUrl.trim().length > 0,
  },
  {
    key: "description",
    label: "Page description",
    filled: (c) => !isRichTextEmpty(c.description),
  },
  {
    key: "thankYou",
    label: "Thank you message",
    filled: (c) => c.thankYou.trim().length > 0,
  },
  { key: "endDate", label: "End date", filled: (c) => c.endDate.trim().length > 0 },
];

export function missingFields(c: NewCampaign) {
  return CAMPAIGN_REQUIRED.filter((field) => !field.filled(c));
}

export function platformsOf(campaign: Campaign) {
  return Array.isArray(campaign.platforms) ? campaign.platforms : [];
}

export function hasEnded(campaign: Campaign, now = Date.now()) {
  if (campaign.stopped) return true;
  if (!campaign.endDate || campaign.endDate === "TBD") return false;
  const parsed = new Date(campaign.endDate);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() < now;
}

/* Order matters: a passed end date outranks everything, an unpublished campaign is a draft
   whether or not it carries a stale paused flag, and only then does pausing apply. */
export function campaignState(campaign: Campaign, now = Date.now()): CampaignState {
  if (hasEnded(campaign, now)) return "ended";
  if (!campaign.inWozku) return "draft";
  return campaign.paused ? "paused" : "live";
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
    (campaign.sessionIds ?? []).includes(session.id)
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

export function isHiddenOnScreen(campaign: Campaign, sessionId: string) {
  return (campaign.hiddenSessionIds ?? []).includes(sessionId);
}

/**
 * Submitted posts in the order the public screen shows them. `sessionIds` is already
 * append-ordered from submitting, so it doubles as the screen order — anything missing
 * from it (legacy data) falls to the end, keeping the sort total.
 */
export function screenPosts(sessions: Session[], campaign: Campaign) {
  const order = campaign.sessionIds ?? [];
  const rank = (s: Session) => {
    const at = order.indexOf(s.id);
    return at === -1 ? order.length : at;
  };
  return campaignSubmitted(sessions, campaign).sort((a, b) => rank(a) - rank(b));
}

/** What visitors actually see: screen order, minus anything toggled off. */
export function publicScreenPosts(sessions: Session[], campaign: Campaign) {
  return screenPosts(sessions, campaign).filter((s) => !isHiddenOnScreen(campaign, s.id));
}

export function sortBySentDesc(a: Session, b: Session) {
  return (
    new Date(b.sentAt ?? b.updatedAt).getTime() - new Date(a.sentAt ?? a.updatedAt).getTime()
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
  const named: { id: string; name: string; draft: boolean }[] = [];
  for (const id of session.draftCampaignIds) {
    const campaign = campaigns.find((c) => c.id === id);
    if (campaign && !seen.has(id)) {
      seen.add(id);
      named.push({ id: campaign.id, name: campaign.name, draft: true });
    }
  }
  for (const id of session.sentToCampaignIds) {
    const campaign = campaigns.find((c) => c.id === id);
    if (campaign && !seen.has(id)) {
      seen.add(id);
      named.push({ id: campaign.id, name: campaign.name, draft: false });
    }
  }
  return named;
}
