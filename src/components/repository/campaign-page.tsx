"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calculator,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileEdit,
  Minus,
  MonitorPlay,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Rocket,
  Send,
  Share2,
  Trash2,
} from "lucide-react";
import { SessionsTable } from "@/components/content-planner/sessions-table";
import { PostPreview } from "@/components/content-planner/post-preview";
import { CampaignStatsRow } from "@/components/campaigns/campaign-stats-row";
import { RoiSheet } from "@/components/repository/roi-sheet";
import { ScreenSetupSheet } from "@/components/repository/screen-setup-sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PRIMARY_ACTION_MD as PRIMARY_ACTION,
  SECONDARY_ACTION_MD,
} from "@/lib/button-styles";
import {
  CAMPAIGN_STATE,
  campaignDrafts,
  campaignState,
  campaignSubmitted,
  endsLabel,
  platformsOf,
} from "@/lib/campaigns";
import { platformMeta } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import type { Campaign, MediaAsset, Session } from "@/lib/types";

interface CampaignPageProps {
  campaign: Campaign;
  campaigns: Campaign[];
  sessions: Session[];
  mediaAssets: MediaAsset[];
  authorName: string;
  selectedSessionId: string | null;
  onBack: () => void;
  onSelectSession: (id: string) => void;
  onOpenSend: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onUnlockSession: (id: string) => void;
  onDuplicateSession: (id: string) => void;
  onSubmit: (sessionIds: string[]) => void;
  onWithdraw: (sessionId: string) => void;
  onGoLive: () => void;
  onEdit: () => void;
  onAddPost: () => void;
}

export function CampaignPage({
  campaign,
  campaigns,
  sessions,
  mediaAssets,
  authorName,
  selectedSessionId,
  onBack,
  onSelectSession,
  onOpenSend,
  onDeleteSession,
  onUnlockSession,
  onDuplicateSession,
  onSubmit,
  onWithdraw,
  onGoLive,
  onEdit,
  onAddPost,
}: CampaignPageProps) {
  const drafts = useMemo(
    () => campaignDrafts(sessions, campaign.id),
    [sessions, campaign.id],
  );
  const submitted = useMemo(
    () => campaignSubmitted(sessions, campaign),
    [sessions, campaign],
  );

  const [picked, setPicked] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [now] = useState(() => Date.now());
  const [roiOpen, setRoiOpen] = useState(false);
  const [screenOpen, setScreenOpen] = useState(false);

  const state = campaignState(campaign, now);
  const tone = CAMPAIGN_STATE[state];
  const ends = endsLabel(campaign.endDate, now);
  const readyToGoLive = state === "draft" && submitted.length > 0;

  // One violet button at a time; sharing needs a public page to point at.
  const addPostIsPrimary =
    drafts.length === 0 && state !== "ended" && !readyToGoLive;
  const shareable = state === "live" || state === "ended";

  const live = drafts.filter((d) => picked.includes(d.id));
  const allPicked = drafts.length > 0 && live.length === drafts.length;
  const submitting = live.length ? live : drafts;

  function toggle(id: string) {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function submit() {
    if (submitting.length === 0) return;
    onSubmit(submitting.map((s) => s.id));
    setPicked([]);
    setExpanded([]);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col px-6 pb-6">
        <div className="shrink-0 pt-6">
          <button
            onClick={onBack}
            className="-ml-2 flex h-7 items-center gap-1.5 rounded-(--r-pill) px-2 text-[12px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
          >
            <ArrowLeft className="size-3.5" />
            Campaigns
          </button>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-3 pb-6">
            <div className="min-w-0">
              <h1 className="flex min-w-0 flex-wrap items-center gap-2.5 text-[28px] font-semibold leading-tight tracking-[-0.025em] text-balance">
                {campaign.name}
                <span
                  className={cn(
                    "flex h-[22px] shrink-0 items-center gap-1.5 rounded-(--r-pill) px-2.5 text-[11px] font-medium inset-ring-1",
                    tone.chip,
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("size-1.5 rounded-(--r-round)", tone.dot)}
                  />
                  {tone.label}
                </span>
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                <span className="rounded-(--r-inner) bg-(--ink)/[0.06] px-1.5 py-px text-[9.5px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.06em] text-muted-foreground/85">
                  {campaign.tag}
                </span>
                <span className="tabular-nums">
                  {submitted.length} {submitted.length === 1 ? "post" : "posts"}
                </span>
                <span className="text-muted-foreground/30">&middot;</span>
                <span>{ends.date}</span>
                {ends.soon && (
                  <>
                    <span className="text-muted-foreground/30">&middot;</span>
                    <span className="text-amber-300/80">{ends.soon}</span>
                  </>
                )}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {platformsOf(campaign).map((id) => {
                  const meta = platformMeta(id);
                  return (
                    <span
                      key={id}
                      className={cn(
                        "flex h-[22px] items-center gap-1.5 rounded-(--r-pill) px-2 text-[10.5px] font-medium inset-ring-1",
                        meta.tint,
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn("size-1 rounded-(--r-round)", meta.dot)}
                      />
                      {meta.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              {state === "live" && <LiveLinkChip campaign={campaign} />}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onAddPost}
                  title="Write a new post for this campaign"
                  className={addPostIsPrimary ? PRIMARY_ACTION : SECONDARY_ACTION_MD}
                >
                  <PlusCircle className="size-4" />
                  Add post
                </button>
                {shareable && <ShareCampaignButton campaign={campaign} />}
                {drafts.length > 0 && (
                  <button
                    onClick={submit}
                    className={cn(
                      "flex h-9 items-center gap-1.5 rounded-(--r-pill) px-4 text-[13px] font-medium transition-[background-color,box-shadow,scale] duration-150 active:scale-(--press)",
                      readyToGoLive
                        ? "bg-(--ink)/[0.04] text-foreground inset-ring-1 inset-ring-(--ink)/[0.12] hover:bg-(--ink)/[0.07]"
                        : "bg-violet-600 text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 hover:bg-violet-500",
                    )}
                  >
                    <Send className="size-3.5" />
                    {live.length
                      ? `Submit ${live.length}`
                      : `Submit all ${drafts.length}`}
                  </button>
                )}
                {state === "draft" && (
                  <button
                    onClick={onGoLive}
                    disabled={!readyToGoLive}
                    title={
                      readyToGoLive
                        ? "Put this campaign live on Wozku"
                        : "Submit a post first, a campaign cannot go live empty"
                    }
                    className={PRIMARY_ACTION}
                  >
                    <Rocket className="size-3.5" />
                    Take it live
                  </button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label="More campaign actions"
                    title="More campaign actions"
                    className="flex size-9 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-auto min-w-[190px]">
                    <DropdownMenuItem onClick={onEdit} className="whitespace-nowrap">
                      <Pencil className="size-3.5" />
                      Edit page
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setRoiOpen(true)}
                      className="whitespace-nowrap"
                    >
                      <Calculator className="size-3.5" />
                      Calculate ROI
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setScreenOpen(true)}
                      className="whitespace-nowrap"
                    >
                      <MonitorPlay className="size-3.5" />
                      Screen Setup
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {state === "draft" && (
            <div
              className={cn(
                "mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-(--r-float) px-4 py-3 text-[12.5px] inset-ring-1",
                readyToGoLive
                  ? "bg-live-500/[0.06] text-live-100/90 inset-ring-live-400/25"
                  : "bg-amber-500/[0.05] text-amber-100/85 inset-ring-amber-400/20",
              )}
            >
              {readyToGoLive ? (
                <>
                  <Rocket className="size-3.5 shrink-0 text-live-300" />
                  <span className="min-w-0 flex-1 text-pretty">
                    This campaign has everything it needs. Take it live and its posts can
                    go out to{" "}
                    {platformsOf(campaign).map((id) => platformMeta(id).label).join(", ")}.
                  </span>
                </>
              ) : (
                <>
                  <FileEdit className="size-3.5 shrink-0 text-amber-300" />
                  <span className="min-w-0 flex-1 text-pretty">
                    {drafts.length > 0
                      ? "Submit a post below and this campaign is ready to go live."
                      : "No posts yet. Send one from the repository, then submit it here to take the campaign live."}
                  </span>
                </>
              )}
            </div>
          )}

          {submitted.length > 0 && (
            <CampaignStatsRow campaignId={campaign.id} className="mb-6 shrink-0" />
          )}
        </div>

        {drafts.length > 0 && (
          <section className="mb-6 flex min-h-0 shrink-0 flex-col">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <button
                  role="checkbox"
                  aria-checked={allPicked ? true : live.length ? "mixed" : false}
                  onClick={() =>
                    setPicked(allPicked ? [] : drafts.map((d) => d.id))
                  }
                  className="group/box -m-1 flex items-center gap-2 p-1 text-[12px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
                >
                  <Box checked={allPicked} indeterminate={!allPicked && live.length > 0} />
                  Select all
                </button>
                <span className="text-muted-foreground/30">&middot;</span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.09em] text-amber-300/90">
                  <FileEdit className="size-3" />
                  Staged, not submitted
                  <span className="tabular-nums text-amber-300/60">
                    {drafts.length}
                  </span>
                </span>
              </span>
              <span className="text-[11.5px] text-muted-foreground/70 text-pretty">
                Staged means sent here but not yet part of the campaign. Submit a post
                to add it, then take the campaign live.
              </span>
            </div>

            <ScrollFade className="max-h-[min(40vh,460px)]">
              <div className="flex flex-col gap-2 pb-0.5">
              {drafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  session={draft}
                  mediaAssets={mediaAssets}
                  authorName={authorName}
                  picked={picked.includes(draft.id)}
                  open={expanded.includes(draft.id)}
                  onToggle={() => toggle(draft.id)}
                  onToggleOpen={() =>
                    setExpanded((prev) =>
                      prev.includes(draft.id)
                        ? prev.filter((x) => x !== draft.id)
                        : [...prev, draft.id],
                    )
                  }
                  onOpen={() => onSelectSession(draft.id)}
                  onSubmit={() => onSubmit([draft.id])}
                  onWithdraw={() => onWithdraw(draft.id)}
                />
              ))}
              </div>
            </ScrollFade>
          </section>
        )}

        <div className="mb-3 flex shrink-0 items-center gap-2">
          <span className="text-[11px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/70">
            In the campaign
          </span>
          {submitted.length > 0 && (
            <span className="text-[11px] tabular-nums text-muted-foreground/50">
              {submitted.length}
            </span>
          )}
        </div>

        <SessionsTable
          variant="canvas"
          pageSize={15}
          sessions={submitted}
          campaigns={campaigns}
          selectedSessionId={selectedSessionId}
          onSelectSession={onSelectSession}
          onOpenSend={onOpenSend}
          onViewPublic={(id) => window.open(`/p/${id}`, "_blank", "noopener,noreferrer")}
          onDeleteSession={onDeleteSession}
          onUnlockSession={onUnlockSession}
          onDuplicateSession={onDuplicateSession}
          actionsFade={false}
          emptyState={{
            title: "Nothing submitted yet",
            description: drafts.length
              ? "Submit the posts above and they will show up here."
              : "Posts you send to this campaign land here once they are submitted.",
          }}
        />
      </div>

      <RoiSheet open={roiOpen} onOpenChange={setRoiOpen} campaign={campaign} />
      <ScreenSetupSheet
        open={screenOpen}
        onOpenChange={setScreenOpen}
        campaign={campaign}
      />
    </div>
  );
}

function ShareCampaignButton({ campaign }: { campaign: Campaign }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/c/${campaign.id}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: campaign.name, url });
        return;
      } catch {
        // Dismissed the share sheet, or it failed — fall through to copying.
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      title="Share this campaign's public page"
      className={SECONDARY_ACTION_MD}
    >
      {copied ? (
        <Check className="size-3.5 text-live-300" />
      ) : (
        <Share2 className="size-3.5" />
      )}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

function LiveLinkChip({ campaign }: { campaign: Campaign }) {
  const [copied, setCopied] = useState(false);
  const path = `/c/${campaign.id}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}${path}`;

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-fit min-w-[300px] max-w-[460px] rounded-(--r-surface) bg-live-500/[0.06] p-3 shadow-(--lift-sm) inset-ring-1 inset-ring-live-400/25">
      <span className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-live-300">
        <Rocket className="size-3" />
        Campaign is live
      </span>
      <div className="flex items-center gap-1.5">
        <span
          title={url}
          className="min-w-0 flex-1 truncate rounded-(--r-inner) bg-(--ink)/[0.15] px-2.5 py-1.5 text-[12px] text-foreground/85"
        >
          {url}
        </span>
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          title="Open the public page"
          className="flex size-7 shrink-0 items-center justify-center rounded-(--r-pill) text-foreground/70 transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.14] hover:text-foreground"
        >
          <ExternalLink className="size-3.5" />
        </a>
        <button
          onClick={handleCopy}
          title="Copy link"
          className="flex size-7 shrink-0 items-center justify-center rounded-(--r-pill) text-foreground/70 transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.14] hover:text-foreground"
        >
          {copied ? <Check className="size-3.5 text-live-300" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

function ScrollFade({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [atTop, setAtTop] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const read = useCallback((el: HTMLElement) => {
    setAtTop(el.scrollTop <= 2);
    setAtEnd(el.scrollHeight - el.scrollTop - el.clientHeight <= 1);
  }, []);

  const attach = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      read(el);
      const observer = new ResizeObserver(() => read(el));
      observer.observe(el);
      for (const child of Array.from(el.children)) observer.observe(child);
      return () => observer.disconnect();
    },
    [read],
  );

  return (
    <div className="relative min-h-0">
      <div
        ref={attach}
        onScroll={(e) => read(e.currentTarget)}
        className={cn("overflow-y-auto overscroll-contain", className)}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-(--surface-canvas) via-(--surface-canvas)/60 to-transparent transition-opacity duration-300",
          atTop ? "opacity-0" : "opacity-100",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-(--surface-canvas) via-(--surface-canvas)/60 to-transparent transition-opacity duration-300",
          atEnd ? "opacity-0" : "opacity-100",
        )}
      />
    </div>
  );
}

function DraftCard({
  session,
  mediaAssets,
  authorName,
  picked,
  open,
  onToggle,
  onToggleOpen,
  onOpen,
  onSubmit,
  onWithdraw,
}: {
  session: Session;
  mediaAssets: MediaAsset[];
  authorName: string;
  picked: boolean;
  open: boolean;
  onToggle: () => void;
  onToggleOpen: () => void;
  onOpen: () => void;
  onSubmit: () => void;
  onWithdraw: () => void;
}) {
  const words = session.copy.trim() ? session.copy.trim().split(/\s+/).length : 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-(--r-surface) bg-(--surface-raised) transition-[box-shadow,background-color] duration-200 inset-ring-1",
        picked
          ? "bg-violet-500/[0.045] shadow-(--lift-md) inset-ring-violet-400/35"
          : "shadow-(--lift-sm) inset-ring-(--ink)/[0.07]",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <button
          role="checkbox"
          aria-checked={picked}
          aria-label={`Select ${session.title}`}
          onClick={onToggle}
          className="group/box -m-1 flex shrink-0 items-center p-1"
        >
          <Box checked={picked} />
        </button>

        <button
          onClick={onToggleOpen}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-medium">
              {session.title || "Untitled content"}
            </span>
            <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="shrink-0">{session.postType}</span>
              <span aria-hidden className="shrink-0 text-muted-foreground/30">
                ·
              </span>
              <span className="shrink-0 tabular-nums">
                {words} {words === 1 ? "word" : "words"}
              </span>
              {session.visualAssetIds.length > 0 && (
                <>
                  <span aria-hidden className="shrink-0 text-muted-foreground/30">
                    ·
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {session.visualAssetIds.length}{" "}
                    {session.visualAssetIds.length === 1 ? "asset" : "assets"}
                  </span>
                </>
              )}
            </span>
          </span>
        </button>

        <span className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={onOpen}
            className="flex h-7 items-center rounded-(--r-pill) px-2.5 text-[11.5px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.07] hover:text-foreground active:scale-(--press)"
          >
            Edit
          </button>
          <button
            onClick={onWithdraw}
            title="Take this post back out of the campaign"
            className="flex size-7 items-center justify-center rounded-(--r-pill) text-muted-foreground/70 transition-[background-color,color,scale] duration-150 hover:bg-destructive/15 hover:text-destructive active:scale-(--press)"
          >
            <Trash2 className="size-3.5" />
          </button>
          <button
            onClick={onSubmit}
            className="flex h-7 items-center gap-1.5 rounded-(--r-pill) bg-violet-500/15 px-2.5 text-[11.5px] font-medium text-violet-100 transition-[background-color,scale] duration-150 hover:bg-violet-500/25 active:scale-(--press)"
          >
            <Send className="size-3" />
            Submit
          </button>
        </span>
      </div>

      {open && (
        <div className="border-t border-(--ink)/[0.06] bg-(--ink)/[0.015] px-4 py-4">
          <PostPreview
            session={session}
            mediaAssets={mediaAssets}
            authorName={session.lastEditedBy?.name ?? authorName}
            className="mx-auto max-w-[440px]"
          />
        </div>
      )}
    </div>
  );
}

function Box({
  checked,
  indeterminate,
}: {
  checked: boolean;
  indeterminate?: boolean;
}) {
  const on = checked || Boolean(indeterminate);
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-[16px] shrink-0 items-center justify-center rounded-[4px] transition-[background-color,box-shadow] duration-150",
        on
          ? "bg-violet-500 text-white inset-ring-1 inset-ring-violet-400"
          : "inset-ring-1 inset-ring-(--ink)/[0.18] group-hover/box:inset-ring-(--ink)/40",
      )}
    >
      {indeterminate ? (
        <Minus className="size-2.5" strokeWidth={3} />
      ) : (
        <Check
          className={cn(
            "size-2.5 transition-[scale,opacity] duration-150",
            checked ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
          strokeWidth={3}
        />
      )}
    </span>
  );
}
