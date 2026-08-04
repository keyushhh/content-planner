export type QrTarget = "share" | "quiz" | "form";

export interface ContestSettings {
  leaderboardTitle: string;
  ranked: boolean;
  ctaText: string;
  locale: string;
  qrTarget: QrTarget;
  qrUrl: string;
  endHeading: string;
  endMessageAnnounced: string;
  endMessagePending: string;
  winnersAnnounced: boolean;
  leaderboardCleared: boolean;
}

export const QR_TARGETS: { id: QrTarget; label: string; hint: string }[] = [
  { id: "share", label: "Share link", hint: "Opens the post so people can share it." },
  { id: "quiz", label: "Quiz", hint: "Opens a quiz you host." },
  { id: "form", label: "Form", hint: "Opens a signup or entry form you host." },
];

export const SCREEN_LOCALES: { id: string; label: string }[] = [
  { id: "en-GB", label: "English" },
  { id: "de-DE", label: "German" },
  { id: "fr-FR", label: "French" },
  { id: "es-ES", label: "Spanish" },
  { id: "hi-IN", label: "Hindi" },
  { id: "ja-JP", label: "Japanese" },
  { id: "zh-CN", label: "Chinese" },
];

export function blankContest(): ContestSettings {
  return {
    leaderboardTitle: "Leaderboard",
    ranked: true,
    ctaText: "Scan. Share. Win.",
    locale: "en-GB",
    qrTarget: "share",
    qrUrl: "",
    endHeading: "This contest has ended.",
    endMessageAnnounced: "Thank you for your interest and participation!",
    endMessagePending: "The winners will be announced soon.",
    winnersAnnounced: false,
    leaderboardCleared: false,
  };
}

export function migrateContest(
  contest: Partial<ContestSettings> | undefined,
): ContestSettings {
  return { ...blankContest(), ...(contest ?? {}) };
}

export function contestEndMessage(contest: ContestSettings) {
  return contest.winnersAnnounced
    ? contest.endMessageAnnounced
    : contest.endMessagePending;
}
