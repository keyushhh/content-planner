"use client";

import { useState } from "react";
import { Check, MoreHorizontal, Search, Tag } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface TagCount {
  name: string;
  count: number;
}

/**
 * Tag filters degrade badly at scale: a repository with 20 tags wraps the row
 * onto three lines and pushes the table below the fold. So we show a fixed
 * number of the most-used tags inline and park the tail in a popover.
 *
 * The one rule that keeps it honest: an active tag is ALWAYS inline. Filtering
 * by a tag from the popover and then watching that chip vanish from the row
 * reads as a bug, so selection promotes the chip into the visible set.
 */
export function TagFilterBar({
  tags,
  active,
  onToggle,
  onClear,
  visibleCount = 3,
}: {
  tags: TagCount[];
  active: string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
  visibleCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  if (tags.length === 0) return null;

  const activeTags = tags.filter((t) => active.includes(t.name));
  const restTags = tags.filter((t) => !active.includes(t.name));
  const inline = [...activeTags, ...restTags.slice(0, Math.max(0, visibleCount - activeTags.length))];
  const overflow = restTags.slice(Math.max(0, visibleCount - activeTags.length));

  // The panel holds EVERY tag, not just the hidden tail — otherwise picking a
  // chip promotes it inline and it vanishes from under the cursor. Alphabetical
  // here (frequency order only decides which five get to sit inline), because
  // in a cloud you are scanning for a specific word.
  const panelTags = [...tags].sort((a, b) => a.name.localeCompare(b.name));
  const searchable = panelTags.length > 12;
  const listed = query
    ? panelTags.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : panelTags;

  return (
    // ml separates the filters from the search field they sit beside
    <div className="ml-2 flex flex-wrap items-center gap-1.5">
      <Tag className="mx-1 size-3.5 shrink-0 text-muted-foreground" />

      {inline.map((tag) => (
        <TagChip
          key={tag.name}
          label={tag.name}
          active={active.includes(tag.name)}
          onClick={() => onToggle(tag.name)}
        />
      ))}

      {overflow.length > 0 && (
        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setQuery("");
          }}
        >
          {/* No "+N": the panel opens the FULL vocabulary, so a delta count
              contradicts the total shown inside it. The number here is that
              same total, and the ellipsis carries the "there is more" meaning. */}
          <PopoverTrigger
            render={
              <button
                aria-label={`Filter by tag — ${panelTags.length} tags`}
                title={`All ${panelTags.length} tags`}
                className={cn(
                  "flex h-8 items-center gap-1 rounded-full pl-2.5 pr-3 text-xs font-medium transition-[background-color,color,box-shadow,scale] duration-150 inset-ring-1 active:scale-[0.96]",
                  open
                    ? "bg-white/[0.09] text-foreground inset-ring-white/[0.14]"
                    : "bg-white/[0.035] text-muted-foreground inset-ring-white/[0.08] hover:text-foreground",
                )}
              />
            }
          >
            <MoreHorizontal className="size-3.5" />
            <span className="tabular-nums">{panelTags.length}</span>
          </PopoverTrigger>

          {/* Canvas idiom: specular top edge, hairline-divided sections */}
          <PopoverContent
            align="start"
            sideOffset={8}
            className="w-[340px] max-w-[calc(100vw-3rem)] gap-0 overflow-clip rounded-[18px] border-0 bg-[oklch(0.26_0_0)] p-0 text-foreground shadow-[0_2px_4px_rgba(0,0,0,0.35),0_24px_56px_-28px_rgba(0,0,0,1)] ring-0 inset-ring-1 inset-ring-white/[0.09]"
          >
            <div
              aria-hidden
              className="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-white/[0.11] to-transparent"
            />

            <div className="flex items-center justify-between gap-2 px-3.5 pb-2.5 pt-3">
              <span className="text-[13px] font-medium">All tags</span>
              {active.length > 0 ? (
                <button
                  onClick={onClear}
                  className="-mr-1 h-6 rounded-full px-2 text-[11px] text-muted-foreground transition-[background-color,color] duration-150 hover:bg-white/[0.06] hover:text-foreground"
                >
                  Clear {active.length}
                </button>
              ) : (
                <span className="text-[11px] tabular-nums text-muted-foreground/60">
                  {panelTags.length}
                </span>
              )}
            </div>

            {searchable && (
              <div className="relative border-t border-white/[0.06] px-2.5 py-2.5">
                <Search className="pointer-events-none absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find a tag…"
                  aria-label="Find a tag"
                  className="h-8 w-full rounded-full bg-white/[0.04] pl-8 pr-2.5 text-[13px] caret-violet-400 inset-ring-1 inset-ring-white/[0.08] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted-foreground/70 focus:bg-white/[0.06] focus:inset-ring-violet-400/50"
                />
              </div>
            )}

            {/* A cloud of the same chips as the row above — one vocabulary, so
                the panel reads as more of the row rather than a nested menu. */}
            <div className="max-h-[264px] overflow-y-auto border-t border-white/[0.06] p-3">
              {listed.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-muted-foreground">
                  No tag matches &ldquo;{query}&rdquo;
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {listed.map((tag) => (
                    <TagChip
                      key={tag.name}
                      label={tag.name}
                      active={active.includes(tag.name)}
                      onClick={() => onToggle(tag.name)}
                    />
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {active.length > 0 && (
        <button
          onClick={onClear}
          className="h-8 rounded-full px-2.5 text-xs text-muted-foreground transition-[background-color,color] duration-150 hover:bg-white/[0.06] hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  );
}

function TagChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        // h-8 to match the search field and the action buttons sharing this row
        "flex h-8 items-center rounded-full px-3 text-xs font-medium transition-[background-color,color,box-shadow,scale] duration-150 inset-ring-1 active:scale-[0.96]",
        active
          ? "bg-violet-500/[0.16] text-violet-100 inset-ring-violet-400/45"
          : "bg-white/[0.035] text-muted-foreground inset-ring-white/[0.08] hover:text-foreground",
      )}
    >
      {/* The chip grows to make room for the check rather than reserving a slot
          for it: a 0fr→1fr grid column, with the icon in a min-w-0 clip box so
          its intrinsic width cannot hold the collapsed column open. */}
      <span
        aria-hidden
        className={cn(
          "grid transition-[grid-template-columns] duration-250",
          active ? "grid-cols-[1fr]" : "grid-cols-[0fr]",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
      >
        <span className="min-w-0 overflow-clip">
          <Check
            className={cn(
              "mr-1 size-3.5 text-violet-300 transition-[opacity,scale] duration-200",
              active ? "scale-100 opacity-100" : "scale-[0.25] opacity-0",
            )}
            style={{ transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
          />
        </span>
      </span>
      {label}
    </button>
  );
}
