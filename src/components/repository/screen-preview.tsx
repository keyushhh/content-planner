"use client";

import { useEffect, useRef, useState } from "react";
import { Pause } from "lucide-react";
import { CampaignScreen } from "@/components/public/campaign-screen";
import { LiveScreen } from "@/components/public/live-screen";
import { screenThemeVars, type MomentId } from "@/lib/screen-theme";
import { cn } from "@/lib/utils";
import type { Campaign, CampaignState, MediaAsset, Session } from "@/lib/types";

const DESIGN_WIDTH = 1280;

export type PreviewSurface = "page" | "screen";

export function ScreenPreview({
  campaign,
  posts,
  mediaAssets,
  state,
  surface,
  momentId,
  className,
}: {
  campaign: Campaign;
  posts: Session[];
  mediaAssets: MediaAsset[];
  state: CampaignState;
  surface: PreviewSurface;
  momentId?: MomentId;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / DESIGN_WIDTH);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const aspect = surface === "screen" ? 16 / 9 : 16 / 10;
  const innerHeight = DESIGN_WIDTH / aspect;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-(--r-surface) bg-(--surface-raised) shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.08]",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-(--ink)/[0.06] bg-(--surface-panel) px-3 py-2">
        <span aria-hidden className="flex items-center gap-1">
          <span className="size-2 rounded-(--r-round) bg-(--ink)/[0.14]" />
          <span className="size-2 rounded-(--r-round) bg-(--ink)/[0.14]" />
          <span className="size-2 rounded-(--r-round) bg-(--ink)/[0.14]" />
        </span>
        <span className="ml-1.5 min-w-0 flex-1 truncate rounded-(--r-pill) bg-(--ink)/[0.05] px-2.5 py-0.5 text-[10.5px] text-muted-foreground/70">
          {origin.replace(/^https?:\/\//, "")}/c/
          <span className="text-muted-foreground/45">{campaign.id}</span>
          {surface === "screen" && <span className="text-muted-foreground/45">/screen</span>}
        </span>
      </div>

      {state === "paused" ? (
        <div
          style={screenThemeVars(campaign.theme)}
          className="flex flex-col items-center justify-center gap-1.5 bg-(--screen-bg) px-6 py-16 text-center text-(--screen-ink)"
        >
          <span className="mb-1 flex size-10 items-center justify-center rounded-(--r-round) bg-sky-500/[0.10] text-sky-300 inset-ring-1 inset-ring-sky-400/25">
            <Pause className="size-4" />
          </span>
          <span className="text-[13px] font-semibold">This campaign is paused</span>
          <span className="max-w-[34ch] text-[11.5px] leading-snug text-(--screen-muted) text-pretty">
            Visitors see this instead of the screen until you resume it.
          </span>
        </div>
      ) : (
        <div ref={frame} className="relative w-full overflow-hidden" style={{ aspectRatio: aspect }}>
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              width: DESIGN_WIDTH,
              height: innerHeight,
              transform: `scale(${scale})`,
            }}
          >
            {surface === "screen" ? (
              <LiveScreen
                campaign={campaign}
                posts={posts}
                mediaAssets={mediaAssets}
                momentId={momentId}
                running={false}
              />
            ) : (
              <CampaignScreen
                campaign={campaign}
                posts={posts}
                mediaAssets={mediaAssets}
                interactive={false}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
