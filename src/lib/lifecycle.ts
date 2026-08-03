"use client";

import { useCallback, useSyncExternalStore } from "react";
import { CheckCircle2, PencilLine, Radio, Send } from "lucide-react";

/** The four beats a post travels, shown in the empty state and the header strip. */
export const JOURNEY_STEPS = [
  { icon: PencilLine, label: "Write it" },
  { icon: CheckCircle2, label: "Get it approved" },
  { icon: Send, label: "Send to a campaign" },
  { icon: Radio, label: "Campaign goes live" },
];

const KEY = "cp_lifecycle_dismissed";
const EVENT = "cp:lifecycle-dismissed";

function read() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useLifecycleStrip() {
  /* Server snapshot is true so the strip never flashes before hydration. */
  const dismissed = useSyncExternalStore(subscribe, read, () => true);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // Private mode — the strip simply returns next load.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // Nothing stored to clear.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { dismissed, dismiss, reset };
}
