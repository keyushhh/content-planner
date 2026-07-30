"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CHANGELOG,
  CHANGELOG_LATEST,
  CHANGELOG_TOTAL,
  type ChangeKind,
} from "@/lib/changelog";

/** Each kind's hue, on the spine dot and the word. Resolved through the accent
    ramp, so the brand layer re-tints them with no call-site change. */
const KIND: Record<ChangeKind, { label: string; text: string; dot: string }> = {
  new: { label: "New", text: "text-violet-300", dot: "bg-violet-400" },
  improved: { label: "Improved", text: "text-sky-300", dot: "bg-sky-400" },
  fixed: { label: "Fixed", text: "text-amber-300", dot: "bg-amber-400" },
};

const FILTERS: { id: "all" | ChangeKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "improved", label: "Improved" },
  { id: "fixed", label: "Fixed" },
];

/* Unread tracking: the log has to be able to say "there is something here you
   haven't read", which is the reason it exists at all. */

const SEEN_KEY = "cp_changelog_seen";
const SEEN_EVENT = "cp:changelog-seen";

function readSeen(): string | null {
  try {
    return window.localStorage.getItem(SEEN_KEY);
  } catch {
    // Blocked storage reads as never-read, so the dot stays visible.
    return null;
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

/**
 * Whether the newest entry postdates the last time the log was opened. The
 * server snapshot says "nothing new", since a dot appearing on hydration is a
 * flash and one appearing a frame late is just a dot.
 */
export function useChangelogUnread() {
  const seen = useSyncExternalStore(subscribeSeen, readSeen, () => CHANGELOG_LATEST);

  const markSeen = useCallback(() => {
    try {
      window.localStorage.setItem(SEEN_KEY, CHANGELOG_LATEST);
    } catch {
      // as above: it just won't survive a reload
    }
    window.dispatchEvent(new Event(SEEN_EVENT));
  }, []);

  // String compare is exact on ISO dates, and the question is only about order.
  return { unread: seen === null || seen < CHANGELOG_LATEST, markSeen };
}

/** "29 July", plus how long ago that was in words. */
function formatDay(iso: string, today: Date) {
  // Noon, not midnight: parsed at midnight this lands a day early west of UTC.
  const date = new Date(`${iso}T12:00:00`);
  const label = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
  });

  const midnight = new Date(today);
  midnight.setHours(12, 0, 0, 0);
  const days = Math.round((midnight.getTime() - date.getTime()) / 86_400_000);

  const relative =
    days <= 0
      ? "Today"
      : days === 1
        ? "Yesterday"
        : days < 7
          ? `${days} days ago`
          : date.toLocaleDateString(undefined, { weekday: "long" });

  return { label, relative };
}

/**
 * The changelog. Reachable only from ⌘K on purpose: you go looking for it when
 * you cannot remember whether a piece of feedback landed, which is not often
 * enough to earn a slot in the header.
 */
export function ChangelogModal({
  open,
  onOpenChange,
  filter,
  onFilterChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: "all" | ChangeKind;
  onFilterChange: (filter: "all" | ChangeKind) => void;
}) {
  const counts = useMemo(() => {
    const tally: Record<string, number> = { all: CHANGELOG_TOTAL };
    for (const day of CHANGELOG) {
      for (const entry of day.entries) {
        tally[entry.kind] = (tally[entry.kind] ?? 0) + 1;
      }
    }
    return tally;
  }, []);

  const days = useMemo(() => {
    // Days that filter down to nothing are dropped: an empty date reads as a bug.
    const today = new Date();
    return CHANGELOG.map((day) => ({
      ...day,
      ...formatDay(day.date, today),
      entries:
        filter === "all" ? day.entries : day.entries.filter((e) => e.kind === filter),
    })).filter((day) => day.entries.length > 0);
  }, [filter]);

  const shown = days.reduce((sum, day) => sum + day.entries.length, 0);

  // Across the whole log, not the filtered view: work owed does not change
  // because you clicked "Fixed".
  const draftCount = useMemo(
    () =>
      CHANGELOG.reduce(
        (sum, day) => sum + day.entries.filter((e) => e.draft).length,
        0,
      ),
    [],
  );

  const dateRange = useMemo(() => {
    const first = CHANGELOG.at(-1)?.date;
    const last = CHANGELOG[0]?.date;
    if (!first || !last) return "";
    const from = new Date(`${first}T12:00:00`);
    const to = new Date(`${last}T12:00:00`);
    // Month said once when both ends share it: "23–29 July".
    const sameMonth = from.getMonth() === to.getMonth();
    return `${from.toLocaleDateString(undefined, {
      day: "numeric",
      ...(sameMonth ? {} : { month: "long" }),
    })}–${to.toLocaleDateString(undefined, { day: "numeric", month: "long" })}`;
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-label="Changelog"
        className="flex max-h-[min(80vh,760px)] w-[640px] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-(--r-surface) border-0 bg-(--surface-dialog) p-0 text-left text-foreground shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.09] sm:max-w-[640px]"
      >
        <div
          aria-hidden
          className="h-px w-full shrink-0 [background-image:var(--specular)]"
        />

        <DialogHeader className="shrink-0 gap-0 p-0 text-left">
          <div className="flex items-start gap-4 px-6 pb-4 pt-6">
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-heading text-[22px] font-semibold leading-tight tracking-[-0.022em]">
                What&rsquo;s new
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-[13px] leading-snug text-muted-foreground text-pretty">
                Every change, newest first, so a piece of feedback can be traced
                to the day it landed.
              </DialogDescription>
            </div>

            {/* Its own button: the stock one sits too far in on a 640px dialog. */}
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Close changelog"
              className="-mr-1.5 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.07] hover:text-foreground active:scale-(--press)"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 px-6 pb-4">
            <div className="flex items-center gap-0.5 rounded-(--r-pill) bg-(--ink)/[0.03] p-0.5 text-[11px] font-medium inset-ring-1 inset-ring-(--ink)/[0.08]">
              {FILTERS.map(({ id, label }) => {
                const active = filter === id;
                return (
                  <button
                    key={id}
                    onClick={() => onFilterChange(id)}
                    aria-pressed={active}
                    className={cn(
                      "flex h-6 items-center gap-1.5 rounded-(--r-pill) px-2.5 transition-[background-color,color,box-shadow,scale] duration-150 active:scale-(--press)",
                      active
                        ? "bg-(--ink)/[0.11] text-foreground shadow-(--lift-sm)"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                    <span
                      className={cn(
                        "tabular-nums",
                        active ? "text-muted-foreground" : "text-muted-foreground/60",
                      )}
                    >
                      {counts[id] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogHeader>

        {/* Keyed on the filter so a switch fades the new list in. */}
        <div
          key={filter}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-(--ink)/[0.07] duration-200 animate-in fade-in"
        >
          {days.map((day, dayIndex) => {
            // Not under a filter: the top day is then only the latest day with
            // a fix, which is a different claim.
            const showLatest = dayIndex === 0 && filter === "all";
            return (
            <section key={day.date}>
              {/* Sticky: the date you are reading under has to stay on screen. */}
              <div className="sticky top-0 z-10 flex items-baseline gap-2 border-b border-(--ink)/[0.06] bg-(--surface-dialog)/85 px-6 py-2.5 backdrop-blur-md">
                <h3
                  className="text-[11px] font-semibold uppercase tracking-[0.09em] text-foreground"
                  style={{ fontFamily: "var(--font-label)" }}
                >
                  {day.label}
                </h3>
                <span className="text-[11px] text-muted-foreground/70">
                  {day.relative}
                </span>
                <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground/60">
                  {day.entries.length}
                </span>
              </div>

              <div className="px-6 pb-5 pt-3.5">
                {/* Not italic: this app uses italics for ABSENT content. */}
                {(day.summary || showLatest) && (
                  <p className="pl-[26px] text-[12px] leading-snug text-muted-foreground/70">
                    {day.summary}
                    {showLatest && (
                      <span
                        className={cn(
                          "rounded-(--r-pill) bg-violet-500/[0.14] px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-[0.08em] text-violet-200 inset-ring-1 inset-ring-violet-400/25",
                          // Nothing to sit beside without a summary.
                          day.summary && "ml-2",
                        )}
                      >
                        Latest
                      </span>
                    )}
                  </p>
                )}

                {/* The spine, stopped short at both ends so it reads as a
                    timeline segment rather than a border. */}
                <div
                  className={cn(
                    "relative",
                    // Full gap only when there is a line above it.
                    day.summary || showLatest ? "mt-3" : "mt-0.5",
                  )}
                >
                  <span
                    aria-hidden
                    className="absolute left-[4px] top-2 bottom-2 w-px bg-(--ink)/[0.09]"
                  />

                  <ul className="flex flex-col gap-3.5">
                    {day.entries.map((entry) => {
                      const kind = KIND[entry.kind];
                      return (
                        <li
                          key={entry.commit + entry.title}
                          className="group relative grid grid-cols-[9px_1fr] gap-x-[17px]"
                        >
                          {/* Ringed in the surface colour, so the dot punches
                              a hole in the spine. */}
                          <span
                            aria-hidden
                            className={cn(
                              "mt-[6px] size-[9px] rounded-(--r-round) ring-[3px] ring-(--surface-dialog)",
                              kind.dot,
                            )}
                          />

                          <div className="min-w-0">
                            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <span
                                className={cn(
                                  "text-[9.5px] font-semibold uppercase tracking-[0.08em]",
                                  kind.text,
                                )}
                                style={{ fontFamily: "var(--font-label)" }}
                              >
                                {kind.label}
                              </span>
                              <span className="text-[13.5px] font-medium leading-snug tracking-[-0.006em]">
                                {entry.title}
                              </span>
                              {/* Neutral, never the accent: it admits the
                                  wording is machine-written. */}
                              {entry.draft && (
                                <span
                                  title="Written from the commit subject. Not polished yet."
                                  className="rounded-(--r-pill) bg-(--ink)/[0.05] px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70 inset-ring-1 inset-ring-(--ink)/[0.08]"
                                  style={{ fontFamily: "var(--font-label)" }}
                                >
                                  Draft
                                </span>
                              )}
                              {/* On hover only: asked one row at a time. */}
                              <span className="font-mono text-[10px] text-muted-foreground/0 transition-colors duration-150 group-hover:text-muted-foreground/55">
                                {entry.commit}
                              </span>
                            </p>
                            {entry.detail && (
                              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground text-pretty">
                                {entry.detail}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </section>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-(--ink)/[0.07] bg-(--sink)/[0.15] px-6 py-2.5 text-[11px] text-muted-foreground">
          <span className="tabular-nums">
            {shown} {shown === 1 ? "update" : "updates"}
            {filter !== "all" && ` of ${CHANGELOG_TOTAL}`}
          </span>
          <span aria-hidden className="text-muted-foreground/30">
            ·
          </span>
          <span>{dateRange}</span>
          {/* A nudge, not a statistic, so "0 drafts" never shows. */}
          {draftCount > 0 && (
            <>
              <span aria-hidden className="text-muted-foreground/30">
                ·
              </span>
              <span
                title="Entries still worded from their commit subject"
                className="tabular-nums text-muted-foreground/70"
              >
                {draftCount} draft{draftCount === 1 ? "" : "s"}
              </span>
            </>
          )}
          <span className="ml-auto flex items-center gap-1.5">
            <kbd className="rounded-sm bg-(--ink)/[0.06] px-1 py-px text-[10px] inset-ring-1 inset-ring-(--ink)/[0.08]">
              esc
            </kbd>
            close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
