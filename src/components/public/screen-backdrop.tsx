"use client";

import { embedUrl, isDirectVideo, type ScreenTheme } from "@/lib/screen-theme";

export function ScreenBackdrop({ theme }: { theme: ScreenTheme }) {
  const { kind, imageUrl, videoUrl } = theme.backdrop;
  if (kind === "none") return null;
  if (kind === "image" && !imageUrl.trim()) return null;
  if (kind === "video" && !videoUrl.trim()) return null;

  const embed = kind === "video" ? embedUrl(videoUrl, { muted: true }) : null;
  const scrim =
    theme.mode === "dark"
      ? "linear-gradient(to bottom, rgba(11,11,14,0.78), rgba(11,11,14,0.94))"
      : "linear-gradient(to bottom, rgba(255,255,255,0.80), rgba(255,255,255,0.94))";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="size-full object-cover" />
      ) : isDirectVideo(videoUrl) ? (
        <video
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="size-full object-cover"
        />
      ) : embed ? (
        <iframe
          src={embed}
          title=""
          allow="autoplay"
          className="absolute left-1/2 top-1/2 aspect-video h-auto w-[178vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
        />
      ) : null}
      <div className="absolute inset-0" style={{ background: scrim }} />
    </div>
  );
}
