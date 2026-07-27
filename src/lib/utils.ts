import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Session } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// A session is "locked" (read-only, live on the campaign) only while it's
// still approved and hasn't been edited since the last successful send.
// Any edit after sending bumps updatedAt past sentAt, which unlocks it again
// and flips the table's action to "Update" instead of silently re-locking.
export function isSessionLocked(session: Session) {
  return (
    isSessionSent(session) &&
    session.sentAt !== null &&
    session.status === "approved" &&
    new Date(session.updatedAt).getTime() <= new Date(session.sentAt).getTime()
  )
}

/** Sent to at least one campaign. */
export function isSessionSent(session: Session) {
  return session.sentToCampaignIds.length > 0
}

export function sessionNeedsResend(session: Session) {
  return isSessionSent(session) && !isSessionLocked(session)
}

/**
 * Stable per-person avatar tint. Every avatar rendering in the same grey is the
 * difference between scanning 450 rows and reading them: colour is the fastest
 * "same person / different person" signal there is, and it costs no space.
 *
 * Hues are hand-picked rather than generated so no two neighbours in the list
 * can land on near-identical colours, and all sit at the same lightness so none
 * shouts louder than the rest.
 */
const AVATAR_TINTS = [
  "bg-violet-500/[0.18] text-violet-200",
  "bg-sky-500/[0.18] text-sky-200",
  "bg-emerald-500/[0.18] text-emerald-200",
  "bg-amber-500/[0.18] text-amber-200",
  "bg-rose-500/[0.18] text-rose-200",
  "bg-teal-500/[0.18] text-teal-200",
  "bg-fuchsia-500/[0.18] text-fuchsia-200",
  "bg-indigo-500/[0.18] text-indigo-200",
] as const;

export function avatarTint(name: string | undefined | null): string {
  if (!name) return "bg-white/[0.07] text-muted-foreground";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_TINTS[Math.abs(hash) % AVATAR_TINTS.length];
}

/** Compact relative time: "just now", "2h ago", "3d ago", then a date. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  if (day < 30) return `${Math.round(day / 7)}w ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Coarse time bucket used for the table's group separators — temporal
 * orientation across a long list without decorating every row.
 */
export function timeBucket(iso: string, now: number = Date.now()): string {
  const then = new Date(iso);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const dayDiff = Math.floor((startOfToday.getTime() - then.getTime()) / 86400000);
  if (dayDiff < 0) return "Today";
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return "This week";
  if (dayDiff < 30) return "This month";
  return "Earlier";
}
