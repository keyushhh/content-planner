"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AtSign,
  Check,
  ChevronsRight,
  FileText,
  Layers,
  Layers2,
  Image as ImageIcon,
  Repeat2,
  Loader2,
  Lock,
  MessageSquare,
  MessageSquarePlus,
  RefreshCw,
  Send,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, tagTint } from "@/lib/utils";
import { SECONDARY_ACTION_SM } from "@/lib/button-styles";
import { openFeedback } from "@/lib/feedback";
import { MediaThumb } from "./media-thumb";
import type { Feedback, MediaAsset, PostType, Session } from "@/lib/types";

/** Post types offered in the composer, matching the creation modal. */
export const POST_TYPES: { id: PostType; icon: typeof Layers2 }[] = [
  { id: "Image", icon: ImageIcon },
  { id: "Frames", icon: Layers2 },
  { id: "PDF", icon: FileText },
  { id: "Reshare", icon: Repeat2 },
];

/**
 * The media section is the same component in both layouts; only its wording
 * and its ceiling change with the post type.
 */
export const MEDIA_COPY: Record<
  PostType,
  {
    section: string;
    checklist: string;
    attached: string;
    /** Canvas: one-line pill. Split: title + hint stacked. */
    cta: string;
    ctaTitle: string;
    ctaHint: string;
    max: number;
  }
> = {
  Image: {
    section: "Assets",
    checklist: "an asset",
    attached: "Asset attached",
    cta: "Add an image",
    ctaTitle: "Add assets",
    ctaHint: "One image",
    max: Infinity,
  },
  Frames: {
    section: "Frames",
    checklist: "a frame",
    attached: "Frame attached",
    cta: "Add the first frame",
    ctaTitle: "Add frames",
    ctaHint: "Several images, swiped in order",
    max: Infinity,
  },
  PDF: {
    section: "PDF",
    checklist: "a PDF",
    attached: "PDF attached",
    cta: "Add a PDF",
    ctaTitle: "Add a PDF",
    ctaHint: "One document, swiped as pages",
    max: 1,
  },
  // Reshare never reaches the picker: its media comes from the original post.
  Reshare: {
    section: "Media",
    checklist: "",
    attached: "",
    cta: "",
    ctaTitle: "",
    ctaHint: "",
    max: 0,
  },
};

/**
 * What survives a post-type change. A PDF post cannot carry images and an
 * image post cannot carry a PDF, so the attachments are reconciled rather than
 * left to show three thumbnails under a heading that says PDF.
 */
export function assetsForType(
  ids: string[],
  assets: MediaAsset[],
  type: PostType,
): string[] {
  if (type === "Reshare") return ids;
  const kept = ids.filter((id) => {
    const asset = assets.find((a) => a.id === id);
    // an id we cannot resolve (a device upload) is not assumed to be a PDF
    if (!asset) return type !== "PDF";
    return type === "PDF" ? asset.type === "pdf" : asset.type !== "pdf";
  });
  const { max } = MEDIA_COPY[type];
  return Number.isFinite(max) ? kept.slice(0, max) : kept;
}

export const HASHTAG_SUGGESTIONS = [
  "#product",
  "#launch",
  "#giveaway",
  "#contest",
  "#announcement",
  "#marketing",
  "#branding",
];

export const TAG_SUGGESTIONS = [
  "social",
  "product",
  "launch",
  "giveaway",
  "contest",
  "email",
  "announcement",
];

export const EASE = "cubic-bezier(0.2,0,0,1)";

/**
 * Composer keyboard shortcuts, shared by both layouts. Escape is handled by
 * the page, which closes the sheet but does not flush drafts:
 */
export function useComposerShortcuts({
  savePendingChanges,
  readyToSend,
  onOpenSend,
}: {
  savePendingChanges: (source?: "blur" | "timer" | "instant") => void;
  readyToSend: boolean;
  onOpenSend: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (e.key === "Escape") {
        savePendingChanges("blur");
      } else if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        savePendingChanges("instant");
      } else if (mod && e.key === "Enter" && readyToSend) {
        e.preventDefault();
        onOpenSend();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [savePendingChanges, readyToSend, onOpenSend]);
}

/**
 * Adding a tag that already exists is silently ignored by the update logic,
 * which reads as a broken input.
 */
export function useTagFlash() {
  const [flashedTag, setFlashedTag] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const flashTag = (tag: string) => {
    setFlashedTag(tag);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlashedTag(null), 600);
  };

  return { flashedTag, flashTag };
}

export interface ComposerLayoutProps {
  session: Session;
  mediaAssets: MediaAsset[];
  isCampaignLocked: boolean;
  titleDraft: string;
  onTitleChange: (value: string) => void;
  copyDraft: string;
  onCopyChange: (value: string) => void;
  hashtagsDraft: string;
  onHashtagsChange: (value: string) => void;
  tagDraft: string;
  onTagDraftChange: (value: string) => void;
  saveStatus: "idle" | "saving" | "saved";
  saveSource: "blur" | "timer" | "instant" | null;
  isDirty: boolean;
  savePendingChanges: (source?: "blur" | "timer" | "instant") => void;
  onUpdate: (patch: Partial<Session>) => void;
  onUpdateWithPendingSave: (patch: Partial<Session>) => void;
  onClose: () => void;
  onOpenFeedback: (sectionLabel?: string) => void;
  isFeedbackOpen: boolean;
  onToggleFeedback: () => void;
  onOpenSend: () => void;
  onOpenMediaLibrary: () => void;
  onOpenVariations: () => void;
  onRequestUnlock: () => void;
  sendReadinessIssues: string[];
  readyToSend: boolean;
  needsResend: boolean;
  statusMenu: React.ReactNode;
  layoutToggle: React.ReactNode;
  unlockDialog: React.ReactNode;
}

export function SessionComposer({
  session,
  mediaAssets,
  isCampaignLocked,
  titleDraft,
  onTitleChange,
  copyDraft,
  onCopyChange,
  tagDraft,
  onTagDraftChange,
  saveStatus,
  isDirty,
  savePendingChanges,
  onUpdate,
  onClose,
  onOpenFeedback,
  isFeedbackOpen,
  onToggleFeedback,
  onOpenSend,
  onOpenMediaLibrary,
  onOpenVariations,
  onRequestUnlock,
  sendReadinessIssues,
  readyToSend,
  needsResend,
  statusMenu,
  layoutToggle,
  unlockDialog,
}: ComposerLayoutProps) {
  const [scrolled, setScrolled] = useState(false);

  useComposerShortcuts({ savePendingChanges, readyToSend, onOpenSend });

  const feedbackFor = (sectionLabel: string) =>
    session.feedback.filter((f) => f.sectionLabel === sectionLabel);
  const openCount = openFeedback(session.feedback).length;
  const media = MEDIA_COPY[session.postType];
  const canAddMore = session.visualAssetIds.length < media.max;

  const checklist = [
    { label: "Copy written", done: copyDraft.trim().length > 0, required: true },
    ...(session.postType === "Reshare"
      ? []
      : [
          {
            label: media.attached,
            done: session.visualAssetIds.length > 0,
          },
        ]),
    { label: "Tagged", done: session.tags.length > 0 },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const wordCount = copyDraft.trim() ? copyDraft.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header: hairline + lift appear only once content scrolls under it */}
      <div
        className={cn(
          "z-10 flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3 transition-colors duration-200",
          scrolled
            ? "border-(--ink)/[0.07] shadow-(--lift-md)"
            : "border-transparent",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {statusMenu}
          {/* Title hands off to the header once it scrolls out of view */}
          <span
            aria-hidden={!scrolled}
            className={cn(
              "min-w-0 truncate text-sm font-medium transition-[opacity,translate] duration-200",
              scrolled ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
            )}
            style={{ transitionTimingFunction: EASE }}
          >
            {titleDraft}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {readyToSend && (
            <Button
              size="sm"
              // Appears the instant the last checklist item lands, the sheet's
              // most triumphant moment, so it arrives rather than blinking in.
              className="h-8 animate-in gap-1.5 rounded-(--r-pill) bg-violet-600 px-3.5 text-sm text-white shadow-(--lift-accent) duration-300 fade-in zoom-in-95 inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,scale] hover:bg-violet-500 active:scale-(--press)"
              onClick={onOpenSend}
            >
              {needsResend ? (
                <RefreshCw className="size-3.5" />
              ) : (
                <Send className="size-3.5" />
              )}
              {needsResend ? "Send Update" : "Send to Campaign"}
            </Button>
          )}

          {layoutToggle}

          <Byline session={session} />

          <SaveChip
            saveStatus={saveStatus}
            isDirty={isDirty}
            onClick={() => savePendingChanges("instant")}
          />

          <FeedbackToolbarButton
            openCount={openCount}
            isOpen={isFeedbackOpen}
            onClick={onToggleFeedback}
          />

          <div className="mx-1 h-5 w-px bg-(--ink)/10" />

          <button
            onClick={() => {
              savePendingChanges("blur");
              onClose();
            }}
            aria-label="Save and collapse session"
            title="Save and collapse"
            className="flex size-8 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
          >
            <ChevronsRight className="size-4" />
          </button>
        </div>
      </div>

      {isCampaignLocked && (
        <Banner tone="violet">
          <span className="flex min-w-0 items-center gap-2">
            <Lock className="size-4 shrink-0" />
            This post is live on Wozku, so it&rsquo;s locked from editing.
          </span>
          <button
            onClick={onRequestUnlock}
            className="shrink-0 rounded-(--r-pill) px-2.5 py-1 text-xs font-medium text-violet-200 inset-ring-1 inset-ring-violet-400/30 transition-[background-color,scale] duration-150 hover:bg-violet-400/15 active:scale-(--press)"
          >
            Unlock to Edit
          </button>
        </Banner>
      )}

      {!isCampaignLocked && session.status === "approved" && sendReadinessIssues.length > 0 && (
        <Banner tone="amber">
          <span className="flex min-w-0 items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            Add {sendReadinessIssues.join(" and ")} before this post can be sent.
          </span>
        </Banner>
      )}

      {/* Body: one scroll container, two grid columns when the pane is wide
          enough. */}
      <div
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
        className="@container min-h-0 flex-1 overflow-y-auto @[880px]:overflow-hidden"
      >
        <div className="grid min-h-full grid-cols-1 @[880px]:h-full @[880px]:grid-cols-[minmax(0,1fr)_352px]">
          {/* Wide: the editor column is pinned to the pane height and scrolls
              only if its own content overflows, so no dead space opens up
              beneath Assets. */}
          <main
            onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
            className="min-w-0 @[880px]:min-h-0 @[880px]:overflow-y-auto"
          >
            <div className="mx-auto w-full max-w-[860px] px-8 pb-8 pt-7">
              <Stagger index={0} className="mb-6">
                <input
                  value={titleDraft}
                  onChange={(e) => onTitleChange(e.target.value)}
                  onBlur={() => savePendingChanges("blur")}
                  disabled={isCampaignLocked}
                  aria-label="Session title"
                  placeholder="Untitled session"
                  // The landing pad for the row title's flight; see title-flight.ts
                  data-pane-title
                  className="-mx-2 w-[calc(100%+1rem)] rounded-lg bg-transparent px-2 py-1 text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] outline-none transition-colors duration-150 hover:bg-(--ink)/[0.03] focus:bg-(--ink)/[0.045] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-transparent"
                />
              </Stagger>

              {/* Copy leads: it is the artifact. Assets support it and sit
                  below. */}
              <Stagger index={1} className="mb-4">
                <Card focusable>
                  <CardHeader
                    label="Copy"
                    feedback={feedbackFor("Copy")}
                    onFeedback={() => onOpenFeedback("Copy")}
                    action={
                      <div className="flex items-center gap-1">
                        <GhostAction onClick={onOpenVariations} icon={Layers}>
                          Post Variations
                          {session.variations.length > 0 && (
                            <span className="ml-1 rounded-(--r-pill) bg-violet-500/20 px-1.5 text-[10px] font-semibold tabular-nums text-violet-200">
                              {session.variations.length}
                            </span>
                          )}
                        </GhostAction>
                        <GhostAction icon={AtSign}>Add Mentions</GhostAction>
                        <AiAssistButton className="ml-1" />
                      </div>
                    }
                  />
                  {/* relative: hosts the stand-in caret below */}
                  <div className="relative">
                    <textarea
                      value={copyDraft}
                      onChange={(e) => onCopyChange(e.target.value)}
                      onBlur={() => savePendingChanges("blur")}
                      placeholder="Write your post…"
                      disabled={isCampaignLocked}
                      className="peer block min-h-[240px] w-full resize-y bg-transparent px-4 py-4 text-[15px] leading-[1.65] caret-violet-400 outline-none placeholder:text-muted-foreground/40 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                    {!copyDraft && !isCampaignLocked && (
                      <span
                        aria-hidden
                        style={{ animation: "copy-caret-blink 1.1s steps(1, end) infinite" }}
                        className="pointer-events-none absolute left-[12px] top-[19px] h-[18px] w-px bg-violet-400 peer-focus:!opacity-0"
                      />
                    )}
                  </div>
                  <div className="border-t border-(--ink)/[0.06] px-4 py-2.5">
                    <CopyMeta words={wordCount} count={copyDraft.length} />
                  </div>
                </Card>
              </Stagger>

              {/* No "Post type" card: it is chosen at creation and fixed for
                  the life of the post; see the note in session-canvas.tsx. */}

              {/* Reshare keeps the original post's media, so there is nothing
                  to pick, so the row says so rather than offering a dead
                  picker. */}
              {session.postType === "Reshare" ? (
                <Stagger index={3}>
                  <Card>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <span className="text-[13px] font-medium text-muted-foreground">
                        Media
                      </span>
                      <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                        <Repeat2 className="size-3.5 shrink-0" />
                        Comes from the post you&rsquo;re resharing
                      </span>
                    </div>
                  </Card>
                </Stagger>
              ) : (
              <Stagger index={3}>
                <Card>
                  <CardHeader
                    label={media.section}
                    feedback={feedbackFor("Assets")}
                    onFeedback={() => onOpenFeedback("Assets")}
                    action={
                      // a count is only information when the number can vary;
                      // "1 attached" on a one-PDF post says nothing
                      session.visualAssetIds.length > 0 && media.max > 1 ? (
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {session.visualAssetIds.length} attached
                        </span>
                      ) : undefined
                    }
                  />
                  <div className="p-3">
                    {session.visualAssetIds.length === 0 ? (
                      // Compact row, not a hero dropzone: assets are optional here
                      <button
                        disabled={isCampaignLocked}
                        onClick={onOpenMediaLibrary}
                        className="group flex w-full items-center gap-3 rounded-(--r-inner) bg-(--ink)/[0.03] px-3 py-2.5 text-left inset-ring-1 inset-ring-(--ink)/[0.08] transition-[background-color,box-shadow,scale] duration-200 hover:bg-violet-500/[0.06] hover:inset-ring-violet-400/40 active:scale-(--press-lg) disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-(--r-pill) bg-violet-500/10 text-violet-300 inset-ring-1 inset-ring-violet-400/25 transition-transform duration-200 group-hover:scale-[1.06]">
                          <UploadCloud className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-medium">
                            {media.ctaTitle}
                          </span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {media.ctaHint}
                          </span>
                        </span>
                      </button>
                    ) : (
                      <div className="flex flex-wrap gap-2.5">
                        {session.visualAssetIds.map((assetId) => (
                          <div
                            key={assetId}
                            className="group relative size-20 shrink-0 rounded-(--r-inner) shadow-(--lift-sm) outline outline-1 -outline-offset-1 outline-(--ink)/10"
                          >
                            <MediaThumb
                              compact
                              assetId={assetId}
                              type={mediaAssets.find((a) => a.id === assetId)?.type}
                              url={mediaAssets.find((a) => a.id === assetId)?.url}
                              name={mediaAssets.find((a) => a.id === assetId)?.name}
                              className="size-full !rounded-(--r-inner)"
                            />
                            {!isCampaignLocked && (
                              <button
                                onClick={() =>
                                  onUpdate({
                                    visualAssetIds: session.visualAssetIds.filter(
                                      (id) => id !== assetId,
                                    ),
                                  })
                                }
                                aria-label="Remove asset"
                                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-(--r-pill) bg-black/70 text-white opacity-0 backdrop-blur-sm transition-[opacity,background-color,scale] duration-150 before:absolute before:-inset-1.5 before:content-[''] hover:bg-destructive focus-visible:opacity-100 active:scale-(--press) group-hover:opacity-100"
                              >
                                <X className="size-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        {!isCampaignLocked && canAddMore && (
                          <button
                            onClick={onOpenMediaLibrary}
                            title="Pick from Media Library"
                            aria-label="Add another asset"
                            className="flex size-20 shrink-0 items-center justify-center rounded-(--r-inner) bg-(--ink)/[0.03] text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.08] transition-[background-color,box-shadow,color,scale] duration-200 hover:bg-violet-500/[0.08] hover:text-violet-300 hover:inset-ring-violet-400/40 active:scale-(--press)"
                          >
                            <UploadCloud className="size-5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </Stagger>
              )}
            </div>
          </main>

          {/* Right rail: secondary fields + context, so the main column
              keeps a readable measure. */}
          <aside className="min-w-0 border-(--ink)/[0.06] @[880px]:min-h-0 @[880px]:overflow-y-auto @[880px]:border-l @[880px]:bg-(--sink)/[0.14]">
            <div className="mx-auto w-full max-w-[860px] space-y-4 px-8 pb-16 pt-2 @[880px]:max-w-none @[880px]:px-5 @[880px]:pt-7">
              {!isCampaignLocked && (
                <Stagger index={1}>
                  <RailCard label="Readiness">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium">
                        <span className="tabular-nums">{doneCount}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          of <span className="tabular-nums">{checklist.length}</span> done
                        </span>
                      </span>
                    </div>
                    {/* fills left-to-right by count, not per-item, so it reads
                        as progress */}
                    <div className="mt-2.5 flex gap-1">
                      {checklist.map((item, i) => (
                        <span
                          key={item.label}
                          className={cn(
                            "h-1 flex-1 rounded-(--r-pill) transition-colors duration-300",
                            i < doneCount ? "bg-violet-400" : "bg-(--ink)/10",
                          )}
                        />
                      ))}
                    </div>
                    <ul className="mt-3.5 space-y-2">
                      {checklist.map((item) => (
                        <li key={item.label} className="flex items-center gap-2.5 text-[13px]">
                          <span
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded-(--r-pill) transition-colors duration-200",
                              item.done
                                ? "bg-emerald-500/20 text-emerald-300 inset-ring-1 inset-ring-emerald-400/30"
                                : "inset-ring-1 inset-ring-(--ink)/15",
                            )}
                          >
                            {item.done && <Check className="size-2.5" />}
                          </span>
                          <span
                            className={cn(
                              item.done ? "text-muted-foreground" : "text-foreground/90",
                            )}
                          >
                            {item.label}
                          </span>
                          {item.required && !item.done && (
                            <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-amber-400/90">
                              required
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </RailCard>
                </Stagger>
              )}

              <Stagger index={2}>
                <RailCard
                  label="Tags"
                  feedback={feedbackFor("Tags")}
                  onFeedback={() => onOpenFeedback("Tags")}
                >
                  <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-(--r-inner) bg-(--ink)/[0.04] p-1.5 inset-ring-1 inset-ring-(--ink)/[0.08] transition-[box-shadow,background-color] duration-200 focus-within:bg-(--ink)/[0.06] focus-within:inset-ring-violet-400/50">
                    {session.tags.map((tag) => (
                      <span
                        key={tag}
                        // Its own hue, so the same tag is the same colour here as
                        // it is in the table row and the filter menu.
                        className={cn(
                          "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium inset-ring-1 inset-ring-(--ink)/[0.06]",
                          tagTint(tag),
                        )}
                      >
                        {tag}
                        {!isCampaignLocked && (
                          <button
                            onClick={() =>
                              onUpdate({ tags: session.tags.filter((t) => t !== tag) })
                            }
                            aria-label={`Remove tag ${tag}`}
                            className="-mr-0.5 flex size-4 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[color,background-color] duration-150 hover:bg-destructive/20 hover:text-destructive"
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    <input
                      value={tagDraft}
                      onChange={(e) => onTagDraftChange(e.target.value)}
                      disabled={isCampaignLocked}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === ",") && tagDraft.trim()) {
                          e.preventDefault();
                          const next = tagDraft.trim().toLowerCase();
                          if (!session.tags.includes(next)) {
                            onUpdate({ tags: [...session.tags, next] });
                          }
                          onTagDraftChange("");
                        } else if (
                          e.key === "Backspace" &&
                          !tagDraft &&
                          session.tags.length > 0
                        ) {
                          onUpdate({ tags: session.tags.slice(0, -1) });
                        }
                      }}
                      placeholder={session.tags.length === 0 ? "Add tags (location, topic…)" : ""}
                      className="h-7 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground/75 disabled:cursor-not-allowed"
                    />
                  </div>
                  {!isCampaignLocked && (
                    <ChipRow>
                      {TAG_SUGGESTIONS.filter((t) => !session.tags.includes(t))
                        .slice(0, 5)
                        .map((tag) => (
                          <Chip
                            key={tag}
                            onClick={() => onUpdate({ tags: [...session.tags, tag] })}
                          >
                            {tag}
                          </Chip>
                        ))}
                    </ChipRow>
                  )}
                </RailCard>
              </Stagger>

              <Stagger index={3}>
                <RailCard label="Details">
                  <dl className="divide-y divide-(--ink)/[0.06]">
                    {/* "Last edited" lived here and in the toolbar byline:
                        the same fact twice, six inches apart. */}
                    <DetailRow label="Created" value={formatDate(session.createdAt)} />
                    <DetailRow
                      label="Variations"
                      value={
                        session.variations.length === 0 ? "None" : `${session.variations.length}`
                      }
                    />
                    <DetailRow
                      label="Feedback"
                      value={
                        session.feedback.length === 0
                          ? "None"
                          : openCount > 0
                            ? `${openCount} open of ${session.feedback.length}`
                            : `${session.feedback.length} closed`
                      }
                    />
                  </dl>
                </RailCard>
              </Stagger>
            </div>
          </aside>
        </div>
      </div>

      {unlockDialog}
    </div>
  );
}

/* ---------- primitives ---------- */

export function Stagger({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-500 motion-reduce:animate-none",
        className,
      )}
      style={{ animationDelay: `${index * 55}ms` }}
    >
      {children}
    </div>
  );
}

function Card({
  focusable,
  fill,
  children,
}: {
  focusable?: boolean;
  fill?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl bg-(--ink)/[0.025] shadow-(--lift-md) inset-ring-1 inset-ring-(--ink)/[0.07] transition-[box-shadow] duration-200",
        fill && "flex min-h-0 flex-1 flex-col",
        // A lit hairline is enough. The 4px violet halo this used to add read as
        // an error state stacked on top of a focus state.
        focusable && "focus-within:inset-ring-violet-400/30",
      )}
    >
      {children}
    </section>
  );
}

function CardHeader({
  label,
  action,
  feedback,
  onFeedback,
}: {
  label: string;
  action?: React.ReactNode;
  feedback?: Feedback[];
  onFeedback?: () => void;
}) {
  return (
    <div className="group/row flex min-h-11 items-center justify-between gap-3 border-b border-(--ink)/[0.06] bg-(--ink)/[0.015] px-4 py-1.5">
      {/* Label and its feedback control travel together; see FeedbackButton */}
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="font-(family-name:--font-label) text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        {onFeedback && (
          <FeedbackButton items={feedback ?? []} onClick={onFeedback} />
        )}
      </span>
      {action && <div className="flex items-center gap-1.5">{action}</div>}
    </div>
  );
}

export function RailCard({
  label,
  feedback,
  onFeedback,
  children,
}: {
  label: string;
  feedback?: Feedback[];
  onFeedback?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="group/row rounded-2xl bg-(--ink)/[0.022] p-4 shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.06]">
      <div className="mb-2.5 flex min-h-6 items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        {onFeedback && (
          <FeedbackButton items={feedback ?? []} onClick={onFeedback} />
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * Opens the feedback rail. The badge counts what is still open rather than the
 * total, so a post with six closed notes and nothing outstanding does not look
 * unfinished. Amber, because an open note is a request somebody is waiting on.
 */
export function FeedbackToolbarButton({
  openCount,
  isOpen,
  onClick,
}: {
  openCount: number;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={openCount > 0 ? `Feedback, ${openCount} open` : "Feedback"}
      aria-pressed={isOpen}
      title={openCount > 0 ? `${openCount} open feedback` : "Feedback"}
      className={cn(
        "relative flex size-8 items-center justify-center rounded-(--r-pill) transition-[background-color,color,scale] duration-150 active:scale-(--press)",
        isOpen
          ? "bg-(--ink)/[0.09] text-foreground"
          : "text-muted-foreground hover:bg-(--ink)/[0.06] hover:text-foreground",
      )}
    >
      <MessageSquare className="size-4" />
      {openCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-(--r-pill) bg-amber-500 text-[9px] font-semibold tabular-nums text-black/80 ring-2 ring-background">
          {openCount}
        </span>
      )}
    </button>
  );
}

/** The feedback control for one section, inline after the section label. */
export function FeedbackButton({
  items,
  onClick,
}: {
  items: Feedback[];
  onClick: () => void;
}) {
  const open = openFeedback(items).length;

  if (items.length === 0) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Add feedback"
        title="Add feedback on this section"
        className="relative flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 opacity-0 transition-[opacity,background-color,color,scale] duration-200 before:absolute before:-inset-1.5 before:content-[''] hover:bg-(--ink)/[0.08] hover:text-foreground focus-visible:opacity-100 active:scale-(--press) group-hover/row:opacity-100 group-focus-within/row:opacity-100"
      >
        <MessageSquarePlus className="size-3.5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${items.length} feedback, ${open} open`}
      title={open > 0 ? `${open} open of ${items.length}` : "All feedback closed"}
      className={cn(
        "relative flex h-5 shrink-0 items-center gap-1 rounded-(--r-pill) px-1.5 text-[10px] font-medium tabular-nums inset-ring-1 transition-[background-color,box-shadow,scale] duration-150 before:absolute before:-inset-1.5 before:content-[''] hover:brightness-110 active:scale-(--press)",
        open > 0
          ? "bg-amber-500/[0.14] text-amber-200 inset-ring-amber-400/30"
          : "bg-(--ink)/[0.06] text-muted-foreground inset-ring-(--ink)/[0.09]",
      )}
    >
      <MessageSquare className="size-2.5" />
      {items.length}
    </button>
  );
}

/**
 * Who touched it last, and when. Provenance rather than content, so it belongs
 * in the toolbar beside the save state rather than under the title, where it
 * competed for the eye and pushed the readiness line down.
 */
export function Byline({ session }: { session: Session }) {
  return (
    // mr- widens the 6px toolbar gap on the save-chip side only: the byline
    // reports on the file and the chip reports on the save, so they should not read
    // as one cluster.
    <span className="mr-2 hidden min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
      <Avatar className="size-4 shrink-0 inset-ring-1 inset-ring-(--ink)/10">
        <AvatarFallback className="text-[8px]">
          {session.lastEditedBy?.name?.[0] ?? "?"}
        </AvatarFallback>
      </Avatar>
      <span className="max-w-[120px] truncate">
        {session.lastEditedBy?.name ?? "Unknown"}
      </span>
      <span aria-hidden className="size-1 shrink-0 rounded-(--r-round) bg-muted-foreground/40" />
      <span className="shrink-0 tabular-nums">{formatDate(session.updatedAt)}</span>
    </span>
  );
}

export function GhostAction({
  icon: Icon,
  onClick,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      // Link blue: these two navigate away from the copy field rather than acting on
      // it, and blue is the one colour the web already reads as "goes somewhere". It
      // also keeps them out of the violet the app spends on state.
      className="flex h-7 items-center gap-1.5 rounded-(--r-pill) px-2 text-xs font-medium text-blue-400 transition-[background-color,color,scale] duration-150 hover:bg-blue-400/10 hover:text-blue-300 active:scale-(--press)"
    >
      <Icon className="size-3.5" />
      {children}
    </button>
  );
}

export function LimitMeter({
  label,
  count,
  limit,
}: {
  label: string;
  count: number;
  limit: number;
}) {
  const zone = limitZone(count, limit);
  const pct = Math.min(100, (count / limit) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className="relative hidden h-1 w-10 overflow-hidden rounded-(--r-pill) bg-(--ink)/10 @[460px]:block">
        <span
          className={cn(
            "absolute inset-y-0 left-0 rounded-(--r-pill) transition-[width,background-color] duration-300",
            LIMIT_ZONE[zone].bar,
          )}
          style={{ width: `${pct}%`, transitionTimingFunction: EASE }}
        />
      </span>
      <span className={cn("text-[11px] tabular-nums", LIMIT_ZONE[zone].text)}>
        {count}/{limit}
      </span>
    </div>
  );
}

/**
 * Character budgets read as a traffic light rather than as brand colour: the
 * whole app is violet, so a violet meter said nothing about whether you were
 * safe.
 */
export type LimitZone = "safe" | "near" | "over";

export function limitZone(count: number, limit: number): LimitZone {
  if (count >= limit) return "over";
  if (count >= limit * 0.9) return "near";
  return "safe";
}

export const LIMIT_ZONE: Record<
  LimitZone,
  { bar: string; text: string; chip: string }
> = {
  safe: {
    bar: "bg-emerald-400/85",
    text: "text-muted-foreground",
    chip: "border-border/60 text-muted-foreground",
  },
  near: {
    bar: "bg-amber-400",
    text: "font-medium text-amber-400",
    chip: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  },
  over: {
    bar: "bg-red-400",
    text: "font-medium text-red-400",
    chip: "border-red-500/50 bg-red-500/10 text-red-400",
  },
};

/** Character budgets shown under the copy field, in reading order. */
export const COPY_LIMITS: { label: string; limit: number }[] = [
  { label: "LinkedIn", limit: 3000 },
  { label: "X", limit: 280 },
  { label: "Slack", limit: 4000 },
];

export function CopyLimits({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {COPY_LIMITS.map((p) => (
        <LimitMeter key={p.label} label={p.label} count={count} limit={p.limit} />
      ))}
    </div>
  );
}

/**
 * One footer line under the copy field. The standalone "340 characters" that
 * used to sit here restated what all three meters already say.
 */
export function CopyMeta({ words, count }: { words: number; count: number }) {
  return (
    // @container so the meters answer the pane's width: with the discussion panel
    // open they used to wrap onto a second line. Below 460px the bars drop and the
    // numbers stay, which is the part that carries the meaning.
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 @container">
      <span className="text-[11px] tabular-nums text-muted-foreground">
        {words} {words === 1 ? "word" : "words"}
      </span>
      <CopyLimits count={count} />
    </div>
  );
}

/**
 * The app's secondary action, same as Invite in the repository toolbar: an
 * outlined pill, no gradient, no sheen, no glow.
 */
export function AiAssistButton({ className }: { className?: string }) {
  return (
    <button title="AI Assist" className={cn(SECONDARY_ACTION_SM, className)}>
      <Sparkles className="size-3.5" />
      AI Assist
    </button>
  );
}

/**
 * Suggestions, optionally revealed on demand. Always on, two of these rows sat
 * permanently in the lower third of the sheet.
 */
export function ChipRow({
  children,
  collapsible = false,
}: {
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  if (Array.isArray(items) && items.length === 0) return null;

  const row = (
    <div className="flex flex-wrap items-center gap-1.5 pt-2.5">
      <span className="text-[11px] text-muted-foreground">Suggested</span>
      {items}
    </div>
  );

  if (!collapsible) return <div className="mt-2.5">{row}</div>;

  return (
    <div
      className="grid grid-rows-[0fr] transition-[grid-template-rows,opacity] duration-250 opacity-0 group-focus-within/field:grid-rows-[1fr] group-focus-within/field:opacity-100"
      style={{ transitionTimingFunction: EASE }}
    >
      <div className="min-h-0 overflow-clip">{row}</div>
    </div>
  );
}

export function Chip({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 items-center rounded-(--r-pill) bg-(--ink)/[0.035] px-2.5 text-[11px] font-medium text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.08] transition-[background-color,color,box-shadow,scale] duration-150 hover:bg-violet-500/12 hover:text-violet-200 hover:inset-ring-violet-400/40 active:scale-(--press)"
    >
      {children}
    </button>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-[13px] first:pt-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate tabular-nums text-foreground/90">{value}</dd>
    </div>
  );
}

export function Dot() {
  return <span className="size-1 rounded-(--r-round) bg-muted-foreground/40" />;
}

export function Banner({
  tone,
  children,
}: {
  tone: "violet" | "amber";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-b px-6 py-2.5 text-sm",
        tone === "violet"
          ? "border-violet-400/20 bg-violet-500/10 text-violet-200"
          : "border-amber-400/20 bg-amber-500/10 text-amber-300",
      )}
    >
      {children}
    </div>
  );
}

export function SaveChip({
  saveStatus,
  isDirty,
  onClick,
}: {
  saveStatus: "idle" | "saving" | "saved";
  /** Drafts differ from the saved session, so work is genuinely not saved yet. */
  isDirty: boolean;
  onClick: () => void;
}) {
  const saving = saveStatus === "saving";
  // Dirty must win over "saved": having typed since the last flush is the whole
  // point of the indicator, and claiming "Autosaved" then would be a lie.
  const state = saving ? "saving" : isDirty ? "dirty" : "saved";

  return (
    <button
      onClick={onClick}
      title="Save now (⌘S). Also autosaves on focus loss or every 30 seconds"
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-(--r-pill) px-3 text-xs inset-ring-1 transition-[background-color,box-shadow,scale] duration-150 active:scale-(--press)",
        state === "dirty"
          ? "bg-amber-500/[0.08] inset-ring-amber-400/25 hover:bg-amber-500/15"
          : "bg-(--ink)/[0.03] inset-ring-(--ink)/[0.08] hover:bg-(--ink)/[0.07] hover:inset-ring-(--ink)/15",
      )}
    >
      {/* all three icons stay mounted and cross-fade, so swaps animate in and
          out */}
      <span className="relative flex size-3 items-center justify-center">
        <Loader2
          className={cn(
            "absolute size-3 animate-spin text-violet-300 transition-[opacity,scale,filter] duration-200",
            state === "saving" ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-[4px]",
          )}
          style={{ transitionTimingFunction: EASE }}
        />
        <span
          className={cn(
            "absolute size-1.5 rounded-(--r-round) bg-amber-400 transition-[opacity,scale,filter] duration-200",
            state === "dirty" ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-[4px]",
          )}
          style={{ transitionTimingFunction: EASE }}
        />
        <Check
          className={cn(
            "absolute size-3 text-emerald-400 transition-[opacity,scale,filter] duration-200",
            state === "saved" ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-[4px]",
          )}
          style={{ transitionTimingFunction: EASE }}
        />
      </span>
      <span
        aria-live="polite"
        className={cn(state === "dirty" ? "text-amber-300" : "text-muted-foreground")}
      >
        {/* Which mechanism saved it (blur, timer, ⌘S) is our business, not
            the writer's. */}
        {state === "saving"
          ? "Saving…"
          : state === "dirty"
            ? "Unsaved changes"
            : "Autosaved"}
      </span>
    </button>
  );
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
