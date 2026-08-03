"use client";

import { useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  FileEdit,
  ImageIcon,
  Share2,
} from "lucide-react";
import { PublicPostCard } from "@/components/public/public-post-card";
import { ShareButton } from "@/components/public/share-button";
import { SocialProofStack } from "@/components/public/social-proof-stack";
import { platformMeta } from "@/lib/platforms";
import { isRichTextEmpty } from "@/lib/rich-text";
import {
  CAMPAIGN_STATE,
  campaignState,
  campaignSubmitted,
  endsLabel,
  platformsOf,
  sortBySentDesc,
} from "@/lib/campaigns";
import { formatFollowers, mentionAccounts } from "@/lib/mentions";
import { mockCount, mockSeries, mockTrendPercent } from "@/lib/mock-engagement";
import { mediaAssets as staticMediaAssets } from "@/lib/mock-data";
import { avatarTint, cn, tagTint } from "@/lib/utils";
import type { Campaign, Session } from "@/lib/types";

function readStored(id: string): { campaign: Campaign | null; sessions: Session[] } {
  try {
    const campaigns: Campaign[] = JSON.parse(localStorage.getItem("cp_campaigns") || "[]");
    const sessions: Session[] = JSON.parse(localStorage.getItem("cp_sessions") || "[]");
    return { campaign: campaigns.find((c) => c.id === id) ?? null, sessions };
  } catch {
    return { campaign: null, sessions: [] };
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const PARTICIPANTS = mentionAccounts.filter((a) => a.kind === "person");
const PAGE_SIZE = 10;

// Both tones resolve per theme through the palette remap in globals.css — sky-400 is
// #38bdf8 on the dark surface and #0284c7 on white, violet-400 is #34d399 / #059669.
// Each pair clears the 3:1 contrast floor against the surface it actually renders on;
// the raw hex the old sparkline hardcoded only worked in dark mode.
const SPARK_COLOR = {
  sky: "var(--color-sky-400)",
  brand: "var(--color-violet-400)",
} as const;

const PLOT_W = 120;
const PLOT_H = 44;
const PLOT_PAD = 4;
const PLOT_POINTS = 11;

// Straight segments, not a smoothed curve: the angular corners are what make the shape
// read as plotted data. Few enough points that each segment is a deliberate line rather
// than one wobble in a noisy curve.
function linePathFrom(coords: readonly (readonly [number, number])[]): string {
  const r = (n: number) => Math.round(n * 100) / 100;
  return coords.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${r(x)} ${r(y)}`).join(" ");
}

function Sparkline({ seed, tone }: { seed: string; tone: keyof typeof SPARK_COLOR }) {
  const series = mockSeries(seed, PLOT_POINTS);
  const stepX = PLOT_W / (series.length - 1);
  const coords = series.map(
    (v, i) => [i * stepX, PLOT_PAD + (PLOT_H - PLOT_PAD * 2) * (1 - v)] as const,
  );
  const linePath = linePathFrom(coords);
  const areaPath = `${linePath} L ${PLOT_W} ${PLOT_H} L 0 ${PLOT_H} Z`;
  const gradientId = `spark-fill-${seed}`;
  const color = SPARK_COLOR[tone];

  return (
    <svg
      viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
      className="h-11 w-[42%] shrink-0"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      {/* non-scaling-stroke: the viewBox stretches to the tile's width, so without it the
          stroke thins horizontally and its weight drifts with the tile size. `miter` joins
          keep the corners sharp — the default round join softens them back into a curve. */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function StatTile({
  label,
  value,
  trendPct,
  seed,
  tone,
}: {
  label: string;
  value: string;
  trendPct: number;
  seed: string;
  tone: keyof typeof SPARK_COLOR;
}) {
  return (
    <div className="flex flex-1 items-center justify-between gap-3 overflow-hidden rounded-(--r-inner) bg-(--ink)/[0.03] px-4 py-3.5 inset-ring-1 inset-ring-(--ink)/[0.06]">
      <div className="min-w-0">
        <span className="block text-[11.5px] text-muted-foreground">{label}</span>
        {/* Proportional figures, not tabular: at 22px `tabular-nums` gives every digit the
            width of a 0, which makes a value like 79 read loose and misaligned. */}
        <span className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-[22px] font-semibold leading-none tracking-[-0.02em]">{value}</span>
          <span className="text-[12px] font-medium leading-none text-emerald-400">+{trendPct}%</span>
        </span>
      </div>
      <Sparkline seed={seed} tone={tone} />
    </div>
  );
}

// Decorative placeholder, not a scannable code — a real payload needs a QR encoder.
// Laid out as a version-1 grid (three finder patterns + seeded modules) so it reads as a
// QR at a glance instead of as an icon of one.
function QrGlyph({ seed, className }: { seed: string; className?: string }) {
  const size = 21;
  const finders = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ] as const;

  const reserved = (x: number, y: number) =>
    finders.some(([ox, oy]) => x >= ox - 1 && x <= ox + 7 && y >= oy - 1 && y <= oy + 7);

  const modules: ReactNode[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (reserved(x, y)) continue;
      if (mockCount(`${seed}-qr-${x}-${y}`, 0, 1) === 0) continue;
      modules.push(
        <rect key={`${x}-${y}`} x={x + 0.06} y={y + 0.06} width={0.88} height={0.88} rx={0.3} />,
      );
    }
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} fill="currentColor" aria-hidden>
      {modules}
      {finders.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={7} height={7} rx={2} />
          <rect x={x + 1} y={y + 1} width={5} height={5} rx={1.4} fill="#ffffff" />
          <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.9} />
        </g>
      ))}
    </svg>
  );
}

function AvatarPhoto({
  person,
  className,
}: {
  person: { id: string; name: string };
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          "flex items-center justify-center rounded-(--r-round) text-[12px] font-semibold ring-4 ring-(--surface-raised)",
          className,
          avatarTint(person.name),
        )}
      >
        {initials(person.name)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://i.pravatar.cc/128?u=${encodeURIComponent(person.id)}`}
      alt=""
      onError={() => setFailed(true)}
      className={cn("rounded-(--r-round) object-cover ring-4 ring-(--surface-raised)", className)}
    />
  );
}

function PostRow({ post }: { post: Session }) {
  const image = post.visualAssetIds
    .map((id) => staticMediaAssets.find((a) => a.id === id))
    .find((a): a is NonNullable<typeof a> => Boolean(a) && a!.type === "image");
  const shares = mockCount(post.id, 8, 210);
  const reach = mockCount(`reach-${post.id}`, 400, 18000);
  const tag = post.tags[0];

  return (
    <Link
      href={`/p/${post.id}`}
      className="group flex items-center gap-3 rounded-(--r-inner) p-2 transition-colors duration-150 hover:bg-(--ink)/[0.04]"
    >
      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-(--r-inner) bg-(--ink)/[0.06] text-muted-foreground/40">
        {image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-5" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block line-clamp-2 text-[13.5px] font-medium text-foreground/90">
          {post.copy.trim() || <span className="italic text-muted-foreground/60">No copy yet.</span>}
        </span>
        {tag && (
          <span
            className={cn(
              "mt-1 inline-flex h-5 items-center rounded-(--r-pill) px-2 text-[10px] font-medium",
              tagTint(tag),
            )}
          >
            {tag}
          </span>
        )}
      </span>

      <span className="hidden shrink-0 flex-col items-end gap-0.5 text-right sm:flex">
        <span className="text-[13px] font-medium tabular-nums text-foreground/85">
          {shares} shares
        </span>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {formatFollowers(reach)} reach
        </span>
      </span>

      <span className="flex h-8 shrink-0 items-center gap-1.5 rounded-(--r-pill) bg-violet-500/15 px-3 text-[12px] font-medium text-violet-200 inset-ring-1 inset-ring-violet-400/25 transition-colors duration-150 group-hover:bg-violet-500/25">
        <Share2 className="size-3.5" />
        Share
      </span>
    </Link>
  );
}

export default function PublicCampaignContent() {
  const params = useParams<{ id: string }>();
  const [{ campaign, sessions }] = useState(() => readStored(params.id));
  const [now] = useState(() => Date.now());
  const [page, setPage] = useState(1);

  const posts = campaign
    ? campaignSubmitted(sessions, campaign).slice().sort(sortBySentDesc)
    : [];

  if (!campaign) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-1.5 p-6 text-center">
        <h1 className="text-[17px] font-semibold">This page doesn&rsquo;t exist</h1>
        <p className="max-w-[40ch] text-pretty text-[13px] text-muted-foreground">
          The link you followed isn&rsquo;t valid, or the campaign has been removed.
        </p>
      </div>
    );
  }

  const primaryPlatform = campaign.platforms[0];
  const platformLabel = primaryPlatform ? platformMeta(primaryPlatform).label : "your network";
  const tone = CAMPAIGN_STATE[campaignState(campaign, now)];
  const ends = endsLabel(campaign.endDate, now);

  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rangeStart = posts.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, posts.length);
  const pagedPosts = posts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalShares = mockCount(campaign.id, 40, 900);
  const estReach = mockCount(`reach-${campaign.id}`, 3000, 90000);
  const sharesTrendPct = mockTrendPercent(campaign.id);
  const reachTrendPct = mockTrendPercent(`reach-${campaign.id}`);

  return (
    <div className="h-dvh overflow-y-auto [background-image:var(--wash-page)]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-6 pt-8 pb-16">
        <div
          className={cn(
            "grid grid-cols-1 items-start gap-6",
            posts.length > 0 && "lg:grid-cols-[380px_1fr]",
          )}
        >
          <div className="flex flex-col gap-4">
            <span className="text-[11px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/70">
              Advocacy Campaign
            </span>

            <h1 className="-mt-2 flex flex-wrap items-center gap-2.5 text-[28px] font-semibold leading-tight tracking-[-0.025em] text-balance">
              {campaign.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={campaign.logoUrl}
                  alt=""
                  className="size-8 shrink-0 rounded-(--r-inner) object-cover inset-ring-1 inset-ring-(--ink)/[0.1]"
                />
              ) : (
                <span
                  aria-hidden
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-(--r-inner) text-[12px] font-semibold inset-ring-1 inset-ring-(--ink)/[0.1]",
                    avatarTint(campaign.name),
                  )}
                >
                  {initials(campaign.name)}
                </span>
              )}
              {campaign.name}
              <span
                className={cn(
                  "flex h-[22px] shrink-0 items-center gap-1.5 rounded-(--r-pill) px-2.5 text-[11px] font-medium inset-ring-1",
                  tone.chip,
                )}
              >
                <span aria-hidden className={cn("size-1.5 rounded-(--r-round)", tone.dot)} />
                {tone.label}
              </span>
            </h1>

            <p className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
              <span className="rounded-(--r-inner) bg-(--ink)/[0.06] px-1.5 py-px text-[9.5px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.06em] text-muted-foreground/85">
                {campaign.tag}
              </span>
              <span className="tabular-nums">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </span>
              <span className="text-muted-foreground/30">&middot;</span>
              <span>{ends.date}</span>
              {ends.soon && (
                <>
                  <span className="text-muted-foreground/30">&middot;</span>
                  <span className="text-amber-300/80">{ends.soon}</span>
                </>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-1.5">
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
            </div>

            <ShareButton platformLabel={platformLabel} label="Share Campaign" className="mt-1" />
          </div>

          {/* Two equal halves: the copy sizes to its own column rather than pushing the
              white panel out to ~65% of the card. */}
          {posts.length > 0 && (
            <div className="relative grid h-full grid-cols-1 items-stretch overflow-hidden rounded-(--r-surface) bg-(--surface-raised) shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.08] sm:grid-cols-2">
              <div className="flex min-w-0 flex-col justify-center px-6 py-6">
                <h2 className="text-[15px] font-semibold tracking-tight">
                  Help us spread the word.
                </h2>
                {!isRichTextEmpty(campaign.description) ? (
                  <div
                    className="rich-text mt-1.5 text-[12.5px] leading-[1.55] text-muted-foreground text-pretty"
                    dangerouslySetInnerHTML={{ __html: campaign.description }}
                  />
                ) : (
                  <p className="mt-1.5 text-[12.5px] leading-[1.55] text-muted-foreground text-pretty">
                    Share {campaign.name} with your network on {platformLabel} and help it reach
                    more people.
                  </p>
                )}
              </div>
              <div
                aria-hidden
                className="hidden items-center justify-center bg-white px-6 py-7 sm:flex"
              >
                <QrGlyph
                  seed={campaign.id}
                  className="aspect-square w-full max-w-[152px] text-neutral-900"
                />
              </div>
            </div>
          )}
        </div>

        {posts.length > 0 && (
          <div className="flex flex-col gap-6 rounded-(--r-surface) bg-(--surface-raised) p-6 shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.08] sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-4">
              <span className="flex -space-x-2.5">
                {PARTICIPANTS.slice(0, 4).map((p) => (
                  <AvatarPhoto key={p.id} person={p} className="size-10" />
                ))}
              </span>
              <div className="min-w-0">
                <span className="block text-[26px] font-semibold leading-none tabular-nums">
                  {PARTICIPANTS.length}
                </span>
                <span className="mt-1.5 block text-[12px] leading-snug text-muted-foreground">
                  people sharing this campaign
                </span>
              </div>
            </div>

            <StatTile
              label="Total shares"
              value={String(totalShares)}
              trendPct={sharesTrendPct}
              seed={campaign.id}
              tone="sky"
            />

            <StatTile
              label="Est. reach"
              value={formatFollowers(estReach)}
              trendPct={reachTrendPct}
              seed={`reach-${campaign.id}`}
              tone="brand"
            />
          </div>
        )}

        {posts.length === 1 ? (
          <div className="flex w-full max-w-[480px] flex-col gap-3 self-center">
            <PublicPostCard
              session={posts[0]}
              authorName={posts[0].lastEditedBy?.name ?? campaign.name}
            />
            <SocialProofStack
              people={PARTICIPANTS}
              caption={`${PARTICIPANTS.length} ${
                PARTICIPANTS.length === 1 ? "person has" : "people have"
              } shared from this campaign.`}
              emptyCaption="Be the first to share from this campaign."
            />
          </div>
        ) : posts.length > 1 ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/70">
                All posts
              </span>
              <span className="text-[12px] tabular-nums text-muted-foreground/60">
                {posts.length} total
              </span>
            </div>
            <div className="flex flex-col divide-y divide-(--ink)/[0.06] rounded-(--r-surface) bg-(--surface-raised) px-2 shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.08]">
              {pagedPosts.map((post) => (
                <PostRow key={post.id} post={post} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <p className="text-[12px] text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium tabular-nums text-foreground/90">
                    {rangeStart}&ndash;{rangeEnd}
                  </span>{" "}
                  of <span className="tabular-nums">{posts.length}</span>
                </p>
                <nav
                  aria-label="Pagination"
                  className="flex items-center gap-0.5 rounded-(--r-pill) bg-white dark:bg-(--ink)/[0.03] p-1 inset-ring-1 inset-ring-(--ink)/[0.08]"
                >
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    aria-label="Previous page"
                    title="Previous page"
                    className="relative flex size-8 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color,scale] duration-150 after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press) disabled:pointer-events-none disabled:text-muted-foreground/30"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="px-2 text-[12px] font-medium tabular-nums text-foreground/90">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    aria-label="Next page"
                    title="Next page"
                    className="relative flex size-8 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color,scale] duration-150 after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press) disabled:pointer-events-none disabled:text-muted-foreground/30"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </nav>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-(--r-surface) bg-(--ink)/[0.03] px-6 py-10 text-center inset-ring-1 inset-ring-(--ink)/[0.06]">
            <span className="flex size-10 items-center justify-center rounded-(--r-round) bg-(--ink)/[0.06] text-muted-foreground/50">
              <FileEdit className="size-4.5" />
            </span>
            <p className="text-[13.5px] font-medium text-foreground">Nothing shared yet</p>
            <p className="max-w-[38ch] text-[12.5px] text-muted-foreground text-pretty">
              Check back soon &mdash; posts from this campaign will show up here as soon as they go
              out.
            </p>
          </div>
        )}

        {campaign.thankYou.trim() && (
          <p className="text-[12.5px] leading-snug text-muted-foreground/80 text-pretty">
            {campaign.thankYou.trim()}
          </p>
        )}
      </div>
    </div>
  );
}
