import type { Platform } from "./types";

export interface PlatformMeta {
  id: Platform;
  label: string;
  limit: number;
  tint: string;
  dot: string;
}

export const PLATFORMS: PlatformMeta[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    limit: 3000,
    tint: "bg-sky-500/[0.14] text-sky-200 inset-ring-sky-400/30",
    dot: "bg-sky-400",
  },
  {
    id: "x",
    label: "X",
    limit: 280,
    tint: "bg-(--ink)/[0.09] text-foreground/85 inset-ring-(--ink)/20",
    dot: "bg-(--ink)/60",
  },
  {
    id: "slack",
    label: "Slack",
    limit: 4000,
    tint: "bg-fuchsia-500/[0.13] text-fuchsia-200 inset-ring-fuchsia-400/30",
    dot: "bg-fuchsia-400",
  },
  {
    id: "facebook",
    label: "Facebook",
    limit: 63206,
    tint: "bg-blue-500/[0.14] text-blue-200 inset-ring-blue-400/30",
    dot: "bg-blue-400",
  },
  {
    id: "instagram",
    label: "Instagram",
    limit: 2200,
    tint: "bg-rose-500/[0.13] text-rose-200 inset-ring-rose-400/30",
    dot: "bg-rose-400",
  },
];

export const GRANTED_PLATFORMS: Platform[] = ["linkedin"];

export function platformMeta(id: Platform) {
  return PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0];
}

export function isGranted(id: Platform) {
  return GRANTED_PLATFORMS.includes(id);
}

export function platformLabels(ids: Platform[]) {
  return ids.map((id) => platformMeta(id).label);
}
