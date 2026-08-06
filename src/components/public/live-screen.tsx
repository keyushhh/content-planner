"use client";

import { createElement, useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import { ScreenBackdrop } from "@/components/public/screen-backdrop";
import { liveTemplate, momentRenderer } from "@/components/public/templates";
import {
  MOMENTS,
  activeMoments,
  screenThemeVars,
  templateOf,
  usesBackdrop,
  type MomentId,
} from "@/lib/screen-theme";
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
  const template = templateOf(theme);
  const single = template.kind === "single";

  const moments = useMemo(() => activeMoments(theme), [theme]);
  const [index, setIndex] = useState(0);
  const [postIndex, setPostIndex] = useState(0);

  const pinned = momentId ? moments.findIndex((m) => m.id === momentId) : -1;
  const safeIndex = pinned !== -1 ? pinned : Math.min(index, moments.length - 1);
  const current = momentId
    ? (MOMENTS.find((m) => m.id === momentId) ?? moments[0])
    : (moments[safeIndex] ?? moments[0]);

  useEffect(() => {
    if (single || !running || pinned !== -1 || moments.length === 0) return;
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
  }, [single, running, pinned, current, postIndex, posts.length, moments, theme, onMomentChange]);

  /* A single-view template still cycles its post spot, it just never changes layout. */
  useEffect(() => {
    if (!single || !running || posts.length < 2) return;
    const timer = setInterval(
      () => setPostIndex((p) => (p + 1) % posts.length),
      theme.moments.posts.seconds * 1000,
    );
    return () => clearInterval(timer);
  }, [single, running, posts.length, theme.moments.posts.seconds]);

  const { view, chrome } = liveTemplate(theme.template);
  const props = { campaign, posts, mediaAssets, postIndex };

  const body = single
    ? view
      ? createElement(view, props)
      : null
    : current
      ? createElement(momentRenderer(theme.template, current.id), props)
      : null;

  return (
    <div
      style={{ ...screenThemeVars(theme), containerType: "size" }}
      className="relative isolate size-full overflow-hidden bg-(--screen-bg) font-(family-name:--screen-font) text-(--screen-ink)"
    >
      {usesBackdrop(theme) && <ScreenBackdrop theme={theme} />}

      {chrome ? createElement(chrome, props, body) : body}

      {!single && moments.length > 1 && !momentId && (
        <div className="absolute inset-x-0 bottom-[3%] z-30 flex items-center justify-center gap-1.5">
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
