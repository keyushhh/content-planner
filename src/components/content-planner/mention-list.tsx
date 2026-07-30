"use client";

import { useMemo, useRef, useState } from "react";
import { AtSign, Check, Search } from "lucide-react";
import { cn, avatarTint } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  MENTION_KIND_LABEL,
  formatFollowers,
  insertMention,
  mentionsIn,
  searchMentions,
  type MentionAccount,
} from "@/lib/mentions";

export function useMentionTarget(
  value: string,
  onValueChange: (next: string) => void,
) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const caret = useRef(value.length);

  const api = {
    onSelect: () => {
      caret.current = ref.current?.selectionStart ?? value.length;
    },
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onValueChange(e.target.value);
      caret.current = e.target.selectionStart;
    },
    insert: (handle: string) => {
      const next = insertMention(value, caret.current, handle);
      onValueChange(next.text);
      caret.current = next.caret;
      requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(next.caret, next.caret);
      });
    },
    clamp: (next: string) => {
      caret.current = Math.min(caret.current, next.length);
    },
  };

  return [ref, api] as const;
}

export function MentionPopover({
  value,
  onInsert,
  disabled,
  side = "bottom",
  align = "end",
  label = "Add Mentions",
}: {
  value: string;
  onInsert: (handle: string) => void;
  disabled?: boolean;
  side?: "top" | "bottom";
  align?: "start" | "end";
  label?: string;
}) {
  const active = mentionsIn(value);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            title="Insert a mention"
            className="flex h-7 items-center gap-1.5 rounded-(--r-pill) px-2 text-xs font-medium text-blue-400 transition-[background-color,color,scale] duration-150 hover:bg-blue-400/10 hover:text-blue-300 active:scale-(--press) disabled:cursor-not-allowed disabled:opacity-50 data-[popup-open]:bg-blue-400/12 data-[popup-open]:text-blue-200"
          >
            <AtSign className="size-3.5" />
            {label}
            {active.length > 0 && (
              <span className="ml-0.5 rounded-(--r-pill) bg-blue-400/20 px-1.5 text-[10px] font-semibold tabular-nums text-blue-200">
                {active.length}
              </span>
            )}
          </button>
        }
      />
      <PopoverContent
        align={align}
        side={side}
        className="w-[300px] gap-0 p-2 @container"
      >
        <MentionList
          autoFocus
          active={active.map((a) => a.handle)}
          onPick={onInsert}
          listClassName="max-h-[264px]"
        />
      </PopoverContent>
    </Popover>
  );
}

export function MentionList({
  active,
  onPick,
  autoFocus,
  className,
  listClassName,
}: {
  active: string[];
  onPick: (handle: string) => void;
  autoFocus?: boolean;
  className?: string;
  listClassName?: string;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchMentions(query), [query]);
  const on = useMemo(
    () => new Set(active.map((h) => h.toLowerCase())),
    [active],
  );

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <div className="relative shrink-0">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search handles and names…"
          aria-label="Search accounts to mention"
          className="h-8 w-full rounded-(--r-pill) bg-(--ink)/[0.035] pl-8 pr-3 text-[12.5px] caret-violet-400 inset-ring-1 inset-ring-(--ink)/[0.08] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted-foreground/70 focus:bg-(--ink)/[0.06] focus:inset-ring-violet-400/50"
        />
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
          <span className="flex size-8 items-center justify-center rounded-(--r-pill) bg-violet-500/10 text-violet-300 inset-ring-1 inset-ring-violet-400/25">
            <AtSign className="size-3.5" />
          </span>
          <span className="text-[12.5px] font-medium">No accounts found</span>
          <span className="text-[11px] text-muted-foreground text-pretty">
            Nothing matches “{query.trim()}”.
          </span>
        </div>
      ) : (
        <div className={cn("-mx-1 min-h-0 overflow-y-auto px-1", listClassName)}>
          {results.map((account) => (
            <MentionRow
              key={account.id}
              account={account}
              picked={on.has(account.handle.toLowerCase())}
              onPick={() => onPick(account.handle)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MentionRow({
  account,
  picked,
  onPick,
}: {
  account: MentionAccount;
  picked: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      title={`Insert @${account.handle}`}
      className={cn(
        "group/mention flex w-full items-center gap-2.5 rounded-(--r-inner) px-2 py-1.5 text-left transition-[background-color,scale] duration-150 active:scale-[0.99]",
        picked ? "bg-violet-500/[0.09]" : "hover:bg-(--ink)/[0.05]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-(--r-inner) text-[11px] font-semibold inset-ring-1 inset-ring-(--ink)/[0.07]",
          avatarTint(account.name),
        )}
      >
        {initials(account.name)}
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[12.5px] font-medium">{account.name}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground/60">
            {MENTION_KIND_LABEL[account.kind]}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="truncate">@{account.handle}</span>
          <span aria-hidden className="shrink-0 text-muted-foreground/40">
            ·
          </span>
          <span className="shrink-0 tabular-nums">
            {formatFollowers(account.followers)}
          </span>
        </span>
      </span>

      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-(--r-pill) transition-[opacity,scale] duration-150",
          picked
            ? "scale-100 bg-violet-500 text-white opacity-100"
            : "scale-50 opacity-0",
        )}
      >
        <Check className="size-2.5" strokeWidth={3} />
      </span>
    </button>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
