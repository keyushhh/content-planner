"use client";

import { QrGlyph } from "@/components/public/qr-glyph";
import { initials } from "@/lib/leaderboard";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/leaderboard";
import type { Campaign, MediaAsset, Session } from "@/lib/types";

export interface ScreenViewProps {
  campaign: Campaign;
  posts: Session[];
  mediaAssets: MediaAsset[];
  postIndex: number;
}

export function Stage({ image, children }: { image?: string; children: React.ReactNode }) {
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

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[1.6cqw] font-semibold uppercase tracking-[0.18em] text-(--screen-accent)">
      {children}
    </span>
  );
}

export function ScanToJoin({ campaign }: { campaign: Campaign }) {
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

/* Stands in for a profile photo. Deterministic hue per person, initials on top. */
export function Puck({
  entry,
  className,
  style,
}: {
  entry: LeaderboardEntry;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        className,
      )}
      style={{
        background: `linear-gradient(150deg, hsl(${entry.hue} 72% 58%), hsl(${
          (entry.hue + 40) % 360
        } 66% 42%))`,
        ...style,
      }}
    >
      {initials(entry.name)}
    </span>
  );
}

export function EmptyBoard({ campaign }: { campaign: Campaign }) {
  return (
    <Stage image={campaign.theme.moments.leaderboard.imageUrl}>
      <Kicker>{campaign.contest.leaderboardTitle.trim() || "Leaderboard"}</Kicker>
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

export function postImage(post: Session | undefined, mediaAssets: MediaAsset[]) {
  if (!post) return undefined;
  return post.visualAssetIds
    .map((id) => mediaAssets.find((a) => a.id === id))
    .find((a): a is MediaAsset => Boolean(a) && a!.type === "image");
}
