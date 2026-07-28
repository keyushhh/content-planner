"use client";

import { useState } from "react";
import { Check, ChevronDown, Search, Tag } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface TagCount {
  name: string;
  count: number;
}

/** Roughly the width the trigger can spend on names before it starts pushing
 *  the controls beside it around. Past it, we fall back to a count. */
const LABEL_BUDGET = 22;

/**
 * Tags, as one dropdown rather than a row of chips.
 *
 * The chip row had two problems the dropdown fixes: it was a third interaction
 * model sitting next to Status and Sort (a field, two menus, and a row of
 * toggles is three grammars in one toolbar), and it changed width as tags came
 * and went, which shifted the table underneath it.
 *
 * What the chip row was good at — telling you WHICH tags you had filtered by
 * without opening anything — is preserved in the trigger: it spends its width
 * on names first and only degrades to "4 tags" when the names genuinely will
 * not fit. A bare count would say that you filtered but not what by, which is
 * the question you actually ask when a table looks short.
 */
export function TagFilterBar({
  tags,
  active,
  onToggle,
  onClear,
}: {
  tags: TagCount[];
  active: string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  if (tags.length === 0) return null;

  // Alphabetical, and alphabetical always: ordering by selection would make
  // rows jump out from under the cursor mid-multi-select.
  const panelTags = [...tags].sort((a, b) => a.name.localeCompare(b.name));
  const searchable = panelTags.length > 12;
  const listed = query
    ? panelTags.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : panelTags;

  // Names while they fit, a count when they do not. One name is always worth
  // showing — "Design" and "1 tag" cost the same room and one of them answers
  // the question.
  const joined = active.join(", ");
  const label =
    active.length === 0
      ? "Tags"
      : joined.length <= LABEL_BUDGET
      ? joined
      : `${active.length} tags`;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger
        render={
          <button
            title={
              active.length > 0
                ? `Filtering by ${joined}`
                : `Filter by tag (${panelTags.length} available)`
            }
            aria-label={
              active.length > 0
                ? `Filter by tag, ${active.length} selected: ${joined}`
                : "Filter by tag"
            }
            // Same shape and the same violet "a filter is on" signal as Status,
            // because it is the same kind of control.
            className={cn(
              "flex h-8 max-w-[240px] items-center gap-1.5 rounded-full px-3 text-[13px] font-medium inset-ring-1 transition-[background-color,box-shadow,color,scale] duration-150 active:scale-[0.97]",
              active.length > 0
                ? "bg-violet-500/[0.16] text-violet-100 inset-ring-violet-400/45"
                : open
                ? "bg-white/[0.09] text-foreground inset-ring-white/[0.14]"
                : "bg-white/[0.035] text-muted-foreground inset-ring-white/[0.08] hover:text-foreground",
            )}
          />
        }
      >
        <Tag className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown className="size-3.5 shrink-0 opacity-60" />
      </PopoverTrigger>

      {/* Canvas idiom: specular top edge, hairline-divided sections */}
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[280px] max-w-[calc(100vw-3rem)] gap-0 overflow-clip rounded-[18px] border-0 bg-[oklch(0.26_0_0)] p-0 text-foreground shadow-[0_2px_4px_rgba(0,0,0,0.35),0_24px_56px_-28px_rgba(0,0,0,1)] ring-0 inset-ring-1 inset-ring-white/[0.09]"
      >
        <div
          aria-hidden
          className="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-white/[0.11] to-transparent"
        />

        <div className="flex items-center justify-between gap-2 px-3.5 pb-2.5 pt-3">
          <span className="text-[13px] font-medium">Filter by tag</span>
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

        {/* Rows, not a chip cloud: you arrive here looking for a word you
            already have in mind, and a vertical list is what you can scan. */}
        <div className="max-h-[288px] overflow-y-auto border-t border-white/[0.06] p-1.5">
          {listed.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              No tag matches &ldquo;{query}&rdquo;
            </p>
          ) : (
            listed.map((tag) => (
              <TagOption
                key={tag.name}
                label={tag.name}
                count={tag.count}
                active={active.includes(tag.name)}
                onClick={() => onToggle(tag.name)}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** One tag in the panel. Stays open on click — picking tags is usually plural. */
function TagOption({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="menuitemcheckbox"
      aria-checked={active}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 text-left text-[13px] transition-colors duration-150 hover:bg-white/[0.06]"
    >
      <span
        aria-hidden
        className={cn(
          "flex size-[15px] shrink-0 items-center justify-center rounded-[5px] transition-[background-color,box-shadow] duration-150 inset-ring-1",
          active
            ? "bg-violet-500 inset-ring-violet-400"
            : "bg-white/[0.03] inset-ring-white/[0.14]",
        )}
      >
        <Check
          className={cn(
            "size-2.5 text-white transition-[opacity,scale] duration-200",
            active ? "scale-100 opacity-100" : "scale-[0.4] opacity-0",
          )}
          style={{ transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
        />
      </span>
      <span className={cn("flex-1 truncate", active ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/55">
        {count}
      </span>
    </button>
  );
}
