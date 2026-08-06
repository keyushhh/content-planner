"use client";

import { QrGlyph } from "@/components/public/qr-glyph";
import {
  Puck,
  postImage,
  type ScreenViewProps,
} from "@/components/public/templates/shared";
import { formatScore, leaderboardFor } from "@/lib/leaderboard";
import { cn } from "@/lib/utils";

export function BroadcastChrome({
  campaign,
  posts,
  children,
}: ScreenViewProps & { children?: React.ReactNode }) {
  const contest = campaign.contest;
  const entries = leaderboardFor(campaign, posts);

  return (
    <div className="flex size-full flex-col">
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-[2cqw] p-[2.2cqw]">
          <span className="flex items-center gap-[0.8cqw] rounded-[0.5cqw] bg-(--screen-accent) px-[1cqw] py-[0.5cqh]">
            <span
              aria-hidden
              className="size-[0.7cqw] rounded-full bg-(--screen-accent-ink)"
              style={{ animation: "copy-caret-blink 1.6s steps(1,end) infinite" }}
            />
            <span className="text-[1.2cqw] font-semibold uppercase tracking-[0.2em] text-(--screen-accent-ink)">
              Live
            </span>
          </span>

          <span className="flex items-center gap-[0.8cqw] rounded-[0.5cqw] bg-(--screen-panel) p-[0.6cqw] ring-1 ring-(--screen-line) backdrop-blur-sm">
            <span className="flex size-[4.4cqw] items-center justify-center rounded-[0.35cqw] bg-white p-[0.3cqw]">
              <QrGlyph seed={campaign.id} className="size-full text-neutral-900" />
            </span>
            <span className="max-w-[16cqw] text-[1.1cqw] font-semibold leading-tight">
              {contest.ctaText.trim() || "Scan to join in"}
            </span>
          </span>
        </div>

        <div className="relative min-h-0 flex-1">{children}</div>
      </div>

      <div className="relative z-20 flex h-[9cqh] shrink-0 items-center gap-[1.2cqw] overflow-hidden border-t border-(--screen-line) bg-(--screen-panel) px-[1.4cqw] backdrop-blur-sm">
        <span className="z-10 shrink-0 bg-(--screen-accent) px-[0.9cqw] py-[0.4cqh] text-[1.1cqw] font-semibold uppercase tracking-[0.16em] text-(--screen-accent-ink)">
          {contest.leaderboardTitle.trim() || "Standings"}
        </span>

        {entries.length === 0 ? (
          <span className="text-[1.3cqw] text-(--screen-muted)">
            Nobody is on the board yet. The first share takes the top spot.
          </span>
        ) : (
          <div className="min-w-0 flex-1 overflow-hidden">
            <div
              className="flex w-max items-center gap-[2cqw]"
              style={{ animation: "screen-ticker 32s linear infinite" }}
            >
              {[...entries, ...entries].map((entry, i) => (
                <span key={`${entry.id}-${i}`} className="flex items-center gap-[0.6cqw]">
                  <span
                    className={cn(
                      "text-[1.2cqw] font-semibold tabular-nums",
                      entry.rank === 1 ? "text-(--screen-accent)" : "text-(--screen-muted)",
                    )}
                  >
                    {contest.ranked ? String(entry.rank).padStart(2, "0") : "★"}
                  </span>
                  <Puck entry={entry} className="size-[2.4cqw] text-[1cqw]" />
                  <span className="whitespace-nowrap text-[1.4cqw] font-medium">
                    {entry.name}
                  </span>
                  {contest.ranked && (
                    <span className="text-[1.3cqw] font-semibold tabular-nums text-(--screen-accent)">
                      {formatScore(entry.score, contest.locale)}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* A lower third over the post image, the way a broadcast would caption it. */
export function BroadcastPosts({ campaign, posts, mediaAssets, postIndex }: ScreenViewProps) {
  const post = posts[Math.min(postIndex, Math.max(0, posts.length - 1))];

  if (!post) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-[1cqh]">
        <span className="text-[3cqw] font-semibold tracking-[-0.02em]">
          No posts on the screen yet
        </span>
        <span className="text-[1.6cqw] text-(--screen-muted)">
          Turn a post on in Screen Setup and it appears here.
        </span>
      </div>
    );
  }

  const image = postImage(post, mediaAssets);

  return (
    <div className="relative size-full overflow-hidden">
      {image?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 0%, var(--screen-panel-strong), transparent 70%)",
          }}
        />
      )}

      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, color-mix(in srgb, var(--screen-bg) 94%, transparent) 8%, transparent 62%)",
        }}
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-[0.8cqh] p-[3cqw]">
        <span className="w-fit bg-(--screen-accent) px-[0.9cqw] py-[0.35cqh] text-[1.2cqw] font-semibold uppercase tracking-[0.18em] text-(--screen-accent-ink)">
          Post {Math.min(postIndex, posts.length - 1) + 1} of {posts.length}
        </span>
        <p className="line-clamp-3 max-w-[70%] text-[2.8cqw] font-semibold leading-[1.2] tracking-[-0.02em] text-balance">
          {post.copy.trim() || "No copy yet."}
        </p>
        <span className="text-[1.4cqw] text-(--screen-muted)">
          {campaign.name || "Untitled campaign"}
        </span>
      </div>
    </div>
  );
}

export function BroadcastWelcome({ campaign }: ScreenViewProps) {
  return (
    <div className="relative flex size-full flex-col justify-end p-[3cqw]">
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 70% at 15% 100%, var(--screen-panel-strong), transparent 70%)",
        }}
      />
      <div className="relative flex flex-col gap-[1cqh]">
        {campaign.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={campaign.logoUrl} alt="" className="h-[7cqh] w-auto object-contain" />
        )}
        <span className="w-fit bg-(--screen-accent) px-[0.9cqw] py-[0.35cqh] text-[1.2cqw] font-semibold uppercase tracking-[0.18em] text-(--screen-accent-ink)">
          Now on air
        </span>
        <h1 className="max-w-[80%] text-[6cqw] font-semibold leading-[1.02] tracking-[-0.035em] text-balance">
          {campaign.name || "Untitled campaign"}
        </h1>
      </div>
    </div>
  );
}

export const BROADCAST_MOMENTS = {
  welcome: BroadcastWelcome,
  posts: BroadcastPosts,
} as const;
