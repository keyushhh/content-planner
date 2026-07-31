"use client";

import { useMemo, useRef, useState } from "react";
import { AtSign, Check, Search } from "lucide-react";
import { cn, avatarTint } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  MENTION_TABS,
  accountsForTab,
  formatFollowers,
  groupByKind,
  insertMention,
  searchMentions,
  type MentionAccount,
  type MentionTab,
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
  taggedIds,
  onToggle,
  disabled,
  side = "bottom",
  align = "end",
  label = "Add Mentions",
}: {
  taggedIds: string[];
  onToggle: (account: MentionAccount) => void;
  disabled?: boolean;
  side?: "top" | "bottom";
  align?: "start" | "end";
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            title="Tag community members"
            className="flex h-7 items-center gap-1.5 rounded-(--r-pill) px-2 text-xs font-medium text-blue-400 transition-[background-color,color,scale] duration-150 hover:bg-blue-400/10 hover:text-blue-300 active:scale-(--press) disabled:cursor-not-allowed disabled:opacity-50 data-[popup-open]:bg-blue-400/12 data-[popup-open]:text-blue-200"
          >
            <AtSign className="size-3.5" />
            {label}
            {taggedIds.length > 0 && (
              <span className="ml-0.5 rounded-(--r-pill) bg-blue-400/20 px-1.5 text-[10px] font-semibold tabular-nums text-blue-200">
                {taggedIds.length}
              </span>
            )}
          </button>
        }
      />
      <PopoverContent
        align={align}
        side={side}
        className="w-[400px] gap-0 rounded-(--r-float) p-3 shadow-(--lift-lg) @container [.dark:not(.wozku)_&]:bg-popover/70 [.dark:not(.wozku)_&]:backdrop-blur-xl [.dark:not(.wozku)_&]:backdrop-saturate-150 [.dark:not(.wozku)_&]:ring-white/[0.08]"
      >
        <MentionList
          autoFocus
          taggedIds={taggedIds}
          onPick={onToggle}
          onDone={() => setOpen(false)}
          listClassName="max-h-[280px]"
        />
      </PopoverContent>
    </Popover>
  );
}

export function MentionList({
  taggedIds,
  onPick,
  autoFocus,
  className,
  listClassName,
  onDone,
}: {
  taggedIds: string[];
  onPick: (account: MentionAccount) => void;
  autoFocus?: boolean;
  className?: string;
  listClassName?: string;
  onDone?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<MentionTab>("all");

  const searched = useMemo(() => searchMentions(query), [query]);
  const filtered = useMemo(
    () => accountsForTab(tab, searched),
    [searched, tab],
  );
  const groups = useMemo(() => groupByKind(filtered), [filtered]);
  const tagged = useMemo(() => new Set(taggedIds), [taggedIds]);

  return (
    <div className={cn("flex min-h-0 flex-col gap-3", className)}>
      <div className="relative shrink-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, organizations, or @handle…"
          aria-label="Search accounts to mention"
          className="h-9 w-full rounded-(--r-pill) bg-(--ink)/[0.035] pl-8 pr-3 text-[13px] caret-violet-400 inset-ring-1 inset-ring-(--ink)/[0.08] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted-foreground/70 focus:bg-(--ink)/[0.05] focus:inset-ring-violet-400/50"
        />
      </div>

      <div className="flex shrink-0 items-center rounded-(--r-pill) bg-(--ink)/[0.035] p-0.5 inset-ring-1 inset-ring-(--ink)/[0.06]">
        {MENTION_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-(--r-pill) px-2 py-1 text-[11.5px] font-medium transition-[background-color,color,box-shadow] duration-200",
              tab === t.id
                ? "bg-(--surface-raised) text-foreground shadow-(--lift-sm)"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 px-4 py-9 text-center">
          <span className="flex size-9 items-center justify-center rounded-(--r-pill) bg-violet-500/10 text-violet-300 inset-ring-1 inset-ring-violet-400/25">
            <AtSign className="size-4" />
          </span>
          <span className="text-[13px] font-medium">No accounts found</span>
          <span className="text-[11.5px] text-muted-foreground text-pretty">
            Nothing matches “{query.trim()}”.
          </span>
        </div>
      ) : (
        <div
          className={cn(
            "-mx-1 min-h-0 overflow-y-auto px-1 pb-2 [mask-image:linear-gradient(to_top,transparent,black_16px)] [-webkit-mask-image:linear-gradient(to_top,transparent,black_16px)]",
            listClassName,
          )}
        >
          {groups.map((group, i) => (
            <div
              key={group.kind}
              className={cn(
                "pb-2.5",
                i > 0 && "mt-1 border-t border-(--ink)/[0.05] pt-2.5",
              )}
            >
              <span className="block px-2.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/55">
                {group.label}
              </span>
              <div className="flex flex-col gap-0.5">
                {group.accounts.map((account) => (
                  <MentionRow
                    key={account.id}
                    account={account}
                    picked={tagged.has(account.id)}
                    onPick={() => onPick(account)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {onDone && (
        <div className="flex shrink-0 justify-end pt-2.5">
          <button
            type="button"
            onClick={onDone}
            className="flex h-8 items-center rounded-(--r-pill) bg-(--ink)/[0.05] px-4 text-[12.5px] font-medium text-foreground/85 inset-ring-1 inset-ring-(--ink)/[0.10] transition-[background-color,box-shadow,scale] duration-150 hover:bg-(--ink)/[0.08] active:scale-(--press)"
          >
            Done
          </button>
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
      title={picked ? `Remove @${account.handle}` : `Tag @${account.handle}`}
      className={cn(
        "group/mention flex w-full items-center gap-2.5 rounded-(--r-inner) px-2.5 py-2 text-left transition-[background-color,scale] duration-150 active:scale-[0.99]",
        picked ? "bg-violet-500/[0.08]" : "hover:bg-(--ink)/[0.045]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold inset-ring-1 inset-ring-(--ink)/[0.08]",
          avatarTint(account.name),
        )}
      >
        {initials(account.name)}
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-medium">{account.name}</span>
        <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-muted-foreground">
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
          "flex size-[18px] shrink-0 items-center justify-center rounded-(--r-pill) transition-[opacity,scale,background-color] duration-150",
          picked
            ? "scale-100 bg-violet-500 text-white opacity-100"
            : "scale-75 bg-(--ink)/[0.05] text-transparent opacity-0 group-hover/mention:opacity-100 group-hover/mention:text-muted-foreground/40",
        )}
      >
        <Check className="size-3" strokeWidth={3} />
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
