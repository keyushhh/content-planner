import type { Feedback, FeedbackStatus } from "./types";

/**
 * The status vocabulary, in workflow order, defined once.
 *
 * Four states, not two: "Open → Done" cannot express the middle of the day,
 * where somebody has picked a note up and is rewriting the copy, nor the honest
 * answer that a request is not going to happen. Both of those otherwise get
 * expressed by marking something Done that isn't.
 *
 * Colour carries the meaning without a legend: amber needs you, violet is in
 * hand, emerald is finished, grey is closed unactioned. Only Open is loud —
 * three loud states would be no signal at all.
 */
export const FEEDBACK_STATUSES: {
  id: FeedbackStatus;
  label: string;
  /** Chip treatment. */
  chip: string;
  dot: string;
  /** Still asking for something. */
  active: boolean;
}[] = [
  {
    id: "open",
    label: "Open",
    chip: "bg-amber-500/[0.14] text-amber-200 inset-ring-amber-400/35",
    dot: "bg-amber-400",
    active: true,
  },
  {
    id: "in_progress",
    label: "In progress",
    chip: "bg-violet-500/[0.14] text-violet-200 inset-ring-violet-400/35",
    dot: "bg-violet-400",
    active: true,
  },
  {
    id: "done",
    label: "Done",
    chip: "bg-emerald-500/[0.12] text-emerald-200 inset-ring-emerald-400/30",
    dot: "bg-emerald-400",
    active: false,
  },
  {
    id: "wont_do",
    label: "Won’t do",
    chip: "bg-white/[0.06] text-muted-foreground inset-ring-white/[0.10]",
    dot: "bg-muted-foreground/60",
    active: false,
  },
];

export function feedbackStatusMeta(status: FeedbackStatus) {
  return FEEDBACK_STATUSES.find((s) => s.id === status) ?? FEEDBACK_STATUSES[0];
}

/** Items still asking for something — the only count worth putting on a badge. */
export function openFeedback(items: Feedback[]): Feedback[] {
  return items.filter((f) => feedbackStatusMeta(f.status).active);
}

/**
 * Open first, then the closed ones, each group newest first. A resolved note
 * sorted in by date buries the one thing somebody still has to do.
 */
export function sortFeedback(items: Feedback[]): Feedback[] {
  return [...items].sort((a, b) => {
    const aActive = feedbackStatusMeta(a.status).active;
    const bActive = feedbackStatusMeta(b.status).active;
    if (aActive !== bActive) return aActive ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
