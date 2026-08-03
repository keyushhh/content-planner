"use client";

import { useState } from "react";
import { formatFollowers, mentionAccounts } from "@/lib/mentions";
import { mockCount, mockSeries, mockTrendPercent } from "@/lib/mock-engagement";
import { avatarTint, cn } from "@/lib/utils";

export const CAMPAIGN_PARTICIPANTS = mentionAccounts.filter((a) => a.kind === "person");

// Theme-remapped in globals.css; both pairs clear 3:1 against the surface they land on.
const SPARK_COLOR = {
  sky: "var(--color-sky-400)",
  brand: "var(--color-violet-400)",
} as const;

const PLOT_W = 120;
const PLOT_H = 44;
const PLOT_PAD = 4;
const PLOT_POINTS = 11;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// Straight segments, not a curve — the angular corners are what read as plotted data.
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

// Owns its seeds and its container so the two pages can't drift. `className` is outer
// spacing only — the avatars' ring colour depends on this component's own background.
export function CampaignStatsRow({
  campaignId,
  className,
}: {
  campaignId: string;
  className?: string;
}) {
  const totalShares = mockCount(campaignId, 40, 900);
  const estReach = mockCount(`reach-${campaignId}`, 3000, 90000);

  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-(--r-surface) bg-(--surface-raised) p-6 shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.08] sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="flex flex-1 items-center gap-4">
        <span className="flex -space-x-2.5">
          {CAMPAIGN_PARTICIPANTS.slice(0, 4).map((p) => (
            <AvatarPhoto key={p.id} person={p} className="size-10" />
          ))}
        </span>
        <div className="min-w-0">
          <span className="block text-[26px] font-semibold leading-none tabular-nums">
            {CAMPAIGN_PARTICIPANTS.length}
          </span>
          <span className="mt-1.5 block text-[12px] leading-snug text-muted-foreground">
            people sharing this campaign
          </span>
        </div>
      </div>

      <StatTile
        label="Total shares"
        value={String(totalShares)}
        trendPct={mockTrendPercent(campaignId)}
        seed={campaignId}
        tone="sky"
      />

      <StatTile
        label="Est. reach"
        value={formatFollowers(estReach)}
        trendPct={mockTrendPercent(`reach-${campaignId}`)}
        seed={`reach-${campaignId}`}
        tone="brand"
      />
    </div>
  );
}
