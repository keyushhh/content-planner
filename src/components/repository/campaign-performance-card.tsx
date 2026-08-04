"use client";

import { useMemo, useState } from "react";
import { ChevronDown, LineChart as LineChartIcon } from "lucide-react";
import { StatTile } from "@/components/campaigns/campaign-stats-row";
import { formatFollowers } from "@/lib/mentions";
import { mockCount, mockSeries, mockTrendPercent } from "@/lib/mock-engagement";
import { cn } from "@/lib/utils";

const PERIODS = {
  monthly: { label: "Monthly", points: 6, xLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
  weekly: {
    label: "Weekly",
    points: 8,
    xLabels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
  },
} as const;

type PeriodKey = keyof typeof PERIODS;

const CHART_W = 640;
const CHART_H = 200;
const PAD_L = 40;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 28;

function niceMax(value: number) {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

export function CampaignPerformanceCard({
  campaignId,
  className,
}: {
  campaignId: string;
  className?: string;
}) {
  const [period, setPeriod] = useState<PeriodKey>("monthly");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  /* Collapsed by default — the posts table below is what the page is actually for. */
  const [chartOpen, setChartOpen] = useState(false);

  const totalShares = mockCount(campaignId, 40, 900);
  const estReach = mockCount(`reach-${campaignId}`, 3000, 90000);
  const engagementRate = mockCount(`engagement-${campaignId}`, 2, 9);

  const { points, xLabels } = PERIODS[period];

  const { values, maxValue, linePath, areaPath, coords } = useMemo(() => {
    const walk = mockSeries(`reach-trend-${campaignId}-${period}`, points);
    const low = estReach * 0.55;
    const high = estReach * 1.15;
    const raw = walk.map((v) => Math.round(low + (high - low) * v));
    const max = niceMax(Math.max(...raw));

    const plotW = CHART_W - PAD_L - PAD_R;
    const plotH = CHART_H - PAD_T - PAD_B;
    const stepX = points > 1 ? plotW / (points - 1) : 0;

    const pts = raw.map((v, i) => {
      const x = PAD_L + i * stepX;
      const y = PAD_T + plotH * (1 - v / max);
      return [x, y] as const;
    });

    const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${PAD_T + plotH} L ${pts[0][0].toFixed(1)} ${PAD_T + plotH} Z`;

    return { values: raw, maxValue: max, linePath: line, areaPath: area, coords: pts };
  }, [campaignId, period, points, estReach]);

  const trendPct = mockTrendPercent(`reach-trend-${campaignId}`);
  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-(--r-surface) bg-(--surface-raised) p-5 shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.08]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[13.5px] font-semibold">
          <LineChartIcon className="size-4 text-muted-foreground" />
          Performance
        </span>

        <div className="flex items-center gap-1.5">
          {chartOpen && (
            <div className="relative">
              <button
                onClick={() => setPeriodOpen((v) => !v)}
                className="flex h-7 items-center gap-1.5 rounded-(--r-pill) bg-(--ink)/[0.04] px-2.5 text-[11.5px] font-medium text-foreground/80 inset-ring-1 inset-ring-(--ink)/[0.08] transition-colors duration-150 hover:bg-(--ink)/[0.07]"
              >
                {PERIODS[period].label}
                <ChevronDown className="size-3" />
              </button>
              {periodOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 flex w-[120px] flex-col overflow-hidden rounded-(--r-inner) bg-(--surface-dialog) py-1 shadow-(--lift-md) inset-ring-1 inset-ring-(--ink)/[0.09]">
                  {(Object.keys(PERIODS) as PeriodKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setPeriod(key);
                        setPeriodOpen(false);
                      }}
                      className={cn(
                        "px-3 py-1.5 text-left text-[12px] font-medium transition-colors duration-150 hover:bg-(--ink)/[0.06]",
                        key === period && "text-violet-300",
                      )}
                    >
                      {PERIODS[key].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setChartOpen((v) => !v);
              setPeriodOpen(false);
            }}
            aria-expanded={chartOpen}
            className="flex h-7 items-center gap-1.5 rounded-(--r-pill) px-2 text-[11.5px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground"
          >
            {chartOpen ? "Hide chart" : "Show chart"}
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-200",
                chartOpen && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
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
        <StatTile
          label="Engagement rate"
          value={`${engagementRate}%`}
          trendPct={mockTrendPercent(`engagement-${campaignId}`)}
          seed={`engagement-${campaignId}`}
          tone="amber"
        />
      </div>

      {chartOpen && (
      <div className="duration-200 animate-in fade-in slide-in-from-top-1">
        <p className="mb-3 text-[12px] leading-snug text-muted-foreground text-pretty">
          Reach has moved up ~{trendPct}% across this {period === "monthly" ? "half-year" : "8-week"} window.
        </p>

        <div className="relative">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full"
            role="img"
            aria-label="Estimated reach trend"
            onMouseLeave={() => setHoverIndex(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const relX = ((e.clientX - rect.left) / rect.width) * CHART_W;
              const plotW = CHART_W - PAD_L - PAD_R;
              const stepX = points > 1 ? plotW / (points - 1) : plotW;
              const idx = Math.round((relX - PAD_L) / stepX);
              setHoverIndex(Math.min(Math.max(idx, 0), points - 1));
            }}
          >
            <defs>
              <linearGradient id={`reach-fill-${campaignId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-violet-400)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--color-violet-400)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {gridSteps.map((g) => {
              const y = PAD_T + (CHART_H - PAD_T - PAD_B) * (1 - g);
              return (
                <g key={g}>
                  <line
                    x1={PAD_L}
                    x2={CHART_W - PAD_R}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    className="text-(--ink)/[0.07]"
                    strokeWidth="1"
                  />
                  <text
                    x={PAD_L - 8}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-[9px]"
                  >
                    {formatFollowers(Math.round(maxValue * g))}
                  </text>
                </g>
              );
            })}

            {xLabels.map((label, i) => {
              const plotW = CHART_W - PAD_L - PAD_R;
              const stepX = points > 1 ? plotW / (points - 1) : 0;
              const x = PAD_L + i * stepX;
              return (
                <text
                  key={label}
                  x={x}
                  y={CHART_H - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px]"
                >
                  {label}
                </text>
              );
            })}

            <path d={areaPath} fill={`url(#reach-fill-${campaignId})`} />
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-violet-400)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            {hoverIndex !== null && coords[hoverIndex] && (
              <g>
                <line
                  x1={coords[hoverIndex][0]}
                  x2={coords[hoverIndex][0]}
                  y1={PAD_T}
                  y2={CHART_H - PAD_B}
                  stroke="currentColor"
                  className="text-(--ink)/[0.18]"
                  strokeWidth="1"
                />
                <circle
                  cx={coords[hoverIndex][0]}
                  cy={coords[hoverIndex][1]}
                  r="3.5"
                  fill="var(--color-violet-400)"
                  stroke="var(--surface-raised)"
                  strokeWidth="1.5"
                />
              </g>
            )}
          </svg>

          {hoverIndex !== null && coords[hoverIndex] && (
            <div
              className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-full flex-col items-center gap-0.5 rounded-(--r-inner) bg-(--surface-dialog) px-2.5 py-1.5 text-[11px] shadow-(--lift-md) inset-ring-1 inset-ring-(--ink)/[0.09]"
              style={{
                left: `${(coords[hoverIndex][0] / CHART_W) * 100}%`,
                top: `${(coords[hoverIndex][1] / CHART_H) * 100}%`,
                marginTop: "-8px",
              }}
            >
              <span className="font-semibold">{formatFollowers(values[hoverIndex])}</span>
              <span className="text-muted-foreground">{xLabels[hoverIndex]}</span>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
