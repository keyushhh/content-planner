"use client";

import { QrGlyph } from "@/components/public/qr-glyph";
import { Puck, postImage, type ScreenViewProps } from "@/components/public/templates/shared";
import { formatScore, leaderboardFor } from "@/lib/leaderboard";
import { mockCount } from "@/lib/mock-engagement";
import { cn } from "@/lib/utils";
import type { MediaAsset, Session } from "@/lib/types";

const TILES = 11;

export function MosaicView({ campaign, posts, mediaAssets, postIndex }: ScreenViewProps) {
  const contest = campaign.contest;
  const entries = leaderboardFor(campaign, posts).slice(0, 5);

  /* Busiest post takes the big cell, the rest fill in around it. */
  const ranked = [...posts]
    .map((post) => ({ post, shares: mockCount(post.id, 8, 210) }))
    .sort((a, b) => b.shares - a.shares);
  const feature = ranked[0];
  const rest = ranked.slice(1, TILES);
  const lit = posts.length > 1 ? posts[postIndex % posts.length]?.id : undefined;

  return (
    <div className="relative flex size-full flex-col gap-[1.6cqh] p-[2.5%]">
      <div className="flex shrink-0 items-center justify-between gap-[2cqw]">
        <div className="flex min-w-0 items-center gap-[1.2cqw]">
          {campaign.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={campaign.logoUrl}
              alt=""
              className="size-[3.4cqw] shrink-0 rounded-[0.5cqw] object-cover ring-1 ring-(--screen-line)"
            />
          )}
          <h1 className="min-w-0 truncate text-[3cqw] font-semibold leading-none tracking-[-0.03em]">
            {campaign.name || "Untitled campaign"}
          </h1>
          <span className="shrink-0 rounded-full bg-(--screen-accent) px-[1cqw] py-[0.3cqh] text-[1.1cqw] font-semibold text-(--screen-accent-ink)">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-[0.9cqw]">
          <span className="text-right text-[1.2cqw] font-semibold uppercase tracking-[0.14em] text-(--screen-muted)">
            {contest.ctaText.trim() || "Scan to join in"}
          </span>
          <span className="flex size-[5cqw] items-center justify-center rounded-[0.5cqw] bg-white p-[0.35cqw]">
            <QrGlyph seed={campaign.id} className="size-full text-neutral-900" />
          </span>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[1cqh] rounded-[1.2cqw] bg-(--screen-panel) ring-1 ring-(--screen-line)">
          <span className="text-[3cqw] font-semibold tracking-[-0.02em]">
            The wall is empty
          </span>
          <span className="text-[1.6cqw] text-(--screen-muted)">
            Turn a post on in Screen Setup and it lands here.
          </span>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-3 gap-[0.8cqw]">
          {feature && (
            <Tile
              post={feature.post}
              shares={feature.shares}
              mediaAssets={mediaAssets}
              lit={lit === feature.post.id}
              feature
            />
          )}
          {rest.map((item) => (
            <Tile
              key={item.post.id}
              post={item.post}
              shares={item.shares}
              mediaAssets={mediaAssets}
              lit={lit === item.post.id}
            />
          ))}
        </div>
      )}

      {entries.length > 0 && (
        <div className="flex shrink-0 items-center gap-[0.8cqw]">
          <span className="shrink-0 text-[1.1cqw] font-semibold uppercase tracking-[0.16em] text-(--screen-muted)">
            {contest.leaderboardTitle.trim() || "Leaderboard"}
          </span>
          {entries.map((entry) => (
            <span
              key={entry.id}
              className="flex min-w-0 flex-1 items-center gap-[0.6cqw] rounded-full bg-(--screen-panel) px-[0.8cqw] py-[0.5cqh] ring-1 ring-(--screen-line)"
            >
              <Puck entry={entry} className="size-[2.2cqw] text-[0.95cqw]" />
              <span className="min-w-0 flex-1 truncate text-[1.2cqw] font-medium">
                {entry.name}
              </span>
              {contest.ranked && (
                <span className="shrink-0 text-[1.2cqw] font-semibold tabular-nums text-(--screen-accent)">
                  {formatScore(entry.score, contest.locale)}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Tile({
  post,
  shares,
  mediaAssets,
  lit,
  feature = false,
}: {
  post: Session;
  shares: number;
  mediaAssets: MediaAsset[];
  lit: boolean;
  feature?: boolean;
}) {
  const image = postImage(post, mediaAssets);

  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col justify-end overflow-hidden rounded-[0.9cqw] bg-(--screen-panel) p-[0.9cqw] ring-1 transition-[box-shadow,scale] duration-500",
        feature && "col-span-2 row-span-2",
        lit ? "ring-(--screen-accent) scale-[1.01]" : "ring-(--screen-line)",
      )}
    >
      {image?.url && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt="" className="absolute inset-0 size-full object-cover" />
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, color-mix(in srgb, var(--screen-bg) 88%, transparent), transparent 65%)",
            }}
          />
        </>
      )}

      <span className="relative min-w-0">
        <span
          className={cn(
            "block font-medium leading-snug",
            feature ? "line-clamp-4 text-[1.9cqw]" : "line-clamp-2 text-[1.15cqw]",
          )}
        >
          {post.copy.trim() || "No copy yet."}
        </span>
        <span
          className={cn(
            "mt-[0.4cqh] block font-semibold tabular-nums text-(--screen-accent)",
            feature ? "text-[1.4cqw]" : "text-[1cqw]",
          )}
        >
          {shares} shares
        </span>
      </span>
    </div>
  );
}
