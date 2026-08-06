"use client";

import { QrGlyph } from "@/components/public/qr-glyph";
import {
  EmptyBoard,
  Puck,
  postImage,
  type ScreenViewProps,
} from "@/components/public/templates/shared";
import { formatScore, leaderboardFor } from "@/lib/leaderboard";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/leaderboard";

const LANES = 8;

export function RelayView({ campaign, posts, mediaAssets, postIndex }: ScreenViewProps) {
  const contest = campaign.contest;
  const entries = leaderboardFor(campaign, posts).slice(0, LANES);

  if (entries.length === 0) return <EmptyBoard campaign={campaign} />;

  const top = Math.max(...entries.map((e) => e.score));
  const post = posts[postIndex % Math.max(1, posts.length)];
  const image = postImage(post, mediaAssets);

  return (
    <div className="relative flex size-full flex-col gap-[2cqh] p-[3.5%]">
      <div className="flex shrink-0 items-start justify-between gap-[3cqw]">
        <div className="min-w-0">
          <span className="block text-[1.5cqw] font-semibold uppercase tracking-[0.2em] text-(--screen-accent)">
            {contest.leaderboardTitle.trim() || "Live standings"}
          </span>
          <h1 className="mt-[0.4cqh] truncate text-[4cqw] font-semibold leading-none tracking-[-0.03em]">
            {campaign.name || "Untitled campaign"}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-[1.2cqw]">
          <span className="text-right">
            <span className="block text-[1.3cqw] font-semibold uppercase tracking-[0.14em] text-(--screen-muted)">
              {contest.ctaText.trim() || "Scan to join in"}
            </span>
            <span className="block text-[1.1cqw] text-(--screen-muted)">
              {entries.length} in the race
            </span>
          </span>
          <span className="flex size-[7cqw] items-center justify-center rounded-[0.7cqw] bg-white p-[0.5cqw]">
            <QrGlyph seed={campaign.id} className="size-full text-neutral-900" />
          </span>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col justify-between">
        <span
          aria-hidden
          className="absolute inset-y-0 right-0 w-[1.1cqw] opacity-70"
          style={{
            backgroundImage:
              "repeating-conic-gradient(var(--screen-ink) 0% 25%, transparent 0% 50%)",
            backgroundSize: "0.55cqw 0.55cqw",
          }}
        />

        {entries.map((entry) => (
          <Lane
            key={entry.id}
            entry={entry}
            fraction={top > 0 ? entry.score / top : 0}
            locale={contest.locale}
            ranked={contest.ranked}
          />
        ))}
      </div>

      {post && (
        <div className="flex shrink-0 items-center gap-[1.4cqw] rounded-[1cqw] bg-(--screen-panel) p-[1cqw] ring-1 ring-(--screen-line)">
          <span className="flex size-[4.5cqw] shrink-0 items-center justify-center overflow-hidden rounded-[0.6cqw] bg-(--screen-panel-strong)">
            {image?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image.url} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-[1.6cqw] font-semibold text-(--screen-accent)">
                {(postIndex % Math.max(1, posts.length)) + 1}
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[1.1cqw] font-semibold uppercase tracking-[0.16em] text-(--screen-accent)">
              Now sharing
            </span>
            <span className="mt-[0.2cqh] block truncate text-[1.7cqw] font-medium">
              {post.copy.trim() || "No copy yet."}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

function Lane({
  entry,
  fraction,
  locale,
  ranked,
}: {
  entry: LeaderboardEntry;
  fraction: number;
  locale: string;
  ranked: boolean;
}) {
  const leader = entry.rank === 1;
  /* Keep every puck on the track even at a score of zero, and clear of the finish line. */
  const left = `calc(${6 + fraction * 84}%)`;

  return (
    <div className="relative flex min-h-0 flex-1 items-center">
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-1/2 h-[0.15cqw] -translate-y-1/2",
          leader ? "bg-(--screen-accent)/45" : "bg-(--screen-line)",
        )}
      />

      <span
        className={cn(
          "relative z-10 w-[5%] shrink-0 text-[2.6cqw] font-semibold leading-none tabular-nums",
          leader ? "text-(--screen-accent)" : "text-(--screen-muted)/60",
        )}
      >
        {ranked ? String(entry.rank).padStart(2, "0") : "★"}
      </span>

      <span
        className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-[0.8cqw] transition-[left] duration-700"
        style={{ left, transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
      >
        <Puck
          entry={entry}
          className={cn(leader ? "size-[4.2cqw] text-[1.5cqw]" : "size-[3.4cqw] text-[1.2cqw]")}
          style={{ boxShadow: "0 0 0 0.25cqw var(--screen-bg)" }}
        />
        <span className="whitespace-nowrap">
          <span
            className={cn(
              "block text-[1.5cqw] font-semibold leading-tight",
              !leader && "text-(--screen-ink)/85",
            )}
          >
            {entry.name}
          </span>
          {ranked && (
            <span className="block text-[1.2cqw] font-semibold tabular-nums leading-tight text-(--screen-accent)">
              {formatScore(entry.score, locale)}
            </span>
          )}
        </span>
      </span>
    </div>
  );
}
