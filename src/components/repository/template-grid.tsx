"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { LiveScreen } from "@/components/public/live-screen";
import { applyTemplate, type ScreenTheme } from "@/lib/screen-theme";
import { SCREEN_TEMPLATES, type ScreenTemplateId } from "@/lib/screen-templates";
import { cn } from "@/lib/utils";
import type { Campaign, MediaAsset, Session } from "@/lib/types";

const DESIGN_WIDTH = 1280;
const ASPECT = 16 / 9;

export function TemplateGrid({
  campaign,
  posts,
  mediaAssets,
  onChange,
}: {
  campaign: Campaign;
  posts: Session[];
  mediaAssets: MediaAsset[];
  onChange: (patch: Partial<ScreenTheme>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SCREEN_TEMPLATES.map((template) => {
        const selected = campaign.theme.template === template.id;
        return (
          <button
            key={template.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(applyTemplate(template.id))}
            className={cn(
              "flex flex-col gap-1.5 rounded-(--r-inner) p-1.5 text-left transition-[background-color,box-shadow,scale] duration-150 inset-ring-1 active:scale-(--press)",
              selected
                ? "bg-(--ink)/[0.06] inset-ring-violet-400/55"
                : "bg-(--ink)/[0.025] inset-ring-(--ink)/[0.05] hover:bg-(--ink)/[0.05]",
            )}
          >
            <Thumbnail
              id={template.id}
              campaign={campaign}
              posts={posts}
              mediaAssets={mediaAssets}
              selected={selected}
            />
            <span className="px-0.5 pb-0.5">
              <span className="block truncate text-[12px] font-medium">{template.label}</span>
              <span className="mt-0.5 block text-[10.5px] leading-snug text-muted-foreground text-pretty">
                {template.blurb}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* The thumbnail is the real live screen scaled down, so it cannot drift from the output. */
function Thumbnail({
  id,
  campaign,
  posts,
  mediaAssets,
  selected,
}: {
  id: ScreenTemplateId;
  campaign: Campaign;
  posts: Session[];
  mediaAssets: MediaAsset[];
  selected: boolean;
}) {
  const frame = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(0.12);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / DESIGN_WIDTH);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* Six autoplaying video embeds at thumbnail size is not worth the fidelity. */
  const backdrop =
    campaign.theme.backdrop.kind === "video"
      ? { ...campaign.theme.backdrop, kind: "none" as const }
      : campaign.theme.backdrop;

  const previewCampaign: Campaign = {
    ...campaign,
    theme: { ...campaign.theme, ...applyTemplate(id), backdrop },
  };

  return (
    <span
      ref={frame}
      className="relative block aspect-[16/9] w-full overflow-hidden rounded-(--r-inner) inset-ring-1 inset-ring-(--ink)/[0.08]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 block origin-top-left"
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_WIDTH / ASPECT,
          transform: `scale(${scale})`,
        }}
      >
        <LiveScreen
          campaign={previewCampaign}
          posts={posts}
          mediaAssets={mediaAssets}
          running={false}
        />
      </span>

      {selected && (
        <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-(--r-round) bg-violet-500">
          <Check className="size-2.5 text-white" />
        </span>
      )}
    </span>
  );
}
