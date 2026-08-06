"use client";

import { useMemo } from "react";
import { Download, Trophy, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { PRIMARY_ACTION_SM } from "@/lib/button-styles";
import { Hint } from "@/components/ui/tooltip";
import { initials } from "@/lib/leaderboard";
import {
  MIN_SHARES_FOR_WINNER,
  postEngagement,
  reportFileName,
  shareLedgerCsv,
  type PostTotals,
  type PostVariant,
  type ShareEvent,
  type VariantStat,
} from "@/lib/post-engagement";
import { avatarTint, cn, relativeTime } from "@/lib/utils";
import type { Campaign, Session } from "@/lib/types";

interface PostReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign;
  session: Session | null;
  now: number;
}

export function PostReportSheet({
  open,
  onOpenChange,
  campaign,
  session,
  now,
}: PostReportSheetProps) {
  const report = useMemo(
    () => (session ? postEngagement(campaign, session, now) : null),
    [campaign, session, now],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        side="right"
        aria-label="Post report"
        className="flex !w-[720px] !max-w-[calc(100vw-2rem)] flex-col gap-0 border-0 bg-(--surface-canvas) p-0 text-foreground shadow-(--lift-edge)"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-px [background-image:var(--specular-v)]"
        />

        <div className="flex shrink-0 items-start justify-between gap-3 px-7 pb-4 pt-6">
          <div className="min-w-0">
            <div className="mb-2 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="shrink-0 font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/60">
                Campaign
              </span>
              <span className="truncate font-medium text-foreground/85">
                {campaign.name}
              </span>
            </div>
            <h2 className="truncate text-[21px] font-semibold leading-tight tracking-[-0.022em]">
              {session?.title || "Untitled post"}
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-snug text-muted-foreground text-pretty">
              What this post earned once advocates shared it, and which wording did
              the earning.
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="-mr-2 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-(--r-pill) text-muted-foreground outline-none transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground focus-visible:inset-ring-2 focus-visible:inset-ring-violet-400/60 active:scale-(--press)"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto [background-image:var(--wash-page)] px-6 pb-6 pt-1">
          {report && (
            <>
              <StatStrip totals={report.totals} />

              {report.variants.length > 1 ? (
                <Card
                  title="Which version is winning"
                  hint={`Scored on likes, shares and comments together. A version needs ${MIN_SHARES_FOR_WINNER} shares before it can be called, because the QR hands versions out at random.`}
                >
                  <div className="flex flex-col gap-2">
                    {report.stats.map((stat) => (
                      <VariantRow
                        key={stat.id}
                        stat={stat}
                        tint={tintOf(report.variants, stat.id)}
                      />
                    ))}
                  </div>
                </Card>
              ) : (
                <Card
                  title="Which version is winning"
                  hint="Add variations to this post and the QR will hand them out at random, so you can see which wording performs."
                >
                  <p className="text-[12.5px] leading-snug text-muted-foreground text-pretty">
                    This post has no variations, so every share carried the same copy.
                    The numbers above are all of it.
                  </p>
                </Card>
              )}

              <Card
                title="Shares"
                hint="One row per person who shared this post, and the version they were given."
                action={
                  report.events.length > 0 && session ? (
                    <button
                      onClick={() =>
                        downloadCsv(
                          shareLedgerCsv(report.events, report.variants),
                          reportFileName(campaign.name, session.title || "untitled post"),
                        )
                      }
                      className={cn(PRIMARY_ACTION_SM, "shrink-0")}
                    >
                      <Download className="size-3" />
                      Download CSV
                    </button>
                  ) : undefined
                }
              >
                {report.events.length === 0 ? (
                  <p className="text-[12.5px] text-muted-foreground">
                    Nobody has shared this post yet.
                  </p>
                ) : (
                  <Ledger
                    events={report.events}
                    variants={report.variants}
                    now={now}
                  />
                )}
              </Card>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function downloadCsv(csv: string, fileName: string) {
  const url = URL.createObjectURL(
    new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/* One surface split by hairlines, not five floating cards. These numbers are context
   for the comparison below, so they read as a single object rather than five headlines. */
function StatStrip({ totals }: { totals: PostTotals }) {
  const cells = [
    { label: "Shares", value: totals.shares, lead: true },
    { label: "Likes", value: totals.likes, lead: false },
    { label: "Comments", value: totals.comments, lead: false },
    { label: "Clicks", value: totals.clicks, lead: false },
    { label: "Reach", value: totals.reach, lead: false },
  ];

  return (
    <div className="grid shrink-0 grid-cols-2 overflow-hidden rounded-(--r-surface) bg-(--surface-raised) shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.08] sm:grid-cols-5">
      {cells.map((cell, i) => (
        <div
          key={cell.label}
          className={cn(
            "flex flex-col gap-1 px-4 py-3",
            i > 0 && "border-l border-(--ink)/[0.06]",
          )}
        >
          <span className="text-[10px] font-medium font-(family-name:--font-label) uppercase tracking-[0.1em] text-muted-foreground/60">
            {cell.label}
          </span>
          <span
            className={cn(
              "tabular-nums leading-none tracking-[-0.025em]",
              cell.lead
                ? "text-[21px] font-semibold"
                : "text-[19px] font-medium text-foreground/80",
            )}
          >
            {cell.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function Card({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="shrink-0 overflow-hidden rounded-(--r-surface) bg-(--surface-raised) shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.08]">
      <div
        aria-hidden
        className="h-px w-full shrink-0 [background-image:var(--specular)]"
      />
      <div className="flex flex-col gap-3 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[13.5px] font-semibold">{title}</span>
            <span className="text-[11.5px] leading-snug text-muted-foreground/80 text-pretty">
              {hint}
            </span>
          </div>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

/* Stable per position in the post, not per rank, so a version keeps its colour as the
   standings move. The same dot appears in the ledger, which makes the raw rows scannable. */
const VARIANT_DOTS = [
  "bg-(--ink)/45",
  "bg-violet-400",
  "bg-sky-400",
  "bg-amber-400",
  "bg-fuchsia-400",
  "bg-teal-400",
] as const;

function tintOf(variants: PostVariant[], id: string): string {
  const at = variants.findIndex((variant) => variant.id === id);
  return VARIANT_DOTS[Math.max(0, at) % VARIANT_DOTS.length];
}

function VariantRow({ stat, tint }: { stat: VariantStat; tint: string }) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-2.5 overflow-hidden rounded-(--r-float) px-4 py-3.5 transition-colors duration-200 inset-ring-1",
        stat.isWinner
          ? "bg-live-500/[0.06] inset-ring-live-400/25"
          : "bg-(--ink)/[0.025] inset-ring-(--ink)/[0.06]",
      )}
    >
      {stat.isWinner && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:var(--wash-success)]"
        />
      )}

      <div className="relative flex items-baseline gap-2.5">
        <span
          className={cn(
            "w-3 shrink-0 text-[11px] font-medium tabular-nums",
            stat.isWinner ? "text-live-300/80" : "text-muted-foreground/40",
          )}
        >
          {stat.rank}
        </span>

        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          <span
            aria-hidden
            className={cn("size-1.5 shrink-0 translate-y-[-1px] rounded-(--r-round)", tint)}
          />
          <span className="truncate text-[13px] font-semibold tracking-[-0.01em]">
            {stat.label}
          </span>
          {stat.isWinner && (
            <span className="flex shrink-0 items-center gap-1 self-center rounded-(--r-pill) bg-live-500/[0.14] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-live-200 inset-ring-1 inset-ring-live-400/30">
              <Trophy className="size-2.5" />
              Best
            </span>
          )}
        </span>

        <Hint label="Likes plus shares plus comments">
          <span
            className={cn(
              "shrink-0 tabular-nums tracking-[-0.03em]",
              stat.isWinner
                ? "text-[22px] font-semibold text-live-100"
                : "text-[18px] font-medium text-foreground/70",
            )}
          >
            {stat.score.toLocaleString()}
          </span>
        </Hint>
      </div>

      {/* The gap between versions is the point, so draw it rather than leaving it to arithmetic. */}
      <div className="relative h-1 overflow-hidden rounded-(--r-pill) bg-(--ink)/[0.07]">
        <span
          className={cn(
            "block h-full rounded-(--r-pill) transition-[width] duration-500",
            stat.isWinner ? "bg-live-400" : "bg-(--ink)/25",
          )}
          style={{ width: `${Math.max(2, stat.fraction * 100)}%` }}
        />
      </div>

      {stat.copy && (
        <p
          className={cn(
            "relative line-clamp-2 text-[12.5px] leading-relaxed text-pretty",
            stat.isWinner ? "text-foreground/90" : "text-muted-foreground",
          )}
        >
          {stat.copy}
        </p>
      )}

      <div className="relative flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tabular-nums text-muted-foreground/65">
        <span className={stat.isWinner ? "text-live-200/75" : undefined}>
          {stat.shares} shares
        </span>
        <Dot />
        <span>{stat.likes.toLocaleString()} likes</span>
        <Dot />
        <span>{stat.comments} comments</span>
        <Dot />
        <span>{stat.clicks.toLocaleString()} clicks</span>
        {/* A 0% delta is a tie, and "0% vs primary" reads as a bug rather than a result. */}
        {stat.deltaVsPrimary !== null && stat.deltaVsPrimary !== 0 && (
          <>
            <Dot />
            <span
              className={cn(
                "font-medium",
                stat.deltaVsPrimary > 0 ? "text-live-300/85" : "text-muted-foreground/60",
              )}
            >
              {stat.deltaVsPrimary > 0 ? "+" : ""}
              {stat.deltaVsPrimary}% vs primary
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function Dot() {
  return <span aria-hidden className="text-muted-foreground/25">&middot;</span>;
}

const LEDGER_GRID = "minmax(0,1.6fr) minmax(0,1.2fr) 3.5rem 4.5rem 4rem 4rem";

function Ledger({
  events,
  variants,
  now,
}: {
  events: ShareEvent[];
  variants: PostVariant[];
  now: number;
}) {
  const labelOf = (id: string) =>
    variants.find((variant) => variant.id === id)?.label ?? "Primary post";

  const sorted = [...events].sort(
    (a, b) => Date.parse(b.sharedAt) - Date.parse(a.sharedAt),
  );

  return (
    <div className="-mx-1 overflow-x-auto">
      <div className="min-w-[520px] px-1">
        <div
          style={{ gridTemplateColumns: LEDGER_GRID }}
          className="grid items-center gap-3 border-b border-(--ink)/[0.06] pb-1.5 text-[10.5px] font-medium font-(family-name:--font-label) uppercase tracking-[0.08em] text-muted-foreground/60"
        >
          <span>Shared by</span>
          <span>Version</span>
          <span className="text-right">Likes</span>
          <span className="text-right">Comments</span>
          <span className="text-right">Reach</span>
          <span className="text-right">When</span>
        </div>

        <div className="flex flex-col">
          {sorted.map((event) => (
            <div
              key={event.id}
              style={{ gridTemplateColumns: LEDGER_GRID }}
              className="grid items-center gap-3 border-b border-(--ink)/[0.04] py-2 text-[12px] last:border-b-0"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-(--r-round) text-[10px] font-semibold",
                    avatarTint(event.sharerName),
                  )}
                >
                  {initials(event.sharerName)}
                </span>
                <span className="truncate">{event.sharerName}</span>
              </span>
              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 shrink-0 rounded-(--r-round)",
                    tintOf(variants, event.variantId),
                  )}
                />
                <span className="truncate">{labelOf(event.variantId)}</span>
              </span>
              <span className="text-right tabular-nums">{event.likes}</span>
              <span className="text-right tabular-nums">{event.comments}</span>
              <span className="text-right tabular-nums">
                {event.reach.toLocaleString()}
              </span>
              <span className="text-right text-muted-foreground/70">
                {relativeTime(event.sharedAt, now)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
