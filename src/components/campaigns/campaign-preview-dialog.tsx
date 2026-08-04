"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CampaignLandingPreview } from "./campaign-landing-preview";
import { cn } from "@/lib/utils";
import type { NewCampaign } from "@/lib/types";

const MOCKUP = {
  src: "/mockups/laptop.webp",
  width: 2400,
  height: 1450,
  screen: { left: 10.25, top: 2.483, width: 79.458, height: 85.31 },
};

const MOCKUP_RATIO = MOCKUP.width / MOCKUP.height;

const DESIGN_WIDTH = 700;

export function ExpandPreviewButton({
  draft,
  className,
}: {
  draft: NewCampaign;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-(--r-pill) bg-(--ink)/[0.05] px-2.5 text-[11.5px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.09] hover:text-foreground active:scale-(--press)",
          className,
        )}
      >
        <Maximize2 className="size-3.5" />
        Expand
      </button>

      <CampaignPreviewDialog draft={draft} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function CampaignPreviewDialog({
  draft,
  open,
  onOpenChange,
}: {
  draft: NewCampaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(1320px,calc(100vw-2.5rem))] gap-0 overflow-hidden bg-(--surface-canvas) p-0 sm:max-w-[min(1320px,calc(100vw-2.5rem))]">
        <div className="flex items-center justify-between gap-4 border-b border-(--ink)/[0.06] px-5 py-3.5">
          <span className="min-w-0 pr-9">
            <span className="block truncate text-[14px] font-semibold">
              {draft.name.trim() || "Untitled campaign"}
            </span>
            <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
              How the public page looks to someone opening your link.
            </span>
          </span>
        </div>

        <div className="flex items-center justify-center overflow-hidden px-6 py-6 [background-image:var(--wash-page)]">
          <LaptopFrame draft={draft} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LaptopFrame({ draft }: { draft: NewCampaign }) {
  const { screen } = MOCKUP;
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const boxEl = box.current;
    if (!boxEl) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(boxEl);
    return () => observer.disconnect();
  }, []);

  const scale = size.width ? size.width / DESIGN_WIDTH : 0;

  return (
    <div
      className="relative"
      style={{
        width: `min(1180px, 100%, calc((82vh - 130px) * ${MOCKUP_RATIO}))`,
        aspectRatio: `${MOCKUP.width} / ${MOCKUP.height}`,
      }}
    >
      <div
        ref={box}
        className="absolute overflow-hidden bg-(--surface-raised)"
        style={{
          left: `${screen.left}%`,
          top: `${screen.top}%`,
          width: `${screen.width}%`,
          height: `${screen.height}%`,
        }}
      >
        <div
          className="shrink-0"
          style={{
            width: DESIGN_WIDTH,
            height: scale ? size.height / scale : 0,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <CampaignLandingPreview
            draft={draft}
            chrome={false}
            fill
            className="rounded-none shadow-none inset-ring-0"
          />
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MOCKUP.src}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 size-full select-none"
      />
    </div>
  );
}
