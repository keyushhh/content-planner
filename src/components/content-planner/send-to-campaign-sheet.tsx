"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Plus, Search, Send, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Stagger } from "./session-composer";
import { cn } from "@/lib/utils";
import type { Campaign, Session } from "@/lib/types";

interface SendToCampaignSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaigns: Campaign[];
  /** What is being sent, so the sheet can name it rather than imply it. */
  session?: Session | null;
  /** A batch, when more than one post is going at once. Named as a count with
   *  the first title, because fifteen titles is a list nobody reads. */
  sessions?: Session[];
  /** Campaigns this post already lives in — offered as state, not as targets. */
  alreadySentTo?: string[];
  onShare: (campaignIds: string[]) => void;
  allowCreateCampaign?: boolean;
  onCreateCampaign?: (name: string) => string;
}

/**
 * "Ends 4 Aug", plus a countdown only while it is close.
 *
 * "in 50 days" is not urgency, it is arithmetic nobody asked for, and printing
 * it on every row makes the one campaign that closes this week look no different
 * from the one that closes next quarter. Under a fortnight it earns the tail.
 */
function endsLabel(endDate: string, now: number) {
  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) return { date: "No end date", soon: null };
  const date = parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const days = Math.ceil((parsed.getTime() - now) / 86400000);
  if (days < 0) return { date: `Ended ${date}`, soon: null };
  if (days === 0) return { date: `Ends ${date}`, soon: "today" };
  if (days === 1) return { date: `Ends ${date}`, soon: "tomorrow" };
  if (days <= 14) return { date: `Ends ${date}`, soon: `${days} days left` };
  return { date: `Ends ${date}`, soon: null };
}

/**
 * Send to campaigns.
 *
 * Built in the Canvas idiom, which is one elevated sheet of hairline-divided
 * rows on a washed ground — the same material as the content table, so the two
 * read as the same product. The version before this was a stack of individually
 * outlined pills floating on flat black: every row its own card, every card the
 * same weight, and a grey icon well repeated down the list. Three identical
 * decorations is not a system, it is noise, so the wells are gone and the rows
 * carry type alone.
 *
 * Multi-select, because one post feeding several campaigns is the entire point
 * of a repository. Campaigns it already lives in sit under their own heading
 * INSIDE the same sheet: they are context, not destinations.
 */
export function SendToCampaignSheet({
  open,
  onOpenChange,
  campaigns,
  session,
  sessions,
  alreadySentTo = [],
  onShare,
  allowCreateCampaign,
  onCreateCampaign,
}: SendToCampaignSheetProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [search, setSearch] = useState("");
  // Focus lands here on open. Left to itself the sheet focused the close button,
  // which then wore a focus ring — the first thing you saw was Dismiss, ringed.
  const bodyRef = useRef<HTMLDivElement | null>(null);

  // Read once, at mount, not on every render: the countdowns are day-resolution,
  // so re-reading the clock per keystroke would only make a stable number look
  // unstable. Lazy initialiser keeps it out of the render path.
  const [now] = useState(() => Date.now());

  // Reset on the way IN, not out: closing runs while the sheet is still
  // animating away, so clearing there makes the footer count tick to zero on
  // screen. Adjusted during render rather than in an effect — an effect would
  // paint the last selection for one frame first.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelectedIds([]);
      setCreating(false);
      setNewName("");
      setSearch("");
    }
  }

  const q = search.trim().toLowerCase();

  const { available, already } = useMemo(() => {
    const matched = q
      ? campaigns.filter((c) => c.name.toLowerCase().includes(q))
      : campaigns;
    return {
      available: matched.filter((c) => !alreadySentTo.includes(c.id)),
      already: matched.filter((c) => alreadySentTo.includes(c.id)),
    };
  }, [campaigns, q, alreadySentTo]);

  /** A batch of two or more; one post is just the single-post flow. */
  const batch = sessions && sessions.length > 1 ? sessions : null;
  const showSearch = campaigns.length > 6;
  const count = selectedIds.length;
  const selectedNames = campaigns
    .filter((c) => selectedIds.includes(c.id))
    .map((c) => c.name);

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function commitNewCampaign() {
    const name = newName.trim();
    if (!name || !onCreateCampaign) return;
    const id = onCreateCampaign(name);
    setSelectedIds((prev) => [...prev, id]);
    setCreating(false);
    setNewName("");
    setSearch("");
  }

  function send() {
    if (count === 0) return;
    onShare(selectedIds);
    onOpenChange(false);
  }

  const canCreate = Boolean(allowCreateCampaign && onCreateCampaign);
  const isEmpty = available.length === 0 && already.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        side="right"
        initialFocus={bodyRef}
        aria-label="Send to campaigns"
        // `!` throughout: the base sheet hard-codes a 3/4-viewport width and a
        // 384px cap for the right side, both variant-prefixed, so nothing but an
        // important wins against them.
        className="flex !w-[464px] !max-w-[calc(100vw-2rem)] flex-col gap-0 border-0 bg-(--surface-canvas) p-0 text-foreground shadow-(--lift-edge)"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            send();
          }
        }}
      >
        {/* Lit rim. On a right-hand sheet the light catches the left edge, the
            same way the canvas sheets catch it along the top. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-px [background-image:var(--specular-v)]"
        />

        <div className="flex shrink-0 items-start justify-between gap-3 px-7 pb-4 pt-6">
          <div className="min-w-0">
            {/* Provenance line, not a card. As an outlined pill it looked
                selectable — a fourth row you could not tick. */}
            {batch ? (
              <div className="mb-2 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="shrink-0 uppercase tracking-[0.09em] text-muted-foreground/60">
                  Sending
                </span>
                <span className="shrink-0 font-medium text-foreground/85 tabular-nums">
                  {batch.length} posts
                </span>
                <span aria-hidden className="shrink-0 text-muted-foreground/30">
                  ·
                </span>
                {/* One title carries the batch: it is the row you were looking at
                    when you ticked, so it tells you the selection is the one you
                    meant without printing a list you would have to read. */}
                <span className="truncate">
                  {batch[0].title} and {batch.length - 1} more
                </span>
              </div>
            ) : session ? (
              <div className="mb-2 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="shrink-0 uppercase tracking-[0.09em] text-muted-foreground/60">
                  Sending
                </span>
                <span className="truncate font-medium text-foreground/85">
                  {session.title}
                </span>
                <span aria-hidden className="shrink-0 text-muted-foreground/30">
                  ·
                </span>
                <span className="shrink-0">{session.postType}</span>
              </div>
            ) : null}
            <h2 className="text-[21px] font-semibold leading-tight tracking-[-0.022em]">
              Send to campaigns
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-snug text-muted-foreground text-pretty">
              {batch
                ? "Every post goes to every campaign you pick. Nothing is removed from where it already is."
                : "Pick as many as you need. Nothing is removed from where it already is."}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="-mr-2 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-(--r-pill) text-muted-foreground outline-none transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground focus-visible:inset-ring-2 focus-visible:inset-ring-violet-400/60 active:scale-(--press)"
          >
            <X className="size-4" />
          </button>
        </div>

        {showSearch && (
          <div className="shrink-0 px-7 pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search campaigns…"
                aria-label="Search campaigns"
                className="h-9 w-full rounded-(--r-pill) bg-(--ink)/[0.035] pl-8 pr-8 text-[13px] caret-violet-400 inset-ring-1 inset-ring-(--ink)/[0.08] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted-foreground/75 focus:bg-(--ink)/[0.06] focus:inset-ring-violet-400/50"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-colors hover:bg-(--ink)/[0.08] hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Washed ground. The sheet below floats on it, which is what makes the
            surrounding space read as margin rather than as a gap. */}
        <div
          ref={bodyRef}
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-y-auto [background-image:var(--wash-page)] px-6 pb-6 pt-1 outline-none"
        >
          {/* ONE elevated sheet, rows divided by hairlines — the sessions-table
              material. `items-start` equivalent: no flex-1, so it sizes to its
              content instead of stretching into a lake of empty surface. */}
          <Stagger
            index={0}
            className="overflow-hidden rounded-(--r-surface) bg-(--surface-raised) shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.08]"
          >
            <div
              aria-hidden
              className="h-px w-full shrink-0 [background-image:var(--specular)]"
            />

            {isEmpty ? (
              <p className="px-5 py-10 text-center text-[13px] text-muted-foreground text-pretty">
                {q
                  ? `No campaign matches “${search.trim()}”.`
                  : "There are no campaigns yet."}
              </p>
            ) : (
              <>
                {available.map((campaign) => (
                  <CampaignRow
                    key={campaign.id}
                    campaign={campaign}
                    now={now}
                    selected={selectedIds.includes(campaign.id)}
                    onToggle={() => toggle(campaign.id)}
                  />
                ))}

                {already.length > 0 && (
                  <>
                    <GroupHeading>Already in</GroupHeading>
                    {already.map((campaign) => (
                      <SentRow key={campaign.id} campaign={campaign} now={now} />
                    ))}
                  </>
                )}
              </>
            )}

            {/* Creating a campaign belongs to the list, so it lives in the sheet
                — but as its own quiet last row, not as a fourth thing that looks
                pickable. */}
            {canCreate &&
              (creating ? (
                <div className="border-t border-(--ink)/[0.06] bg-violet-500/[0.05] px-4 py-3">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New campaign name…"
                    aria-label="New campaign name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitNewCampaign();
                      } else if (e.key === "Escape") {
                        e.stopPropagation();
                        setCreating(false);
                        setNewName("");
                      }
                    }}
                    className="h-9 w-full rounded-(--r-inner) bg-(--ink)/[0.05] px-3 text-[13px] caret-violet-400 inset-ring-1 inset-ring-(--ink)/[0.10] outline-none placeholder:text-muted-foreground/75 focus:inset-ring-violet-400/50"
                  />
                  <div className="mt-2 flex justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setCreating(false);
                        setNewName("");
                      }}
                      className="flex h-8 items-center rounded-(--r-pill) px-3 text-xs font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!newName.trim()}
                      onClick={commitNewCampaign}
                      className="flex h-8 items-center gap-1.5 rounded-(--r-pill) bg-violet-600 px-3 text-xs font-medium text-white inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-(--press) disabled:pointer-events-none disabled:opacity-40"
                    >
                      <Plus className="size-3.5" />
                      Create &amp; select
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="flex h-12 w-full items-center gap-2 border-t border-(--ink)/[0.06] px-4 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-(--ink)/[0.035] hover:text-foreground"
                >
                  <Plus className="size-4 shrink-0 text-muted-foreground/70" />
                  New campaign
                </button>
              ))}
          </Stagger>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-(--ink)/[0.07] bg-(--sink)/[0.22] px-7 py-4">
          {/* Names, not a bare number: "2 selected" makes you scroll back up to
              check which two. */}
          <span
            aria-live="polite"
            className={cn(
              "min-w-0 truncate text-[12px] transition-colors duration-150",
              count > 0 ? "text-foreground/80" : "text-muted-foreground/70",
            )}
          >
            {count === 0
              ? "Nothing selected"
              : count === 1
                ? selectedNames[0]
                : `${selectedNames[0]} +${count - 1}`}
          </span>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-9 items-center rounded-(--r-pill) px-3.5 text-[13px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
            >
              Cancel
            </button>
            <button
              disabled={count === 0}
              onClick={send}
              title="Send (⌘↵)"
              className="flex h-9 items-center gap-1.5 rounded-(--r-pill) bg-violet-600 px-4 text-[13px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,box-shadow,scale] duration-200 hover:bg-violet-500 active:scale-(--press) disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
            >
              <Send className="size-3.5" />
              {count > 1 ? `Send to ${count}` : "Send"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** A band inside the sheet, darker than the rows, so it reads as structure. */
function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-y border-(--ink)/[0.06] bg-(--surface-panel) px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground/70">
      {children}
    </div>
  );
}

function CampaignRow({
  campaign,
  now,
  selected,
  onToggle,
}: {
  campaign: Campaign;
  now: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const ends = endsLabel(campaign.endDate, now);

  return (
    <button
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        // Fixed height is what makes a run of rows read as a rhythm rather than
        // as a stack of separate objects.
        "group relative flex h-[62px] w-full items-center gap-3 border-b border-(--ink)/[0.05] px-4 text-left transition-colors duration-150 last:border-b-0",
        selected
          ? "bg-violet-500/[0.10]"
          : "hover:bg-(--ink)/[0.035]",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "truncate text-[13.5px] font-medium transition-colors duration-150",
              selected ? "text-foreground" : "text-foreground/85 group-hover:text-foreground",
            )}
          >
            {campaign.name}
          </span>
          <span className="shrink-0 rounded-(--r-inner) bg-(--ink)/[0.06] px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/85">
            {campaign.tag}
          </span>
        </span>
        {/* Tags-as-quiet-text, the same reading the table row uses for its
            second line — no second chip treatment competing with the first. */}
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground/70">
          <span className="shrink-0 tabular-nums">
            {campaign.sessionIds.length}{" "}
            {campaign.sessionIds.length === 1 ? "item" : "items"}
          </span>
          <span aria-hidden className="size-1 shrink-0 rounded-(--r-round) bg-current opacity-40" />
          <span className="truncate">{ends.date}</span>
          {ends.soon && (
            <>
              <span
                aria-hidden
                className="size-1 shrink-0 rounded-(--r-round) bg-current opacity-40"
              />
              <span className="shrink-0 text-amber-300/80">{ends.soon}</span>
            </>
          )}
        </span>
      </span>

      {/* A square, not a radio: the shape is the only cue that more than one
          answer is allowed. */}
      <span
        className={cn(
          "flex size-[19px] shrink-0 items-center justify-center rounded-(--r-inner) transition-[background-color,box-shadow] duration-150 inset-ring-1",
          selected
            ? "bg-violet-500 text-white inset-ring-violet-400"
            : "bg-transparent inset-ring-(--ink)/[0.18] group-hover:inset-ring-(--ink)/35",
        )}
      >
        <Check
          className={cn(
            "size-3 transition-[opacity,scale] duration-150",
            selected ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
        />
      </span>
    </button>
  );
}

/** A campaign the post is already in — present for orientation, not for picking. */
function SentRow({ campaign, now }: { campaign: Campaign; now: number }) {
  const ends = endsLabel(campaign.endDate, now);
  return (
    <div className="flex h-[54px] items-center gap-3 border-b border-(--ink)/[0.05] px-4 last:border-b-0">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-muted-foreground">
          {campaign.name}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground/60">
          {ends.date}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-emerald-300/80">
        <Check className="size-3.5" />
        Sent
      </span>
    </div>
  );
}
