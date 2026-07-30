import type { Feedback, FeedbackStatus } from "./types";

export const FEEDBACK_STATUSES: {
  id: FeedbackStatus;
  label: string;
  chip: string;
  dot: string;
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
    id: "discarded",
    label: "Discard",
    chip: "bg-(--ink)/[0.06] text-muted-foreground inset-ring-(--ink)/[0.10]",
    dot: "bg-muted-foreground/60",
    active: false,
  },
];

export function feedbackStatusMeta(status: FeedbackStatus) {
  return FEEDBACK_STATUSES.find((s) => s.id === status) ?? FEEDBACK_STATUSES[0];
}

export function openFeedback(items: Feedback[]): Feedback[] {
  return items.filter((f) => feedbackStatusMeta(f.status).active);
}

export function sortFeedback(items: Feedback[]): Feedback[] {
  return [...items].sort((a, b) => {
    const aActive = feedbackStatusMeta(a.status).active;
    const bActive = feedbackStatusMeta(b.status).active;
    if (aActive !== bActive) return aActive ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
