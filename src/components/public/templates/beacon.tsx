"use client";

import { QrGlyph } from "@/components/public/qr-glyph";
import { EmptyBoard, type ScreenViewProps } from "@/components/public/templates/shared";
import { formatScore, leaderboardFor } from "@/lib/leaderboard";
import { cn } from "@/lib/utils";

export function BeaconWelcome({ campaign }: ScreenViewProps) {
  return (
    <BeaconSplit campaign={campaign} label="Join in">
      <h1 className="text-[8cqw] font-semibold uppercase leading-[0.95] tracking-[-0.04em] text-balance">
        {campaign.name || "Untitled campaign"}
      </h1>
    </BeaconSplit>
  );
}

export function BeaconPosts({ campaign, posts, postIndex }: ScreenViewProps) {
  const post = posts[Math.min(postIndex, Math.max(0, posts.length - 1))];

  return (
    <BeaconSplit
      campaign={campaign}
      label={
        post
          ? `Post ${Math.min(postIndex, posts.length - 1) + 1} / ${posts.length}`
          : "No posts yet"
      }
    >
      <p className="line-clamp-5 text-[4.4cqw] font-medium leading-[1.15] tracking-[-0.025em] text-balance">
        {post ? post.copy.trim() || "No copy yet." : "Turn a post on in Screen Setup."}
      </p>
    </BeaconSplit>
  );
}

export function BeaconLeaderboard({ campaign, posts }: ScreenViewProps) {
  const contest = campaign.contest;
  const entries = leaderboardFor(campaign, posts).slice(0, 5);

  if (entries.length === 0) return <EmptyBoard campaign={campaign} />;

  return (
    <BeaconSplit campaign={campaign} label={contest.leaderboardTitle.trim() || "Standings"}>
      <div className="flex w-full flex-col gap-[1.2cqh]">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-baseline gap-[1.4cqw]">
            <span
              className={cn(
                "shrink-0 text-[4cqw] font-semibold tabular-nums leading-none",
                entry.rank === 1 ? "text-(--screen-accent)" : "text-(--screen-muted)/55",
              )}
            >
              {contest.ranked ? entry.rank : "★"}
            </span>
            <span className="min-w-0 flex-1 truncate text-[3.4cqw] font-medium leading-none">
              {entry.name}
            </span>
            {contest.ranked && (
              <span className="shrink-0 text-[3cqw] font-semibold tabular-nums leading-none">
                {formatScore(entry.score, contest.locale)}
              </span>
            )}
          </div>
        ))}
      </div>
    </BeaconSplit>
  );
}

/* One enormous code on the right, one message on the left. Nothing else. */
function BeaconSplit({
  campaign,
  label,
  children,
}: {
  campaign: ScreenViewProps["campaign"];
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex size-full items-center gap-[4cqw] p-[5%]">
      <div className="flex min-w-0 flex-1 flex-col gap-[2cqh]">
        <span className="text-[1.6cqw] font-semibold uppercase tracking-[0.3em] text-(--screen-accent)">
          {label}
        </span>
        {children}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-[1.2cqh]">
        <span className="flex size-[26cqw] items-center justify-center bg-white p-[1.2cqw]">
          <QrGlyph seed={campaign.id} className="size-full text-neutral-900" />
        </span>
        <span className="text-center text-[1.6cqw] font-semibold uppercase tracking-[0.2em]">
          {campaign.contest.ctaText.trim() || "Scan to join in"}
        </span>
      </div>
    </div>
  );
}

export const BEACON_MOMENTS = {
  welcome: BeaconWelcome,
  posts: BeaconPosts,
  leaderboard: BeaconLeaderboard,
} as const;
