import type { CSSProperties } from "react";

export type ScreenMode = "dark" | "light";
export type ScreenFontId = "sans" | "display" | "mono";
export type BackdropKind = "none" | "image" | "video";

export type MomentId =
  | "welcome"
  | "posts"
  | "leaderboard"
  | "featured"
  | "prize"
  | "thanks";

export interface ScreenMoment {
  enabled: boolean;
  imageUrl: string;
  seconds: number;
}

export interface ScreenTheme {
  mode: ScreenMode;
  accent: string;
  font: ScreenFontId;
  backdrop: { kind: BackdropKind; imageUrl: string; videoUrl: string };
  moments: Record<MomentId, ScreenMoment>;
  featuredVideoUrl: string;
  featuredSound: boolean;
}

export const ACCENTS: {
  id: string;
  label: string;
  hex: string;
  on: string;
}[] = [
  { id: "violet", label: "Violet", hex: "#8b5cf6", on: "#ffffff" },
  { id: "emerald", label: "Emerald", hex: "#10b981", on: "#04231a" },
  { id: "sky", label: "Sky", hex: "#0ea5e9", on: "#ffffff" },
  { id: "amber", label: "Amber", hex: "#f59e0b", on: "#291a02" },
  { id: "rose", label: "Rose", hex: "#f43f5e", on: "#ffffff" },
  { id: "slate", label: "Slate", hex: "#64748b", on: "#ffffff" },
];

export const SCREEN_FONTS: { id: ScreenFontId; label: string; hint: string; stack: string }[] = [
  {
    id: "sans",
    label: "Neutral sans",
    hint: "Clean and unobtrusive. Reads well at any size.",
    stack: "var(--font-geist-sans), system-ui, sans-serif",
  },
  {
    id: "display",
    label: "Display",
    hint: "Wider letterforms with more presence on a big screen.",
    stack: "var(--font-space-grotesk), system-ui, sans-serif",
  },
  {
    id: "mono",
    label: "Monospace",
    hint: "Technical and even-width. Good for countdowns and scores.",
    stack: "var(--font-jetbrains-mono), ui-monospace, monospace",
  },
];

export const MOMENTS: {
  id: MomentId;
  label: string;
  description: string;
  fixed?: boolean;
  imageHint?: string;
  imageSize?: string;
}[] = [
  {
    id: "welcome",
    label: "Welcome",
    description: "The opening card, shown while people are still arriving.",
    imageHint: "Fills the screen behind the campaign name.",
    imageSize: "1920×1080",
  },
  {
    id: "posts",
    label: "Posts",
    description: "Every post you turned on, one after another. The main event.",
    fixed: true,
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    description: "Who is winning. Ranks, scores and a podium for the top three.",
    imageHint: "Optional art behind the board.",
    imageSize: "1920×1080",
  },
  {
    id: "featured",
    label: "Featured video",
    description: "A video that plays between rounds of posts.",
    imageHint: "Shown while the video loads.",
    imageSize: "1920×1080",
  },
  {
    id: "prize",
    label: "Prize",
    description: "What people are playing for.",
    imageHint: "The prize itself; a product shot works well.",
    imageSize: "1920×1080",
  },
  {
    id: "thanks",
    label: "Thank you",
    description: "The closing card before the screen loops back to the start.",
    imageHint: "Fills the screen behind your thank-you message.",
    imageSize: "1920×1080",
  },
];

function blankMoment(enabled: boolean, seconds: number): ScreenMoment {
  return { enabled, imageUrl: "", seconds };
}

export function blankScreenTheme(): ScreenTheme {
  return {
    mode: "dark",
    accent: "violet",
    font: "sans",
    backdrop: { kind: "none", imageUrl: "", videoUrl: "" },
    moments: {
      welcome: blankMoment(false, 8),
      posts: blankMoment(true, 10),
      leaderboard: blankMoment(false, 12),
      featured: blankMoment(false, 20),
      prize: blankMoment(false, 8),
      thanks: blankMoment(false, 6),
    },
    featuredVideoUrl: "",
    featuredSound: false,
  };
}

export function migrateScreenTheme(theme: Partial<ScreenTheme> | undefined): ScreenTheme {
  const blank = blankScreenTheme();
  if (!theme) return blank;
  const moments = { ...blank.moments };
  for (const { id } of MOMENTS) {
    const stored = theme.moments?.[id];
    if (stored) moments[id] = { ...moments[id], ...stored };
  }
  moments.posts.enabled = true;
  return {
    ...blank,
    ...theme,
    backdrop: { ...blank.backdrop, ...(theme.backdrop ?? {}) },
    moments,
  };
}

export function accentOf(theme: ScreenTheme) {
  return ACCENTS.find((a) => a.id === theme.accent) ?? ACCENTS[0];
}

export function fontOf(theme: ScreenTheme) {
  return SCREEN_FONTS.find((f) => f.id === theme.font) ?? SCREEN_FONTS[0];
}

const SURFACES: Record<ScreenMode, Record<string, string>> = {
  dark: {
    "--screen-bg": "#0b0b0e",
    "--screen-panel": "rgba(255,255,255,0.045)",
    "--screen-panel-strong": "rgba(255,255,255,0.075)",
    "--screen-ink": "#f4f4f6",
    "--screen-muted": "rgba(244,244,246,0.62)",
    "--screen-line": "rgba(255,255,255,0.10)",
  },
  light: {
    "--screen-bg": "#ffffff",
    "--screen-panel": "rgba(0,0,0,0.035)",
    "--screen-panel-strong": "rgba(0,0,0,0.06)",
    "--screen-ink": "#16161a",
    "--screen-muted": "rgba(22,22,26,0.60)",
    "--screen-line": "rgba(0,0,0,0.10)",
  },
};

export function screenThemeVars(theme: ScreenTheme): CSSProperties {
  const accent = accentOf(theme);
  return {
    ...SURFACES[theme.mode],
    "--screen-accent": accent.hex,
    "--screen-accent-ink": accent.on,
    "--screen-font": fontOf(theme).stack,
    colorScheme: theme.mode,
  } as CSSProperties;
}

export function activeMoments(theme: ScreenTheme) {
  return MOMENTS.filter((m) => m.fixed || theme.moments[m.id].enabled);
}

export function embedUrl(url: string, { muted }: { muted: boolean }) {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const vimeo = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&loop=1&background=${
      muted ? 1 : 0
    }&muted=${muted ? 1 : 0}`;
  }
  const youtube = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (youtube) {
    return `https://www.youtube.com/embed/${youtube[1]}?autoplay=1&loop=1&playlist=${
      youtube[1]
    }&mute=${muted ? 1 : 0}&controls=0`;
  }
  return null;
}

export function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogv)(\?|$)/i.test(url.trim());
}
