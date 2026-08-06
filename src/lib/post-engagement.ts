import { mockCount } from "./mock-engagement";
import { PEOPLE } from "./leaderboard";
import type { Campaign, Session } from "./types";

export const PRIMARY_VARIANT_ID = "primary";

/* A variant needs some volume behind it before a lead means anything: the QR hands
   variants out at random, so a small sample is the draw talking, not the copy. */
export const MIN_SHARES_FOR_WINNER = 4;

export interface PostVariant {
  id: string;
  label: string;
  copy: string;
}

export interface ShareEvent {
  id: string;
  sharerId: string;
  sharerName: string;
  variantId: string;
  likes: number;
  comments: number;
  clicks: number;
  reach: number;
  sharedAt: string;
}

export interface VariantStat {
  id: string;
  label: string;
  copy: string;
  shares: number;
  likes: number;
  comments: number;
  clicks: number;
  reach: number;
  score: number;
  rank: number;
  isWinner: boolean;
  /** How far ahead of the primary post this version is, as a percentage. Null on the
   *  primary itself, and when the primary scored nothing to measure against. */
  deltaVsPrimary: number | null;
  /** Score as a fraction of the leader's, for sizing a bar. */
  fraction: number;
}

export interface PostTotals {
  shares: number;
  likes: number;
  comments: number;
  clicks: number;
  reach: number;
}

export interface PostEngagement {
  events: ShareEvent[];
  variants: PostVariant[];
  stats: VariantStat[];
  totals: PostTotals;
  leader: VariantStat | null;
}

/** Everything the QR can hand out: the post itself, then its alternates. */
export function postVariants(session: Session): PostVariant[] {
  return [
    { id: PRIMARY_VARIANT_ID, label: "Primary post", copy: session.copy },
    ...session.variations.map((variation) => ({
      id: variation.id,
      label: variation.label,
      copy: variation.copy,
    })),
  ];
}

/** One row per share: who scanned, which variant they got, what it earned. Every
 *  other number on the report is a sum or a group-by over this, so they cannot disagree. */
export function shareEventsFor(
  campaign: Campaign,
  session: Session,
  now: number,
): ShareEvent[] {
  const variants = postVariants(session);
  const seed = `${campaign.id}-${session.id}`;
  const count = mockCount(`shares-${seed}`, 5, 34);

  return Array.from({ length: count }, (_, i) => {
    const person = PEOPLE[mockCount(`who-${seed}-${i}`, 0, PEOPLE.length - 1)];
    const variant = variants[mockCount(`variant-${seed}-${i}`, 0, variants.length - 1)];
    const reach = mockCount(`reach-${seed}-${i}`, 180, 4200);
    const daysAgo = mockCount(`when-${seed}-${i}`, 0, 21);
    const minutesAgo = mockCount(`minute-${seed}-${i}`, 0, 1439);

    return {
      id: `${session.id}-share-${i}`,
      sharerId: person.id,
      sharerName: person.name,
      variantId: variant.id,
      likes: mockCount(`likes-${seed}-${i}`, 0, 46),
      comments: mockCount(`comments-${seed}-${i}`, 0, 12),
      clicks: mockCount(`clicks-${seed}-${i}`, 0, 58),
      reach,
      sharedAt: new Date(
        now - daysAgo * 86_400_000 - minutesAgo * 60_000,
      ).toISOString(),
    };
  });
}

export function postTotals(events: ShareEvent[]): PostTotals {
  return events.reduce<PostTotals>(
    (totals, event) => ({
      shares: totals.shares + 1,
      likes: totals.likes + event.likes,
      comments: totals.comments + event.comments,
      clicks: totals.clicks + event.clicks,
      reach: totals.reach + event.reach,
    }),
    { shares: 0, likes: 0, comments: 0, clicks: 0, reach: 0 },
  );
}

/** The one definition of "best": likes, shares and comments added together. */
export function scoreOf(totals: PostTotals): number {
  return totals.likes + totals.shares + totals.comments;
}

export function variantStats(
  events: ShareEvent[],
  variants: PostVariant[],
): VariantStat[] {
  const ranked = variants
    .map((variant) => {
      const mine = events.filter((event) => event.variantId === variant.id);
      const totals = postTotals(mine);
      return {
        ...variant,
        ...totals,
        score: scoreOf(totals),
        rank: 0,
        isWinner: false,
        deltaVsPrimary: null as number | null,
        fraction: 0,
      };
    })
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .map((stat, i) => ({ ...stat, rank: i + 1 }));

  const winnable =
    ranked.length > 1 &&
    ranked[0].shares >= MIN_SHARES_FOR_WINNER &&
    ranked[0].score > ranked[1].score;

  const best = ranked[0]?.score ?? 0;
  const primary = ranked.find((stat) => stat.id === PRIMARY_VARIANT_ID)?.score ?? 0;

  return ranked.map((stat) => ({
    ...stat,
    isWinner: winnable && stat.rank === 1,
    fraction: best > 0 ? stat.score / best : 0,
    deltaVsPrimary:
      stat.id === PRIMARY_VARIANT_ID || primary === 0
        ? null
        : Math.round(((stat.score - primary) / primary) * 100),
  }));
}

/** The variant to put money behind, or null when the post has no alternates, the
 *  sample is too thin to call, or two variants are tied at the top. */
export function leadingVariant(stats: VariantStat[]): VariantStat | null {
  return stats.find((stat) => stat.isWinner) ?? null;
}

export function postEngagement(
  campaign: Campaign,
  session: Session,
  now: number,
): PostEngagement {
  const events = shareEventsFor(campaign, session, now);
  const variants = postVariants(session);
  const stats = variantStats(events, variants);

  return {
    events,
    variants,
    stats,
    totals: postTotals(events),
    leader: leadingVariant(stats),
  };
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** The share ledger as CSV, one row per share, so the numbers can leave the app. */
export function shareLedgerCsv(
  events: ShareEvent[],
  variants: PostVariant[],
): string {
  const labelOf = (id: string) =>
    variants.find((variant) => variant.id === id)?.label ?? id;

  const rows = [
    ["Shared by", "Version", "Likes", "Comments", "Clicks", "Potential reach", "Shared at"],
    ...events.map((event) => [
      event.sharerName,
      labelOf(event.variantId),
      event.likes,
      event.comments,
      event.clicks,
      event.reach,
      event.sharedAt,
    ]),
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

/** Filesystem-safe stem for the downloaded file. */
export function reportFileName(campaignName: string, postTitle: string): string {
  const slug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled";

  return `${slug(campaignName)}-${slug(postTitle)}-shares.csv`;
}

export function formatMetric(value: number, locale: string) {
  try {
    return new Intl.NumberFormat(locale, { notation: "compact" }).format(value);
  } catch {
    return String(value);
  }
}
