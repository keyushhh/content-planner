"use client";

import { useState } from "react";
import { Check, ChevronDown, Search, Tag } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, tagDot } from "@/lib/utils";

export interface TagCount {
  name: string;
  count: number;
}

const LABEL_BUDGET = 22;

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

  const panelTags = [...tags].sort((a, b) => a.name.localeCompare(b.name));
  const searchable = panelTags.length > 12;
  const listed = query
    ? panelTags.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : panelTags;

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
            className={cn(
              "flex h-8 max-w-[240px] items-center gap-1.5 rounded-(--r-pill) px-3 text-[13px] font-medium inset-ring-1 transition-[background-color,box-shadow,color,scale] duration-150 active:scale-(--press)",
              active.length > 0
                ? "bg-violet-500/[0.16] text-violet-100 inset-ring-violet-400/45"
                : open
                ? "bg-(--ink)/[0.09] text-foreground inset-ring-(--ink)/[0.14]"
                : "bg-(--ink)/[0.035] text-muted-foreground inset-ring-(--ink)/[0.08] hover:text-foreground",
            )}
          />
        }
      >
        <Tag className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown className="size-3.5 shrink-0 opacity-60" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[280px] max-w-[calc(100vw-3rem)] gap-0 overflow-clip rounded-(--r-surface) border-0 bg-(--surface-dialog) p-0 text-foreground shadow-(--lift-lg) ring-0 inset-ring-1 inset-ring-(--ink)/[0.09]"
      >
        <div
          aria-hidden
          className="h-px w-full shrink-0 [background-image:var(--specular)]"
        />

        <div className="flex items-center justify-between gap-2 px-3.5 pb-2.5 pt-3">
          <span className="text-[13px] font-medium">Filter by tag</span>
          {active.length > 0 ? (
            <button
              onClick={onClear}
              className="-mr-1 h-6 rounded-(--r-pill) px-2 text-[11px] text-muted-foreground transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground"
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
          <div className="relative border-t border-(--ink)/[0.06] px-2.5 py-2.5">
            <Search className="pointer-events-none absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a tag…"
              aria-label="Find a tag"
              className="h-8 w-full rounded-(--r-pill) bg-(--ink)/[0.04] pl-8 pr-2.5 text-[13px] caret-violet-400 inset-ring-1 inset-ring-(--ink)/[0.08] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted-foreground/70 focus:bg-(--ink)/[0.06] focus:inset-ring-violet-400/50"
            />
          </div>
        )}

        <div className="max-h-[288px] overflow-y-auto border-t border-(--ink)/[0.06] p-1.5">
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
      className="flex w-full items-center gap-2.5 rounded-(--r-inner) px-2.5 py-1.5 text-left text-[13px] transition-colors duration-150 hover:bg-(--ink)/[0.06]"
    >
      <span
        aria-hidden
        className={cn(
          "flex size-[15px] shrink-0 items-center justify-center rounded-(--r-inner) transition-[background-color,box-shadow] duration-150 inset-ring-1",
          active
            ? "bg-violet-500 inset-ring-violet-400"
            : "bg-(--ink)/[0.03] inset-ring-(--ink)/[0.14]",
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
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 rounded-(--r-round)", tagDot(label), !active && "opacity-70")}
      />
      <span className={cn("flex-1 truncate", active ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/55">
        {count}
      </span>
    </button>
  );
}
