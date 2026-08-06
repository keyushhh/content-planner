"use client";

import { QrGlyph } from "@/components/public/qr-glyph";
import { EmptyBoard, type ScreenViewProps } from "@/components/public/templates/shared";
import { formatScore, leaderboardFor } from "@/lib/leaderboard";
import { endsLabel } from "@/lib/campaigns";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/leaderboard";

const PER_COLUMN = 6;

export function LedgerView({ campaign, posts, postIndex }: ScreenViewProps) {
  const contest = campaign.contest;
  const entries = leaderboardFor(campaign, posts).slice(0, PER_COLUMN * 2);

  if (entries.length === 0) return <EmptyBoard campaign={campaign} />;

  const columns = [entries.slice(0, PER_COLUMN), entries.slice(PER_COLUMN)];
  const post = posts[postIndex % Math.max(1, posts.length)];
  const ends = endsLabel(campaign.endDate);

  return (
    <div className="relative flex size-full flex-col p-[4%]">
      <div className="flex shrink-0 items-end justify-between gap-[2cqw] border-b-[0.25cqw] border-(--screen-ink) pb-[1.4cqh]">
        <div className="min-w-0">
          <h1 className="truncate text-[4.4cqw] font-semibold leading-none tracking-[-0.035em]">
            {campaign.name || "Untitled campaign"}
          </h1>
          <span className="mt-[0.6cqh] block text-[1.3cqw] uppercase tracking-[0.26em] text-(--screen-muted)">
            {contest.leaderboardTitle.trim() || "Standings"} &middot; {ends.date}
          </span>
        </div>
        <span className="shrink-0 text-right text-[1.3cqw] uppercase tracking-[0.18em] text-(--screen-muted)">
          {entries.length} listed
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-x-[4cqw] pt-[1.4cqh]">
        {columns.map((column, i) => (
          <div key={i} className="flex min-h-0 flex-col justify-start">
            {column.map((entry) => (
              <LedgerRow
                key={entry.id}
                entry={entry}
                locale={contest.locale}
                ranked={contest.ranked}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-[1.6cqw] border-t-[0.25cqw] border-(--screen-ink) pt-[1.4cqh]">
        <span className="flex size-[6.5cqw] shrink-0 items-center justify-center bg-white p-[0.4cqw] ring-1 ring-(--screen-line)">
          <QrGlyph seed={campaign.id} className="size-full text-neutral-900" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[1.8cqw] font-semibold leading-tight">
            {contest.ctaText.trim() || "Scan to join in"}
          </span>
          {post && (
            <span className="mt-[0.3cqh] block truncate text-[1.4cqw] leading-tight text-(--screen-muted)">
              {post.copy.trim() || "No copy yet."}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

function LedgerRow({
  entry,
  locale,
  ranked,
}: {
  entry: LeaderboardEntry;
  locale: string;
  ranked: boolean;
}) {
  return (
    <div className="flex items-baseline gap-[1cqw] border-b border-(--screen-line) py-[0.9cqh]">
      <span
        className={cn(
          "w-[3.2cqw] shrink-0 text-[2cqw] font-semibold tabular-nums leading-none",
          entry.rank === 1 ? "text-(--screen-accent)" : "text-(--screen-muted)",
        )}
      >
        {ranked ? String(entry.rank).padStart(2, "0") : "—"}
      </span>
      <span className="min-w-0 flex-1 truncate text-[2cqw] font-medium leading-none">
        {entry.name}
      </span>
      <span
        aria-hidden
        className="mx-[0.6cqw] hidden min-w-[2cqw] flex-1 self-center border-b border-dotted border-(--screen-line) sm:block"
      />
      {ranked && (
        <span className="shrink-0 text-[2cqw] font-semibold tabular-nums leading-none">
          {formatScore(entry.score, locale)}
        </span>
      )}
    </div>
  );
}
