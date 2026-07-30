"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  CornerDownLeft,
  FileText,
  Megaphone,
  PlusCircle,
  ScrollText,
  Search,
  Tag,
  UserPlus,
} from "lucide-react";
import { cn, tagDot } from "@/lib/utils";
import { STATUS_TONE } from "./status-badge";
import type { Campaign, Session } from "@/lib/types";

const EASE = "cubic-bezier(0.2,0,0,1)";
/** Enough to fill the panel; past this you should be typing, not scrolling. */
const MAX_PER_GROUP = 6;

type Item = {
  id: string;
  /** What the row says. */
  label: string;
  /** Second line, when the label alone is ambiguous. */
  hint?: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Everything the query is matched against, lowercased. */
  haystack: string;
  /** A status hairline or tag hue, for rows that carry one. */
  accent?: string;
  run: () => void;
};

export interface CommandPaletteActions {
  onOpenSession: (id: string) => void;
  onNewContent: () => void;
  onOpenCampaign?: (id: string) => void;
  onInvite?: () => void;
  onFilterTag?: (tag: string) => void;
  /** The changelog's only entry point. */
  onOpenChangelog?: () => void;
  /** Something in the log postdates the last time it was opened. */
  changelogUnread?: boolean;
}

/**
 * The command palette. Deliberately not a fuzzy matcher: subsequence matching
 * ("ncnt" for "New content") also matches everything else.
 */
export function CommandPalette({
  open,
  onOpenChange,
  sessions,
  campaigns,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: Session[];
  campaigns: Campaign[];
  actions: CommandPaletteActions;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Rewound on open during render, so the panel never flashes the last search.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setActive(0);
    }
  }

  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];

    list.push({
      id: "new-content",
      label: "New content",
      hint: "Create a post",
      group: "Actions",
      icon: PlusCircle,
      haystack: "new content create post add",
      run: actions.onNewContent,
    });
    if (actions.onInvite) {
      list.push({
        id: "invite",
        label: "Invite someone",
        hint: "Share access to this workspace",
        group: "Actions",
        icon: UserPlus,
        haystack: "invite share access teammate people",
        run: actions.onInvite,
      });
    }
    if (actions.onOpenChangelog) {
      list.push({
        id: "changelog",
        label: "What's new",
        hint: actions.changelogUnread
          ? "Updates since you last looked"
          : "Every change, by the day it shipped",
        group: "Actions",
        icon: ScrollText,
        // The accent dot means there is something unread in the log.
        accent: actions.changelogUnread ? "bg-violet-400" : undefined,
        // Neither "changelog" nor "release notes" is in the label.
        haystack: "what's new whats new changelog updates release notes history changes",
        run: actions.onOpenChangelog,
      });
    }

    for (const session of sessions) {
      list.push({
        id: `session-${session.id}`,
        label: session.title || "Untitled content",
        hint: `${session.postType} · ${STATUS_TONE[session.status].label}`,
        group: "Content",
        icon: FileText,
        accent: STATUS_TONE[session.status].bar,
        // Tags in the haystack but not the label: searching "launch" should find
        // the posts tagged launch without the row shouting the tag back at you.
        haystack: `${session.title} ${session.postType} ${session.status} ${session.tags.join(" ")}`.toLowerCase(),
        run: () => actions.onOpenSession(session.id),
      });
    }

    if (actions.onOpenCampaign) {
      for (const campaign of campaigns) {
        list.push({
          id: `campaign-${campaign.id}`,
          label: campaign.name,
          hint: `${campaign.sessionIds.length} ${
            campaign.sessionIds.length === 1 ? "item" : "items"
          }`,
          group: "Campaigns",
          icon: Megaphone,
          haystack: `${campaign.name} campaign ${campaign.tag}`.toLowerCase(),
          run: () => actions.onOpenCampaign?.(campaign.id),
        });
      }
    }

    if (actions.onFilterTag) {
      const tags = Array.from(new Set(sessions.flatMap((s) => s.tags))).sort();
      for (const tag of tags) {
        list.push({
          id: `tag-${tag}`,
          label: `Filter by ${tag}`,
          group: "Tags",
          icon: Tag,
          accent: tagDot(tag),
          haystack: `filter tag ${tag}`.toLowerCase(),
          run: () => actions.onFilterTag?.(tag),
        });
      }
    }

    return list;
  }, [sessions, campaigns, actions]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // No query: offer the actions and the most recent content rather than an
      // arbitrary alphabetical slice. An empty palette should still be useful.
      return [
        ...items.filter((i) => i.group === "Actions"),
        ...items.filter((i) => i.group === "Content").slice(0, MAX_PER_GROUP),
      ];
    }

    const scored = items
      .map((item) => {
        const at = item.haystack.indexOf(q);
        if (at === -1) return null;
        // Prefix beats word-start beats anywhere, so the obvious answer is first.
        const isWordStart = at === 0 || /\s/.test(item.haystack[at - 1]);
        return { item, rank: at === 0 ? 0 : isWordStart ? 1 : 2, at };
      })
      .filter((x): x is { item: Item; rank: number; at: number } => x !== null)
      .sort((a, b) => a.rank - b.rank || a.at - b.at);

    // Capped per group so one big group cannot bury the others.
    const perGroup = new Map<string, number>();
    const out: Item[] = [];
    for (const { item } of scored) {
      const used = perGroup.get(item.group) ?? 0;
      if (used >= MAX_PER_GROUP) continue;
      perGroup.set(item.group, used + 1);
      out.push(item);
    }
    return out;
  }, [items, query]);

  // Clamped rather than reset: retyping should not throw you back to the top of
  // a list you were already walking.
  const activeIndex = Math.min(active, Math.max(0, results.length - 1));

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onOpenChange(false);
        return;
      }
      if (e.key === "ArrowDown" || (e.key === "n" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setActive((prev) => Math.min(results.length - 1, prev + 1));
        return;
      }
      if (e.key === "ArrowUp" || (e.key === "p" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setActive((prev) => Math.max(0, prev - 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = results[activeIndex];
        if (!item) return;
        onOpenChange(false);
        item.run();
      }
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, results, activeIndex, onOpenChange]);

  /** Keeps the highlighted row in view as it walks off the bottom. */
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, results.length]);

  if (!open || typeof document === "undefined") return null;

  let lastGroup: string | null = null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-start justify-center px-4 pt-[12vh]">
      <button
        aria-label="Close command palette"
        onClick={() => onOpenChange(false)}
        // Scrim, not a wall of black: the app stays legible behind it, which is
        // what keeps the palette feeling like a layer rather than another page.
        className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-[2px] duration-200 animate-in fade-in"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative flex w-full max-w-[560px] flex-col overflow-hidden rounded-(--r-surface) bg-(--surface-float) shadow-(--lift-lg) duration-200 animate-in fade-in zoom-in-[0.98] slide-in-from-top-2 inset-ring-1 inset-ring-(--ink)/[0.10]"
        style={{ animationTimingFunction: EASE }}
      >
        <div
          aria-hidden
          className="h-px w-full shrink-0 [background-image:var(--specular)]"
        />

        <div className="flex items-center gap-3 px-4 py-3.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search content, campaigns, actions…"
            aria-label="Search commands"
            className="h-6 min-w-0 flex-1 bg-transparent text-[14px] caret-violet-400 outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="hidden shrink-0 rounded-md bg-(--ink)/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.08] sm:block">
            esc
          </kbd>
        </div>

        <div
          ref={listRef}
          className="max-h-[min(52vh,420px)] overflow-y-auto border-t border-(--ink)/[0.07] p-1.5"
        >
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">
              Nothing matches &ldquo;{query.trim()}&rdquo;
            </p>
          ) : (
            results.map((item, i) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              const isActive = i === activeIndex;

              return (
                <div key={item.id}>
                  {showGroup && (
                    <div className="px-2.5 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground/70">
                      {item.group}
                    </div>
                  )}
                  <button
                    data-active={isActive}
                    // Pointer moves the selection rather than fighting it, so the
                    // mouse and the keyboard drive the same single highlight.
                    onPointerMove={() => setActive(i)}
                    onClick={() => {
                      onOpenChange(false);
                      item.run();
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-(--r-inner) px-2.5 py-2 text-left transition-colors duration-100",
                      isActive ? "bg-(--ink)/[0.07]" : "hover:bg-(--ink)/[0.04]",
                    )}
                  >
                    <span className="relative flex size-7 shrink-0 items-center justify-center rounded-(--r-inner) bg-(--ink)/[0.05] text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.07]">
                      <item.icon className="size-3.5" />
                      {/* status / tag hue, as a dot on the glyph tile */}
                      {item.accent && (
                        <span
                          aria-hidden
                          className={cn(
                            "absolute -right-0.5 -top-0.5 size-2 rounded-(--r-round) ring-2 ring-(--surface-float)",
                            item.accent,
                          )}
                        />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium">
                        {item.label}
                      </span>
                      {item.hint && (
                        <span className="block truncate text-[11.5px] text-muted-foreground">
                          {item.hint}
                        </span>
                      )}
                    </span>

                    {/* The affordance appears on the row you are about to run */}
                    <ArrowRight
                      className={cn(
                        "size-3.5 shrink-0 transition-[opacity,translate] duration-150",
                        isActive
                          ? "translate-x-0 text-foreground/70 opacity-100"
                          : "-translate-x-1 opacity-0",
                      )}
                      style={{ transitionTimingFunction: EASE }}
                    />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-(--ink)/[0.07] bg-(--sink)/[0.15] px-4 py-2.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded-sm bg-(--ink)/[0.06] px-1 py-px text-[10px] inset-ring-1 inset-ring-(--ink)/[0.08]">
              ↑
            </kbd>
            <kbd className="rounded-sm bg-(--ink)/[0.06] px-1 py-px text-[10px] inset-ring-1 inset-ring-(--ink)/[0.08]">
              ↓
            </kbd>
            navigate
          </span>
          <span className="flex items-center gap-1.5">
            <CornerDownLeft className="size-3" />
            open
          </span>
          <span className="ml-auto flex items-center gap-1.5 tabular-nums">
            {results.length} {results.length === 1 ? "result" : "results"}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Registers ⌘K / Ctrl-K globally. Kept next to the palette so the two cannot drift. */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen };
}
