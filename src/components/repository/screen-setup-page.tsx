"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  Link2,
  Megaphone,
  MonitorPlay,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  QrCode,
} from "lucide-react";
import { QrGlyph } from "@/components/public/qr-glyph";
import { ScreenPreview, type PreviewSurface } from "@/components/repository/screen-preview";
import { SetupSection, type SetupSectionId } from "@/components/repository/setup-section";
import { ContestPanel } from "@/components/repository/contest-panel";
import { ThemePanel } from "@/components/repository/theme-panel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Hint } from "@/components/ui/tooltip";
import { SECONDARY_ACTION_MD } from "@/lib/button-styles";
import {
  CAMPAIGN_STATE,
  campaignState,
  isHiddenOnScreen,
  screenPosts,
} from "@/lib/campaigns";
import { MOMENTS, type MomentId, type ScreenTheme } from "@/lib/screen-theme";
import type { ContestSettings } from "@/lib/contest";
import { cn } from "@/lib/utils";
import type { Campaign, MediaAsset, Session } from "@/lib/types";

interface ScreenSetupPageProps {
  campaign: Campaign;
  sessions: Session[];
  mediaAssets: MediaAsset[];
  onThemeChange: (patch: Partial<ScreenTheme>) => void;
  onContestChange: (patch: Partial<ContestSettings>) => void;
  onBack: () => void;
  onOpenCampaign: () => void;
  onToggleVisibility: (sessionId: string) => void;
  onMove: (sessionId: string, direction: -1 | 1) => void;
  onReorder: (sessionId: string, toIndex: number) => void;
  onAddPost: () => void;
  onSelectSession: (sessionId: string) => void;
  onWithdraw: (sessionId: string) => void;
}

export function ScreenSetupPage({
  campaign,
  sessions,
  mediaAssets,
  onThemeChange,
  onContestChange,
  onBack,
  onOpenCampaign,
  onToggleVisibility,
  onMove,
  onReorder,
  onAddPost,
  onSelectSession,
  onWithdraw,
}: ScreenSetupPageProps) {
  const [now] = useState(() => Date.now());
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [surface, setSurface] = useState<PreviewSurface>("page");
  const [openSection, setOpenSection] = useState<SetupSectionId | null>("posts");
  const [moment, setMoment] = useState<MomentId | null>(null);

  const state = campaignState(campaign, now);
  const tone = CAMPAIGN_STATE[state];

  const ordered = useMemo(() => screenPosts(sessions, campaign), [sessions, campaign]);
  const visible = ordered.filter((s) => !isHiddenOnScreen(campaign, s.id));

  const path = `/c/${campaign.id}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}${path}`;
  /* A draft has no audience yet, so the link is a preview rather than something to hand out. */
  const isPublic = state === "live" || state === "ended";

  function selectMoment(id: MomentId | null) {
    setMoment(id);
    if (id) setSurface("screen");
  }

  function toggleSection(id: SetupSectionId) {
    setOpenSection((current) => (current === id ? null : id));
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const to = ordered.findIndex((s) => s.id === targetId);
    if (to !== -1) onReorder(dragId, to);
    setDragId(null);
    setOverId(null);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col overflow-y-auto px-6 pb-6 lg:overflow-hidden">
        <div className="shrink-0 pt-6">
          <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]">
            <button
              onClick={onBack}
              className="-ml-1.5 flex h-6 items-center gap-1.5 rounded-(--r-pill) px-1.5 font-medium text-muted-foreground transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground"
            >
              <Megaphone className="size-3.5" />
              Campaigns
            </button>
            <span className="text-muted-foreground/40">/</span>
            <button
              onClick={onOpenCampaign}
              className="rounded-(--r-pill) px-1 font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {campaign.name}
            </button>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-semibold text-violet-300">Screen Setup</span>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-5">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2">
              <h1 className="min-w-0 text-[26px] font-semibold leading-tight tracking-[-0.025em] text-balance">
                Screen Setup
              </h1>
              <Hint label={tone.meaning}>
                <span
                  className={cn(
                    "flex h-[22px] shrink-0 items-center gap-1.5 rounded-(--r-pill) px-2.5 text-[11px] font-medium inset-ring-1",
                    tone.chip,
                  )}
                >
                  <span aria-hidden className={cn("size-1.5 rounded-(--r-round)", tone.dot)} />
                  {tone.label}
                </span>
              </Hint>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button onClick={onAddPost} className={SECONDARY_ACTION_MD}>
                <PlusCircle className="size-4" />
                Add post
              </button>
              <a
                href={path}
                target="_blank"
                rel="noopener noreferrer"
                className={SECONDARY_ACTION_MD}
              >
                <ExternalLink className="size-3.5" />
                Open page
              </a>
            </div>
          </div>

          <p className="-mt-2 mb-5 max-w-[62ch] text-[12.5px] leading-snug text-muted-foreground text-pretty">
            This is what visitors see when they open the campaign: which posts appear, in
            what order, and how the page looks. Changes take effect straight away, whether
            the campaign is still a draft or already running.
          </p>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div className="min-w-0 lg:self-start">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/70">
                Preview
              </span>
              <div className="flex w-fit items-center gap-0.5 rounded-(--r-pill) bg-(--ink)/[0.05] p-0.5 inset-ring-1 inset-ring-(--ink)/[0.06]">
                {(
                  [
                    { id: "page", label: "Shareable page" },
                    { id: "screen", label: "Live screen" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={surface === option.id}
                    onClick={() => {
                      setSurface(option.id);
                      if (option.id === "page") setMoment(null);
                    }}
                    className={cn(
                      "flex h-7 items-center rounded-(--r-pill) px-3 text-[12px] font-medium transition-[background-color,color] duration-150",
                      surface === option.id
                        ? "bg-(--surface-float) text-foreground shadow-(--lift-sm)"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <ScreenPreview
              campaign={campaign}
              posts={visible}
              mediaAssets={mediaAssets}
              state={state}
              surface={surface}
              momentId={moment ?? undefined}
            />

            <p className="mt-2 text-[11px] leading-snug text-muted-foreground/75 text-pretty">
              {surface === "page"
                ? "The page people land on from a link or a QR code. Scaled down; this is the real page."
                : moment
                  ? `Holding on the ${
                      MOMENTS.find((m) => m.id === moment)?.label ?? ""
                    } moment. Select another below to move the preview.`
                  : "The full-screen version for a projector. Select a moment below to preview it."}
            </p>
          </div>

          <div className="flex min-h-0 min-w-0 flex-col gap-2 lg:h-full lg:overflow-y-auto lg:pr-1 lg:pb-6">
            <SetupSection
              icon={Link2}
              title="Distribution"
              open={openSection === "distribution"}
              onToggle={() => toggleSection("distribution")}
              summary={isPublic ? "Live link and QR code" : "Link reserved, not public yet"}
            >
              <p className="-mt-1 text-[11.5px] leading-snug text-muted-foreground text-pretty">
                {isPublic
                  ? "Share this link, or let people scan the code."
                  : "This is the address the screen will take. It goes live the moment you publish the campaign."}
              </p>

              <div className="flex items-center gap-1.5 rounded-(--r-inner) bg-(--ink)/[0.04] p-1.5 pl-3 inset-ring-1 inset-ring-(--ink)/[0.06]">
                <span title={url} className="min-w-0 flex-1 truncate text-[12px] text-foreground/85">
                  {url}
                </span>
                <CopyButton value={url} label="Copy link" />
                <Hint label="Open the screen">
                  <a
                    href={path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-7 shrink-0 items-center justify-center rounded-(--r-pill) text-foreground/70 transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.08] hover:text-foreground"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </Hint>
              </div>

              <div className="flex items-center gap-3 rounded-(--r-inner) bg-(--ink)/[0.03] p-3 inset-ring-1 inset-ring-(--ink)/[0.05]">
                <span className="flex size-[76px] shrink-0 items-center justify-center rounded-(--r-inner) bg-white p-1.5">
                  <QrGlyph seed={campaign.id} className="size-full text-neutral-900" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-medium">Campaign QR code</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground text-pretty">
                    For posters, slides and screens. Points at the campaign page.
                  </span>
                </span>
              </div>
            </SetupSection>

            <SetupSection
              icon={MonitorPlay}
              title="Posts on screen"
              open={openSection === "posts"}
              onToggle={() => toggleSection("posts")}
              summary={
                ordered.length === 0
                  ? "No posts submitted yet"
                  : `${visible.length} of ${ordered.length} showing`
              }
            >
              <p className="-mt-1 text-[11.5px] leading-snug text-muted-foreground text-pretty">
                Turn a post off to take it off the screen without removing it from the
                campaign. Drag to change the order visitors see.
              </p>

              {ordered.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 rounded-(--r-inner) bg-(--ink)/[0.03] px-4 py-7 text-center inset-ring-1 inset-ring-(--ink)/[0.05]">
                  <span className="text-[12.5px] font-medium">No posts submitted yet</span>
                  <span className="max-w-[32ch] text-[11.5px] leading-snug text-muted-foreground text-pretty">
                    Posts appear here once they are submitted to this campaign.
                  </span>
                  <button
                    onClick={onOpenCampaign}
                    className="mt-1.5 flex h-7 items-center gap-1.5 rounded-(--r-pill) bg-(--ink)/[0.05] px-2.5 text-[11.5px] font-medium transition-colors duration-150 hover:bg-(--ink)/[0.09]"
                  >
                    Go to the campaign
                    <ChevronRight className="size-3" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {ordered.map((post, i) => (
                    <PostRow
                      key={post.id}
                      post={post}
                      index={i}
                      total={ordered.length}
                      mediaAssets={mediaAssets}
                      hidden={isHiddenOnScreen(campaign, post.id)}
                      dragging={dragId === post.id}
                      dropTarget={overId === post.id && dragId !== post.id}
                      onDragStart={() => setDragId(post.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverId(null);
                      }}
                      onDragOver={() => setOverId(post.id)}
                      onDrop={() => handleDrop(post.id)}
                      onToggle={() => onToggleVisibility(post.id)}
                      onMove={(dir) => onMove(post.id, dir)}
                      onEdit={() => onSelectSession(post.id)}
                      onWithdraw={() => onWithdraw(post.id)}
                    />
                  ))}
                </div>
              )}
            </SetupSection>

            <ThemePanel
              theme={campaign.theme}
              selectedMoment={moment}
              openSection={openSection}
              onSelectMoment={selectMoment}
              onToggleSection={toggleSection}
              onChange={onThemeChange}
            />

            <ContestPanel
              campaign={campaign}
              openSection={openSection}
              onToggleSection={toggleSection}
              onChange={onContestChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Hint label={copied ? "Copied" : label}>
      <button
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        aria-label={label}
        className="flex size-7 shrink-0 items-center justify-center rounded-(--r-pill) text-foreground/70 transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.08] hover:text-foreground"
      >
        {copied ? <Check className="size-3.5 text-live-300" /> : <Copy className="size-3.5" />}
      </button>
    </Hint>
  );
}

function PostRow({
  post,
  index,
  total,
  mediaAssets,
  hidden,
  dragging,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onToggle,
  onMove,
  onEdit,
  onWithdraw,
}: {
  post: Session;
  index: number;
  total: number;
  mediaAssets: MediaAsset[];
  hidden: boolean;
  dragging: boolean;
  dropTarget: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onToggle: () => void;
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
  onWithdraw: () => void;
}) {
  const [showQr, setShowQr] = useState(false);
  const image = post.visualAssetIds
    .map((id) => mediaAssets.find((a) => a.id === id))
    .find((a): a is MediaAsset => Boolean(a) && a!.type === "image");
  const postUrl =
    typeof window !== "undefined" ? `${window.location.origin}/p/${post.id}` : `/p/${post.id}`;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={cn(
        "rounded-(--r-inner) bg-(--ink)/[0.025] transition-[opacity,box-shadow] duration-150 inset-ring-1 inset-ring-(--ink)/[0.05]",
        dragging && "opacity-40",
        dropTarget && "inset-ring-2 inset-ring-violet-400/60",
      )}
    >
      <div className="flex items-center gap-2.5 p-2">
        <Hint label="Drag to reorder">
          <span className="flex size-6 shrink-0 cursor-grab items-center justify-center text-muted-foreground/40 transition-colors duration-150 hover:text-muted-foreground active:cursor-grabbing">
            <GripVertical className="size-3.5" />
          </span>
        </Hint>

        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-(--r-inner) bg-(--ink)/[0.06] text-muted-foreground/40 transition-opacity duration-150",
            hidden && "opacity-40",
          )}
        >
          {image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.url} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-3.5" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-[12.5px] font-medium transition-opacity duration-150",
              hidden && "text-muted-foreground line-through decoration-muted-foreground/40",
            )}
          >
            {post.title?.trim() || post.copy.trim() || "Untitled post"}
          </span>
          <span className="mt-0.5 block text-[10.5px] tabular-nums text-muted-foreground/70">
            {hidden ? "Hidden from the screen" : `Position ${index + 1} of ${total}`}
          </span>
        </span>

        <Hint label={hidden ? "Show on the screen" : "Hide from the screen"}>
          <button
            type="button"
            role="switch"
            aria-checked={!hidden}
            aria-label={hidden ? "Show on the screen" : "Hide from the screen"}
            onClick={onToggle}
            className="shrink-0"
          >
            <span
              aria-hidden
              className={cn(
                "relative block h-[18px] w-8 rounded-(--r-pill) transition-colors duration-200",
                hidden
                  ? "bg-(--ink)/[0.10] inset-ring-1 inset-ring-(--ink)/[0.10]"
                  : "bg-live-500",
              )}
            >
              <span
                className={cn(
                  "absolute left-0.5 top-0.5 block size-3.5 rounded-(--r-pill) bg-white shadow-(--lift-sm) transition-transform duration-200",
                  hidden ? "translate-x-0" : "translate-x-3.5",
                )}
                style={{ transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
              />
            </span>
          </button>
        </Hint>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Actions for ${post.title || "this post"}`}
            className="flex size-7 shrink-0 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.07] hover:text-foreground"
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto min-w-[188px]">
            <DropdownMenuItem
              onClick={() => window.open(`/p/${post.id}`, "_blank", "noopener,noreferrer")}
              className="whitespace-nowrap"
            >
              <Eye className="size-3.5" />
              View public page
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(postUrl)}
              className="whitespace-nowrap"
            >
              <Link2 className="size-3.5" />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowQr((v) => !v)}
              className="whitespace-nowrap"
            >
              <QrCode className="size-3.5" />
              {showQr ? "Hide QR code" : "Show QR code"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit} className="whitespace-nowrap">
              <Pencil className="size-3.5" />
              Edit post
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onMove(-1)}
              disabled={index === 0}
              className="whitespace-nowrap"
            >
              <ArrowUp className="size-3.5" />
              Move up
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onMove(1)}
              disabled={index === total - 1}
              className="whitespace-nowrap"
            >
              <ArrowDown className="size-3.5" />
              Move down
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onWithdraw}
              className="whitespace-nowrap text-destructive data-highlighted:text-destructive"
            >
              <EyeOff className="size-3.5" />
              Remove from campaign
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showQr && (
        <div className="flex items-center gap-3 border-t border-(--ink)/[0.06] p-3 duration-200 animate-in fade-in">
          <span className="flex size-[68px] shrink-0 items-center justify-center rounded-(--r-inner) bg-white p-1.5">
            <QrGlyph seed={post.id} className="size-full text-neutral-900" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11.5px] font-medium">Post QR code</span>
            <span title={postUrl} className="mt-0.5 block truncate text-[10.5px] text-muted-foreground">
              {postUrl}
            </span>
          </span>
          <CopyButton value={postUrl} label="Copy post link" />
        </div>
      )}
    </div>
  );
}
