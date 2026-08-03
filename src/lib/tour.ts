"use client";

import { useCallback, useSyncExternalStore } from "react";

export type TourSection = "repository" | "campaigns";

export interface TourContext {
  postTypeModalOpen: boolean;
  composerOpen: boolean;
  copyLength: number;
  assetCount: number;
  tagCount: number;
  approved: boolean;
}

export interface TourStep {
  id: string;
  /** The walkthrough navigates when this changes. */
  section: TourSection;
  anchor: string;
  title: string;
  body: string;
  placement?: "top" | "bottom";
  /** Skipped when the anchor isn't rendered — e.g. row steps on an empty table. */
  optional?: boolean;
  /** Advances on the user's action instead of Next; the cut-out is click-through. */
  done?: (ctx: TourContext) => boolean;
  rewindWhen?: (ctx: TourContext) => boolean;
  waitingFor?: string;
}

/* Repository steps first, so there's exactly one section transition. */
export const APP_TOUR: TourStep[] = [
  {
    id: "library",
    section: "repository",
    anchor: "repo-header",
    title: "Your content library",
    body: "Every post you create lives here. Posts move through four stages — Draft, WIP, Approved, then Live once a campaign publishes them.",
    placement: "bottom",
  },
  {
    id: "new-post",
    section: "repository",
    anchor: "repo-new-post",
    title: "Start creating",
    body: "Pick a type — image, frames, PDF or reshare — and the composer opens for you to write.",
    placement: "bottom",
  },
  {
    id: "status",
    section: "repository",
    anchor: "repo-status",
    title: "Track progress",
    body: "Status shows where a post is. Only Approved posts can be sent to a campaign — that's the gate.",
    placement: "bottom",
  },
  {
    id: "filters",
    section: "repository",
    anchor: "repo-filters",
    title: "Find anything fast",
    body: "Search by title or copy, filter by status or tags, and sort however you need.",
    placement: "bottom",
  },
  {
    id: "send",
    section: "repository",
    anchor: "repo-send",
    title: "Send to a campaign",
    body: "When a post is ready, send it to one or more campaigns. Tick several rows to send them together.",
    placement: "top",
    optional: true,
  },
  {
    id: "composer",
    section: "repository",
    anchor: "repo-row",
    title: "The composer",
    body: "Click any post to open it — write your copy, attach visuals, get feedback from your team, and approve it.",
    placement: "top",
    optional: true,
  },
  {
    id: "campaigns",
    section: "campaigns",
    anchor: "campaigns-grid",
    title: "Campaigns bring it together",
    body: "Campaigns group posts for publishing. Send posts to one, then take it live when everything's ready.",
    placement: "top",
  },
];

/* Copy lives in a local draft until blur/autosave, so read the field directly. */
function liveCopyLength() {
  if (typeof document === "undefined") return 0;
  const el = document.querySelector<HTMLTextAreaElement>("#canvas-copy");
  return (el?.value ?? "").trim().length;
}

/* Offered after APP_TOUR, never before. */
export const CREATE_POST_TUTORIAL: TourStep[] = [
  {
    id: "t-new",
    section: "repository",
    anchor: "repo-new-post",
    title: "Let\u2019s make one together",
    body: "Click New post. Nothing here is permanent \u2014 you choose at the end whether to keep it.",
    placement: "bottom",
    done: (c) => c.postTypeModalOpen || c.composerOpen,
    waitingFor: "Waiting for you to click New post",
  },
  {
    id: "t-type",
    section: "repository",
    anchor: "post-type-list",
    title: "Pick a format",
    body: "Image is one visual, Frames is several people swipe through, PDF reads as pages, and Reshare adds your take to someone else\u2019s post. Pick any \u2014 you can change it later.",
    placement: "bottom",
    done: (c) => c.composerOpen,
    rewindWhen: (c) => !c.postTypeModalOpen && !c.composerOpen,
    waitingFor: "Choose a format to carry on",
  },
  {
    id: "t-copy",
    section: "repository",
    anchor: "composer-copy",
    title: "Write the post",
    body: "This is the text that goes out. The counters underneath track each platform\u2019s limit as you type.",
    placement: "bottom",
    done: (c) => c.copyLength > 2 || liveCopyLength() > 2,
    waitingFor: "Type a few words to carry on",
  },
  {
    id: "t-assets",
    section: "repository",
    anchor: "composer-assets",
    title: "Add a visual",
    body: "Pick something from the media library, or upload. Reshare posts are the exception \u2014 they keep the original\u2019s media.",
    placement: "top",
    done: (c) => c.assetCount > 0,
    waitingFor: "Attach an asset to carry on",
  },
  {
    id: "t-tags",
    section: "repository",
    anchor: "composer-tags",
    title: "Tag it",
    body: "Tags are how you find this again once the repository fills up. Type one and press Enter.",
    placement: "top",
    done: (c) => c.tagCount > 0,
    waitingFor: "Add a tag to carry on",
  },
  {
    id: "t-status",
    section: "repository",
    anchor: "composer-status",
    title: "Approve it when it\u2019s ready",
    body: "Posts start as Draft. Move this to Approved and it becomes sendable \u2014 that\u2019s the gate before a campaign.",
    placement: "bottom",
  },
];

const SEEN_KEY = "cp_tour_seen";
const SEEN_EVENT = "cp:tour-seen";
const TUTORIAL_SEEN_KEY = "cp_tutorial_seen";

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

function subscribeSeen(onChange: () => void) {
  window.addEventListener(SEEN_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SEEN_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useTourSeen() {
  // `true` on the server so the nudge never flashes during hydration.
  const seen = useSyncExternalStore(subscribeSeen, readSeen, () => true);

  const markSeen = useCallback(() => {
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    window.dispatchEvent(new Event(SEEN_EVENT));
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(SEEN_KEY);
    } catch {}
    window.dispatchEvent(new Event(SEEN_EVENT));
  }, []);

  return { seen, markSeen, reset };
}
