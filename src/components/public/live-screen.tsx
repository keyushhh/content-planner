"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageIcon, Pause, Play } from "lucide-react";
import { QrGlyph } from "@/components/public/qr-glyph";
import { ScreenBackdrop } from "@/components/public/screen-backdrop";
import {
  MOMENTS,
  activeMoments,
  embedUrl,
  isDirectVideo,
  screenThemeVars,
  type MomentId,
} from "@/lib/screen-theme";
import { contestEndMessage } from "@/lib/contest";
import { formatScore, initials, leaderboardFor } from "@/lib/leaderboard";
import { hasEnded } from "@/lib/campaigns";
import { cn } from "@/lib/utils";
import type { Campaign, MediaAsset, Session } from "@/lib/types";

export function LiveScreen({
  campaign,
  posts,
  mediaAssets,
  momentId,
  running = true,
  onMomentChange,
}: {
  campaign: Campaign;
  posts: Session[];
  mediaAssets: MediaAsset[];
  momentId?: MomentId;
  running?: boolean;
  onMomentChange?: (id: MomentId) => void;
}) {
  const theme = campaign.theme;
  const moments = useMemo(() => activeMoments(theme), [theme]);
  const [index, setIndex] = useState(0);
  const [postIndex, setPostIndex] = useState(0);

  const pinned = momentId ? moments.findIndex((m) => m.id === momentId) : -1;
  const safeIndex = pinned !== -1 ? pinned : Math.min(index, moments.length - 1);
  const current = momentId
    ? (MOMENTS.find((m) => m.id === momentId) ?? moments[0])
    : (moments[safeIndex] ?? moments[0]);

  useEffect(() => {
    if (!running || pinned !== -1 || moments.length === 0) return;
    const hold = theme.moments[current.id].seconds * 1000;
    const timer = setTimeout(() => {
      if (current.id === "posts" && postIndex < posts.length - 1) {
        setPostIndex((p) => p + 1);
        return;
      }
      setPostIndex(0);
      setIndex((i) => {
        const next = (i + 1) % moments.length;
        onMomentChange?.(moments[next].id);
        return next;
      });
    }, hold);
    return () => clearTimeout(timer);
  }, [running, pinned, current, postIndex, posts.length, moments, theme, onMomentChange]);

  return (
    <div
      style={{ ...screenThemeVars(theme), containerType: "size" }}
      className="relative isolate size-full overflow-hidden bg-(--screen-bg) font-(family-name:--screen-font) text-(--screen-ink)"
    >
      <ScreenBackdrop theme={theme} />

      {current?.id === "welcome" && <WelcomeMoment campaign={campaign} />}
      {current?.id === "posts" && (
        <PostsMoment
          campaign={campaign}
          posts={posts}
          mediaAssets={mediaAssets}
          index={postIndex}
        />
      )}
      {current?.id === "leaderboard" && (
        <LeaderboardMoment campaign={campaign} posts={posts} />
      )}
      {current?.id === "featured" && <FeaturedMoment campaign={campaign} />}
      {current?.id === "prize" && <PrizeMoment campaign={campaign} />}
      {current?.id === "thanks" && <ThanksMoment campaign={campaign} />}

      {moments.length > 1 && !momentId && (
        <div className="absolute inset-x-0 bottom-[3%] flex items-center justify-center gap-1.5">
          {moments.map((m, i) => (
            <span
              key={m.id}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === safeIndex ? "w-7 bg-(--screen-accent)" : "w-1.5 bg-(--screen-line)",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Stage({
  image,
  children,
}: {
  image?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex size-full items-center justify-center p-[5%]">
      {image?.trim() && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: "color-mix(in srgb, var(--screen-bg) 72%, transparent)" }}
          />
        </>
      )}
      <div className="relative flex w-full max-w-[80%] flex-col items-center gap-[2.5%] text-center">
        {children}
      </div>
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[1.6cqw] font-semibold uppercase tracking-[0.18em] text-(--screen-accent)">
      {children}
    </span>
  );
}

function WelcomeMoment({ campaign }: { campaign: Campaign }) {
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

function ScanToJoin({ campaign }: { campaign: Campaign }) {
  return (
    <div className="mt-[1%] flex items-center gap-[2cqw] rounded-[1.4cqw] bg-(--screen-panel) p-[1.4cqw] ring-1 ring-(--screen-line)">
      <span className="flex size-[9cqw] items-center justify-center rounded-[0.8cqw] bg-white p-[0.6cqw]">
        <QrGlyph seed={campaign.id} className="size-full text-neutral-900" />
      </span>
      <span className="text-left">
        <span className="block text-[2cqw] font-semibold">
          {campaign.contest.ctaText.trim() || "Scan to join in"}
        </span>
        <span className="mt-[0.3cqw] block text-[1.4cqw] text-(--screen-muted)">
          Share a post, get on the board.
        </span>
      </span>
    </div>
  );
}

function PostsMoment({
  campaign,
  posts,
  mediaAssets,
  index,
}: {
  campaign: Campaign;
  posts: Session[];
  mediaAssets: MediaAsset[];
  index: number;
}) {
  const post = posts[Math.min(index, Math.max(0, posts.length - 1))];

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

  const image = post.visualAssetIds
    .map((id) => mediaAssets.find((a) => a.id === id))
    .find((a): a is MediaAsset => Boolean(a) && a!.type === "image");

  return (
    <div className="relative flex size-full items-center gap-[4%] p-[5%]">
      <div className="flex min-w-0 flex-1 flex-col gap-[2cqh]">
        <Kicker>
          Post {Math.min(index, posts.length - 1) + 1} of {posts.length}
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

function FeaturedMoment({ campaign }: { campaign: Campaign }) {
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

function PrizeMoment({ campaign }: { campaign: Campaign }) {
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

function ThanksMoment({ campaign }: { campaign: Campaign }) {
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

function LeaderboardMoment({
  campaign,
  posts,
}: {
  campaign: Campaign;
  posts: Session[];
}) {
  const contest = campaign.contest;
  const entries = leaderboardFor(campaign, posts);

  if (entries.length === 0) {
    return (
      <Stage image={campaign.theme.moments.leaderboard.imageUrl}>
        <Kicker>{contest.leaderboardTitle.trim() || "Leaderboard"}</Kicker>
        <h2 className="text-[4.4cqw] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
          Nobody is on the board yet
        </h2>
        <p className="max-w-[40ch] text-[1.9cqw] leading-snug text-(--screen-muted) text-pretty">
          The first person to share a post takes the top spot.
        </p>
        <ScanToJoin campaign={campaign} />
      </Stage>
    );
  }

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
              {contest.ranked ? entry.rank : "\u2605"}
            </span>
            <span className="flex size-[2.4cqw] shrink-0 items-center justify-center rounded-full bg-(--screen-accent) text-[1cqw] font-semibold text-(--screen-accent-ink)">
              {initials(entry.name)}
            </span>
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

function PodiumSlot({
  entry,
  locale,
}: {
  entry: import("@/lib/leaderboard").LeaderboardEntry;
  locale: string;
}) {
  const top = entry.rank === 1;
  return (
    <div className="flex flex-col items-center gap-[0.6cqh]">
      <span
        className={cn(
          "flex items-center justify-center rounded-full font-semibold text-(--screen-accent-ink)",
          top ? "size-[9cqw] text-[2.8cqw]" : "size-[6.6cqw] text-[2cqw]",
        )}
        style={{ backgroundColor: "var(--screen-accent)" }}
      >
        {initials(entry.name)}
      </span>
      <span className="text-[1.7cqw] font-semibold">{entry.name}</span>
      <span className="rounded-full bg-(--screen-panel) px-[1cqw] py-[0.3cqh] text-[1.4cqw] font-semibold tabular-nums ring-1 ring-(--screen-line)">
        {formatScore(entry.score, locale)}
      </span>
    </div>
  );
}

export function LiveScreenControls({
  running,
  onToggle,
  onPrev,
  onNext,
}: {
  running: boolean;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/60 p-1 text-white opacity-0 backdrop-blur transition-opacity duration-200 focus-within:opacity-100 hover:opacity-100">
      <button
        onClick={onPrev}
        className="flex h-8 items-center rounded-full px-3 text-[12px] font-medium hover:bg-white/15"
      >
        Back
      </button>
      <button
        onClick={onToggle}
        aria-label={running ? "Pause" : "Play"}
        className="flex size-8 items-center justify-center rounded-full hover:bg-white/15"
      >
        {running ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>
      <button
        onClick={onNext}
        className="flex h-8 items-center rounded-full px-3 text-[12px] font-medium hover:bg-white/15"
      >
        Next
      </button>
    </div>
  );
}
