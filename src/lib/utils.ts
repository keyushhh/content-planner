import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Comment, Session } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// A session is "locked" (read-only, live on the campaign) only while it's
// still approved and hasn't been edited since the last successful send.
// Any edit after sending bumps updatedAt past sentAt, which unlocks it again
// and flips the table's action to "Update" instead of silently re-locking.
export function isSessionLocked(session: Session) {
  return (
    session.sentToCampaignId !== null &&
    session.sentAt !== null &&
    session.status === "approved" &&
    new Date(session.updatedAt).getTime() <= new Date(session.sentAt).getTime()
  )
}

export function sessionNeedsResend(session: Session) {
  return session.sentToCampaignId !== null && !isSessionLocked(session)
}

/**
 * Total comments in a thread list, replies included. The raw `comments.length`
 * only counts roots, so a thread with five replies would read as "1".
 */
export function countComments(comments: Comment[]): number {
  return comments.reduce(
    (total, c) => total + 1 + (c.replies ? countComments(c.replies) : 0),
    0,
  );
}
