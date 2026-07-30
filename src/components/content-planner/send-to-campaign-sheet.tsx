"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, FileEdit, Plus, Search, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Stagger } from "./session-composer";
import { PostPreview } from "./post-preview";
import { cn } from "@/lib/utils";
import type { Campaign, MediaAsset, Session } from "@/lib/types";

interface SendToCampaignSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaigns: Campaign[];
  session?: Session | null;
  sessions?: Session[];
  alreadySentTo?: string[];
  mediaAssets: MediaAsset[];
  authorName: string;
  initialCampaignIds?: string[];
  onShare: (campaignIds: string[]) => void;
  onNewCampaign?: () => void;
}

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

export function SendToCampaignSheet({
  open,
  onOpenChange,
  campaigns,
  session,
  sessions,
  alreadySentTo = [],
  mediaAssets,
  authorName,
  initialCampaignIds,
  onShare,
  onNewCampaign,
}: SendToCampaignSheetProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<"pick" | "preview">("pick");
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const [now] = useState(() => Date.now());

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const preset = initialCampaignIds ?? [];
      setSelectedIds(preset);
      setSearch("");
      setStep(preset.length > 0 ? "preview" : "pick");
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

  function advance() {
    if (count === 0) return;
    if (step === "pick") {
      setStep("preview");
      return;
    }
    onShare(selectedIds);
    onOpenChange(false);
  }

  const isEmpty = available.length === 0 && already.length === 0;
  const previewing = step === "preview";
  const previewSessions = batch ?? (session ? [session] : []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        side="right"
        initialFocus={bodyRef}
        aria-label="Send to campaigns"
        className="flex !w-[464px] !max-w-[calc(100vw-2rem)] flex-col gap-0 border-0 bg-(--surface-canvas) p-0 text-foreground shadow-(--lift-edge)"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            advance();
          }
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-px [background-image:var(--specular-v)]"
        />

        <div className="flex shrink-0 items-start justify-between gap-3 px-7 pb-4 pt-6">
          <div className="min-w-0">
            {batch ? (
              <div className="mb-2 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="shrink-0 font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/60">
                  Sending
                </span>
                <span className="shrink-0 font-medium text-foreground/85 tabular-nums">
                  {batch.length} posts
                </span>
                <span aria-hidden className="shrink-0 text-muted-foreground/30">
                  ·
                </span>
                <span className="truncate">
                  {batch[0].title} and {batch.length - 1} more
                </span>
              </div>
            ) : session ? (
              <div className="mb-2 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="shrink-0 font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/60">
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
            <h2 className="text-[21px] font-semibold leading-tight tracking-[-0.022em] text-balance">
              {previewing ? "Review before sending" : "Send to campaigns"}
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-snug text-muted-foreground text-pretty">
              {previewing
                ? batch
                  ? "This is how each post will read. They land as drafts, so the campaign can look them over before anything goes live."
                  : "This is how the post will read. It lands as a draft, so the campaign can look it over before it goes live."
                : batch
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

        {showSearch && !previewing && (
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

        <div
          ref={bodyRef}
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-y-auto [background-image:var(--wash-page)] px-6 pb-6 pt-1 outline-none"
        >
          {previewing ? (
            <div className="flex flex-col gap-4">
              <Stagger index={0} className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/60">
                  Going to
                </span>
                {selectedNames.map((name) => (
                  <span
                    key={name}
                    className="inline-flex h-6 max-w-full items-center rounded-(--r-pill) bg-violet-500/[0.12] px-2.5 text-[11.5px] font-medium text-violet-100 inset-ring-1 inset-ring-violet-400/25"
                  >
                    <span className="truncate">{name}</span>
                  </span>
                ))}
              </Stagger>

              {previewSessions.map((item, i) => (
                <Stagger key={item.id} index={i + 1} className="flex flex-col gap-1.5">
                  {batch && (
                    <span className="flex min-w-0 items-center gap-1.5 pl-0.5 text-[11px] text-muted-foreground">
                      <span className="shrink-0 tabular-nums text-muted-foreground/60">
                        {i + 1}/{batch.length}
                      </span>
                      <span className="truncate font-medium text-foreground/80">
                        {item.title}
                      </span>
                      <span aria-hidden className="shrink-0 text-muted-foreground/30">
                        ·
                      </span>
                      <span className="shrink-0">{item.postType}</span>
                    </span>
                  )}
                  <PostPreview
                    session={item}
                    mediaAssets={mediaAssets}
                    authorName={item.lastEditedBy?.name ?? authorName}
                  />
                </Stagger>
              ))}
            </div>
          ) : (
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

            {onNewCampaign && (
              <button
                onClick={() => {
                  onOpenChange(false);
                  onNewCampaign();
                }}
                className="group flex h-12 w-full items-center gap-2 border-t border-(--ink)/[0.06] px-4 text-left text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-(--ink)/[0.035] hover:text-foreground"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-(--r-pill) bg-(--ink)/[0.05] transition-[background-color,color] duration-150 group-hover:bg-violet-500/20 group-hover:text-violet-200">
                  <Plus className="size-3" />
                </span>
                <span className="min-w-0 flex-1 truncate">New campaign</span>
                <span className="shrink-0 text-[11px] text-muted-foreground/60">
                  Opens the editor
                </span>
              </button>
            )}
          </Stagger>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-(--ink)/[0.07] bg-(--sink)/[0.22] px-7 py-4">
          <span
            aria-live="polite"
            className={cn(
              "min-w-0 truncate text-[12px] transition-colors duration-150",
              count > 0 ? "text-foreground/80" : "text-muted-foreground/70",
            )}
          >
            {count === 0
              ? "Nothing selected"
              : previewing
                ? "Lands as a draft"
                : count === 1
                  ? selectedNames[0]
                  : `${selectedNames[0]} +${count - 1}`}
          </span>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => (previewing ? setStep("pick") : onOpenChange(false))}
              className="flex h-9 items-center gap-1.5 rounded-(--r-pill) px-3.5 text-[13px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
            >
              {previewing && <ArrowLeft className="size-3.5" />}
              {previewing ? "Back" : "Cancel"}
            </button>
            <button
              disabled={count === 0}
              onClick={advance}
              title={previewing ? "Add as draft (⌘↵)" : "Review the post (⌘↵)"}
              className="flex h-9 items-center gap-1.5 rounded-(--r-pill) bg-violet-600 px-4 text-[13px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,box-shadow,scale] duration-200 hover:bg-violet-500 active:scale-(--press) disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
            >
              {previewing ? (
                <>
                  <FileEdit className="size-3.5" />
                  {count > 1 ? `Add as draft to ${count}` : "Add as draft"}
                </>
              ) : (
                <>
                  Review
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-y border-(--ink)/[0.06] bg-(--surface-panel) px-4 py-1.5 text-[10px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/70">
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
          <span className="shrink-0 rounded-(--r-inner) bg-(--ink)/[0.06] px-1.5 py-px text-[9.5px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.06em] text-muted-foreground/85">
            {campaign.tag}
          </span>
        </span>
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
