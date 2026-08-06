"use client";

import { ImageIcon } from "lucide-react";
import {
  EmptyBoard,
  Kicker,
  Puck,
  ScanToJoin,
  Stage,
  postImage,
  type ScreenViewProps,
} from "@/components/public/templates/shared";
import { embedUrl, isDirectVideo } from "@/lib/screen-theme";
import { contestEndMessage } from "@/lib/contest";
import { formatScore, leaderboardFor } from "@/lib/leaderboard";
import { hasEnded } from "@/lib/campaigns";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/leaderboard";

export function BladeWelcome({ campaign }: ScreenViewProps) {
  return (
    <Stage image={campaign.theme.moments.welcome.imageUrl}>
      <Kicker>Welcome</Kicker>
      {campaign.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={campaign.logoUrl} alt="" className="h-[9cqh] w-auto object-contain" />
      )}
      <h1 className="text-[6cqw] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
        {campaign.name || "Untitled campaign"}
      </h1>
      <ScanToJoin campaign={campaign} />
    </Stage>
  );
}

export function BladePosts({ campaign, posts, mediaAssets, postIndex }: ScreenViewProps) {
  const post = posts[Math.min(postIndex, Math.max(0, posts.length - 1))];

  if (!post) {
    return (
      <Stage>
        <Kicker>Posts</Kicker>
        <h2 className="text-[3.4cqw] font-semibold tracking-[-0.02em]">
          No posts on the screen yet
        </h2>
        <p className="max-w-[46ch] text-[1.7cqw] leading-snug text-(--screen-muted) text-pretty">
          Turn a post on in Screen Setup and it appears here.
        </p>
      </Stage>
    );
  }

  const image = postImage(post, mediaAssets);

  return (
    <div className="relative flex size-full items-center gap-[4%] p-[5%]">
      <div className="flex min-w-0 flex-1 flex-col gap-[2cqh]">
        <Kicker>
          Post {Math.min(postIndex, posts.length - 1) + 1} of {posts.length}
        </Kicker>
        <p className="line-clamp-6 text-[2.6cqw] font-medium leading-[1.3] tracking-[-0.015em] text-balance">
          {post.copy.trim() || "No copy yet."}
        </p>
        <ScanToJoin campaign={campaign} />
      </div>

      <div className="flex aspect-[4/5] h-full max-h-full shrink-0 items-center justify-center overflow-hidden rounded-[1.4cqw] bg-(--screen-panel) text-(--screen-muted) ring-1 ring-(--screen-line)">
        {image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-[4cqw]" />
        )}
      </div>
    </div>
  );
}

export function BladeFeatured({ campaign }: ScreenViewProps) {
  const { featuredVideoUrl, featuredSound, moments } = campaign.theme;
  const url = featuredVideoUrl.trim();
  const embed = embedUrl(url, { muted: !featuredSound });

  if (!url) {
    return (
      <Stage image={moments.featured.imageUrl}>
        <Kicker>Featured</Kicker>
        <h2 className="text-[3.4cqw] font-semibold tracking-[-0.02em]">No video added yet</h2>
        <p className="max-w-[46ch] text-[1.7cqw] leading-snug text-(--screen-muted) text-pretty">
          Paste a video link in Screen Setup and it plays here.
        </p>
      </Stage>
    );
  }

  return (
    <div className="relative size-full">
      {isDirectVideo(url) ? (
        <video
          src={url}
          autoPlay
          loop
          muted={!featuredSound}
          playsInline
          poster={moments.featured.imageUrl || undefined}
          className="size-full object-cover"
        />
      ) : embed ? (
        <iframe
          src={embed}
          title="Featured video"
          allow="autoplay; fullscreen"
          className="size-full border-0"
        />
      ) : (
        <Stage image={moments.featured.imageUrl}>
          <Kicker>Featured</Kicker>
          <h2 className="text-[2.6cqw] font-semibold tracking-[-0.02em]">
            This link can&rsquo;t be played here
          </h2>
          <p className="max-w-[46ch] text-[1.7cqw] leading-snug text-(--screen-muted) text-pretty">
            Vimeo, YouTube and direct .mp4 links work.
          </p>
        </Stage>
      )}
    </div>
  );
}

export function BladePrize({ campaign }: ScreenViewProps) {
  return (
    <Stage image={campaign.theme.moments.prize.imageUrl}>
      <Kicker>Prize</Kicker>
      <h2 className="text-[5cqw] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
        There&rsquo;s something in it for you
      </h2>
      <p className="max-w-[42ch] text-[1.9cqw] leading-snug text-(--screen-muted) text-pretty">
        Share a post from {campaign.name || "this campaign"} to enter.
      </p>
      <ScanToJoin campaign={campaign} />
    </Stage>
  );
}

export function BladeThanks({ campaign }: ScreenViewProps) {
  const over = hasEnded(campaign);
  const contest = campaign.contest;

  return (
    <Stage image={campaign.theme.moments.thanks.imageUrl}>
      <Kicker>{over ? "Contest closed" : "Thank you"}</Kicker>
      <h2 className="text-[5cqw] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
        {over
          ? contest.endHeading.trim() || "This contest has ended."
          : campaign.thankYou.trim() || "Thanks for taking part"}
      </h2>
      {over && (
        <p className="max-w-[42ch] text-[1.9cqw] leading-snug text-(--screen-muted) text-pretty">
          {contestEndMessage(contest)}
        </p>
      )}
    </Stage>
  );
}

export function BladeLeaderboard({ campaign, posts }: ScreenViewProps) {
  const contest = campaign.contest;
  const entries = leaderboardFor(campaign, posts);

  if (entries.length === 0) return <EmptyBoard campaign={campaign} />;

  const podium = contest.ranked ? entries.slice(0, 3) : [];
  const rest = contest.ranked ? entries.slice(3, 9) : entries.slice(0, 9);

  return (
    <div className="relative flex size-full flex-col items-center justify-center gap-[3cqh] p-[4%]">
      <Kicker>{contest.leaderboardTitle.trim() || "Leaderboard"}</Kicker>

      {contest.ranked && (
        <div className="flex w-full items-end justify-center gap-[2cqw]">
          {[podium[1], podium[0], podium[2]].filter(Boolean).map((entry) => (
            <PodiumSlot key={entry.id} entry={entry} locale={contest.locale} />
          ))}
        </div>
      )}

      <div className="flex w-full max-w-[70%] flex-col gap-[0.8cqh]">
        {rest.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-[1.2cqw] rounded-[0.9cqw] bg-(--screen-panel) px-[1.2cqw] py-[0.8cqh] ring-1 ring-(--screen-line)"
          >
            <span className="flex size-[2.4cqw] shrink-0 items-center justify-center rounded-full bg-(--screen-panel-strong) text-[1.1cqw] font-semibold tabular-nums">
              {contest.ranked ? entry.rank : "★"}
            </span>
            <Puck entry={entry} className="size-[2.4cqw] text-[1cqw]" />
            <span className="min-w-0 flex-1 truncate text-[1.5cqw] font-medium">
              {entry.name}
            </span>
            {contest.ranked && (
              <span className="shrink-0 text-[1.4cqw] font-semibold tabular-nums text-(--screen-accent)">
                {formatScore(entry.score, contest.locale)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PodiumSlot({ entry, locale }: { entry: LeaderboardEntry; locale: string }) {
  const top = entry.rank === 1;
  return (
    <div className="flex flex-col items-center gap-[0.6cqh]">
      <Puck
        entry={entry}
        className={cn(top ? "size-[9cqw] text-[2.8cqw]" : "size-[6.6cqw] text-[2cqw]")}
      />
      <span className="text-[1.7cqw] font-semibold">{entry.name}</span>
      <span className="rounded-full bg-(--screen-panel) px-[1cqw] py-[0.3cqh] text-[1.4cqw] font-semibold tabular-nums ring-1 ring-(--screen-line)">
        {formatScore(entry.score, locale)}
      </span>
    </div>
  );
}

export const BLADE_MOMENTS = {
  welcome: BladeWelcome,
  posts: BladePosts,
  leaderboard: BladeLeaderboard,
  featured: BladeFeatured,
  prize: BladePrize,
  thanks: BladeThanks,
} as const;
