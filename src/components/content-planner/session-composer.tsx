"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AtSign,
  Check,
  ChevronDown,
  ChevronsRight,
  Layers,
  Layers2,
  Image as ImageIcon,
  Repeat2,
  Loader2,
  Lock,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, countComments } from "@/lib/utils";
import { MediaThumb } from "./media-thumb";
import { PostTypeModal } from "./post-type-modal";
import type { Comment, MediaAsset, Platform, PostType, Session } from "@/lib/types";

/** Post types offered in the composer, matching the creation modal. */
export const POST_TYPES: { id: PostType; icon: typeof Layers2 }[] = [
  { id: "Image", icon: ImageIcon },
  { id: "Frames", icon: Layers2 },
  { id: "Reshare", icon: Repeat2 },
];

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
 * Composer keyboard shortcuts, shared by both layouts.
 *
 * Escape is handled by the page (it closes the sheet) but does not flush drafts —
 * React unmounts without firing blur, so anything typed since the last save would
 * be lost. Both listeners run in the same dispatch, so saving here is enough.
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
 * Adding a tag that already exists is silently ignored by the update logic, which
 * reads as a broken input. This flashes the existing chip instead so the dead end
 * is visible rather than mysterious.
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
  onOpenDiscussion: (fieldLabel?: string) => void;
  isDiscussionOpen: boolean;
  onToggleDiscussion: () => void;
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
  saveSource,
  isDirty,
  savePendingChanges,
  onUpdate,
  onUpdateWithPendingSave,
  onClose,
  onOpenDiscussion,
  isDiscussionOpen,
  onToggleDiscussion,
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
  const [typeModalOpen, setTypeModalOpen] = useState(false);

  useComposerShortcuts({ savePendingChanges, readyToSend, onOpenSend });

  const commentsFor = (fieldLabel: string) =>
    session.comments.filter((c) => c.fieldLabel === fieldLabel);
  // replies live inside their parent, so the raw length under-reports the thread
  const totalComments = countComments(session.comments);

  const checklist = [
    { label: "Copy written", done: copyDraft.trim().length > 0, required: true },
    ...(session.postType === "Reshare"
      ? []
      : [
          {
            label: session.postType === "Frames" ? "Frame attached" : "Asset attached",
            done: session.visualAssetIds.length > 0,
          },
        ]),
    { label: "Tagged", done: session.tags.length > 0 },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const wordCount = copyDraft.trim() ? copyDraft.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header — hairline + lift appear only once content scrolls under it */}
      <div
        className={cn(
          "z-10 flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3 transition-colors duration-200",
          scrolled
            ? "border-white/[0.07] shadow-[0_10px_24px_-20px_rgba(0,0,0,0.9)]"
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
              // Appears the instant the last checklist item lands — the sheet's
              // most triumphant moment, so it arrives rather than blinking in.
              className="h-8 animate-in gap-1.5 rounded-full bg-violet-600 px-3.5 text-sm text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_16px_-8px_rgba(139,92,246,0.7)] duration-300 fade-in zoom-in-95 inset-ring-1 inset-ring-white/15 transition-[background-color,scale] hover:bg-violet-500 active:scale-[0.96]"
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
            saveSource={saveSource}
            isDirty={isDirty}
            onClick={() => savePendingChanges("instant")}
          />

          <button
            onClick={onToggleDiscussion}
            aria-label="Toggle discussion"
            aria-pressed={isDiscussionOpen}
            title="Discussion"
            className={cn(
              "relative flex size-8 items-center justify-center rounded-full transition-[background-color,color,scale] duration-150 active:scale-[0.96]",
              isDiscussionOpen
                ? "bg-white/[0.09] text-foreground"
                : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
            )}
          >
            <MessageCircle className="size-4" />
            {totalComments > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-semibold tabular-nums text-white ring-2 ring-background">
                {totalComments}
              </span>
            )}
          </button>

          <div className="mx-1 h-5 w-px bg-white/10" />

          <button
            onClick={() => {
              savePendingChanges("blur");
              onClose();
            }}
            aria-label="Save and collapse session"
            title="Save and collapse"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-white/[0.06] hover:text-foreground active:scale-[0.96]"
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
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-violet-200 inset-ring-1 inset-ring-violet-400/30 transition-[background-color,scale] duration-150 hover:bg-violet-400/15 active:scale-[0.96]"
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

      {/* Body — one scroll container, two grid columns when the pane is wide enough.
          Container queries (not viewport) so opening the Activity panel collapses this
          to a single natural stack: title → assets → copy → readiness → hashtags → tags. */}
      <div
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
        className="@container min-h-0 flex-1 overflow-y-auto @[880px]:overflow-hidden"
      >
        <div className="grid min-h-full grid-cols-1 @[880px]:h-full @[880px]:grid-cols-[minmax(0,1fr)_352px]">
          {/* Wide: the editor column is pinned to the pane height and scrolls only
              if its own content overflows — so no dead space opens up beneath Assets.
              Narrow: the outer container scrolls and both columns simply stack. */}
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
                  className="-mx-2 w-[calc(100%+1rem)] rounded-lg bg-transparent px-2 py-1 text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] outline-none transition-colors duration-150 hover:bg-white/[0.03] focus:bg-white/[0.045] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-transparent"
                />
              </Stagger>

              {/* Copy leads — it is the artifact. Assets support it and sit below. */}
              <Stagger index={1} className="mb-4">
                <Card focusable>
                  <CardHeader
                    label="Copy"
                    comments={commentsFor("Copy")}
                    onComment={() => onOpenDiscussion("Copy")}
                    action={
                      <div className="flex items-center gap-1">
                        <GhostAction onClick={onOpenVariations} icon={Layers}>
                          Post Variations
                          {session.variations.length > 0 && (
                            <span className="ml-1 rounded-full bg-violet-500/20 px-1.5 text-[10px] font-semibold tabular-nums text-violet-200">
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
                  <div className="border-t border-white/[0.06] px-4 py-2.5">
                    <CopyMeta words={wordCount} count={copyDraft.length} />
                  </div>
                </Card>
              </Stagger>

              {/* Read-only: chosen before the pane opened, and it decides which
                  cards appear below — changing it in place would rearrange the
                  column under the cursor. */}
              <Stagger index={2} className="mb-4">
                <Card>
                  <div className="group/row flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <span className="text-[13px] font-medium text-muted-foreground">
                      Post type
                    </span>
                    <div className="flex items-center gap-1">
                    <button
                      disabled={isCampaignLocked}
                      onClick={() => setTypeModalOpen(true)}
                      title="Change post type"
                      className="group/type -mr-1.5 flex h-8 items-center gap-2 rounded-full bg-white/[0.04] pl-2.5 pr-2 text-[13px] font-medium inset-ring-1 inset-ring-white/[0.08] transition-[background-color,box-shadow,scale] duration-150 hover:bg-white/[0.07] hover:inset-ring-white/[0.14] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
                    >
                      {(() => {
                        const Icon =
                          POST_TYPES.find((t) => t.id === session.postType)?.icon ?? ImageIcon;
                        return <Icon className="size-3.5 shrink-0 text-muted-foreground" />;
                      })()}
                      {session.postType}
                      {/* always visible — see note in session-canvas.tsx */}
                      <ChevronDown className="size-3.5 shrink-0 text-muted-foreground/60 transition-colors duration-150 group-hover/type:text-muted-foreground" />
                    </button>
                    <CommentButton
                      comments={commentsFor("Post type")}
                      onClick={() => onOpenDiscussion("Post type")}
                    />
                    </div>
                  </div>
                </Card>
              </Stagger>

              {/* Reshare keeps the original post's media, so there is nothing to
                  pick — the row says so rather than offering a dead picker. */}
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
                    label={session.postType === "Frames" ? "Frames" : "Assets"}
                    comments={commentsFor("Assets")}
                    onComment={() => onOpenDiscussion("Assets")}
                    action={
                      session.visualAssetIds.length > 0 ? (
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {session.visualAssetIds.length} attached
                        </span>
                      ) : undefined
                    }
                  />
                  <div className="p-3">
                    {session.visualAssetIds.length === 0 ? (
                      // Compact row, not a hero dropzone — assets are optional here
                      <button
                        disabled={isCampaignLocked}
                        onClick={onOpenMediaLibrary}
                        className="group flex w-full items-center gap-3 rounded-[12px] bg-white/[0.03] px-3 py-2.5 text-left inset-ring-1 inset-ring-white/[0.08] transition-[background-color,box-shadow,scale] duration-200 hover:bg-violet-500/[0.06] hover:inset-ring-violet-400/40 active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-300 inset-ring-1 inset-ring-violet-400/25 transition-transform duration-200 group-hover:scale-[1.06]">
                          <UploadCloud className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-medium">
                            {session.postType === "Frames" ? "Add frames" : "Add assets"}
                          </span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {session.postType === "Frames"
                              ? "Several images, swiped in order"
                              : "An image or a video"}
                          </span>
                        </span>
                      </button>
                    ) : (
                      <div className="flex flex-wrap gap-2.5">
                        {session.visualAssetIds.map((assetId) => (
                          <div
                            key={assetId}
                            className="group relative size-20 shrink-0 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.3)] outline outline-1 -outline-offset-1 outline-white/10"
                          >
                            <MediaThumb
                              compact
                              assetId={assetId}
                              type={mediaAssets.find((a) => a.id === assetId)?.type}
                              className="size-full !rounded-[10px]"
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
                                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur-sm transition-[opacity,background-color,scale] duration-150 before:absolute before:-inset-1.5 before:content-[''] hover:bg-destructive focus-visible:opacity-100 active:scale-[0.96] group-hover:opacity-100"
                              >
                                <X className="size-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        {!isCampaignLocked && (
                          <button
                            onClick={onOpenMediaLibrary}
                            title="Pick from Media Library"
                            aria-label="Add another asset"
                            className="flex size-20 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.03] text-muted-foreground inset-ring-1 inset-ring-white/[0.08] transition-[background-color,box-shadow,color,scale] duration-200 hover:bg-violet-500/[0.08] hover:text-violet-300 hover:inset-ring-violet-400/40 active:scale-[0.97]"
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

          {/* Right rail — secondary fields + context, so the main column keeps a readable measure.
              Below the breakpoint it becomes the bottom of the same single column. */}
          <aside className="min-w-0 border-white/[0.06] @[880px]:min-h-0 @[880px]:overflow-y-auto @[880px]:border-l @[880px]:bg-black/[0.14]">
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
                    {/* fills left-to-right by count, not per-item — it reads as progress */}
                    <div className="mt-2.5 flex gap-1">
                      {checklist.map((item, i) => (
                        <span
                          key={item.label}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-colors duration-300",
                            i < doneCount ? "bg-violet-400" : "bg-white/10",
                          )}
                        />
                      ))}
                    </div>
                    <ul className="mt-3.5 space-y-2">
                      {checklist.map((item) => (
                        <li key={item.label} className="flex items-center gap-2.5 text-[13px]">
                          <span
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
                              item.done
                                ? "bg-emerald-500/20 text-emerald-300 inset-ring-1 inset-ring-emerald-400/30"
                                : "inset-ring-1 inset-ring-white/15",
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
                <RailCard label="Tags">
                  <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-[10px] bg-white/[0.04] p-1.5 inset-ring-1 inset-ring-white/[0.08] transition-[box-shadow,background-color] duration-200 focus-within:bg-white/[0.06] focus-within:inset-ring-violet-400/50">
                    {session.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex h-7 items-center gap-1.5 rounded-md bg-white/[0.08] px-2.5 text-xs font-medium inset-ring-1 inset-ring-white/[0.06]"
                      >
                        {tag}
                        {!isCampaignLocked && (
                          <button
                            onClick={() =>
                              onUpdate({ tags: session.tags.filter((t) => t !== tag) })
                            }
                            aria-label={`Remove tag ${tag}`}
                            className="-mr-0.5 flex size-4 items-center justify-center rounded-full text-muted-foreground transition-[color,background-color] duration-150 hover:bg-destructive/20 hover:text-destructive"
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
                  <dl className="divide-y divide-white/[0.06]">
                    {/* "Last edited" lived here and in the toolbar byline — the
                        same fact twice, six inches apart. */}
                    <DetailRow label="Created" value={formatDate(session.createdAt)} />
                    <DetailRow
                      label="Variations"
                      value={
                        session.variations.length === 0 ? "None" : `${session.variations.length}`
                      }
                    />
                    <DetailRow
                      label="Comments"
                      value={
                        session.comments.length === 0 ? "None" : `${session.comments.length}`
                      }
                    />
                  </dl>
                </RailCard>
              </Stagger>
            </div>
          </aside>
        </div>
      </div>

      <PostTypeModal
        open={typeModalOpen}
        onOpenChange={setTypeModalOpen}
        mode="change"
        current={session.postType}
        onSelect={(postType) => {
          // assets are kept, just unused while Reshare — nothing is destroyed
          onUpdate({ postType });
          setTypeModalOpen(false);
        }}
      />

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
        "overflow-hidden rounded-2xl bg-white/[0.025] shadow-[0_1px_2px_rgba(0,0,0,0.25),0_12px_28px_-20px_rgba(0,0,0,0.8)] inset-ring-1 inset-ring-white/[0.07] transition-[box-shadow] duration-200",
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
  comments,
  onComment,
}: {
  label: string;
  action?: React.ReactNode;
  comments?: Comment[];
  onComment?: () => void;
}) {
  return (
    <div className="group/row flex min-h-11 items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.015] px-4 py-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {action}
        {onComment && (
          <CommentButton comments={comments ?? []} onClick={onComment} />
        )}
      </div>
    </div>
  );
}

export function RailCard({
  label,
  comments,
  onComment,
  children,
}: {
  label: string;
  comments?: Comment[];
  onComment?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white/[0.022] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.2)] inset-ring-1 inset-ring-white/[0.06]">
      <div className="mb-2.5 flex min-h-6 items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        {onComment && <CommentButton comments={comments ?? []} onClick={onComment} />}
      </div>
      {children}
    </section>
  );
}

export function CommentButton({
  comments,
  onClick,
}: {
  comments: Comment[];
  onClick: () => void;
}) {
  // Empty state hides until you are actually in the section. Five identical grey
  // bubbles down the sheet said "no comments here" five times — the same non-fact
  // repeated, and it read as chrome rather than as an invitation. Once a thread
  // exists the button is always visible, because then it carries real content.
  //
  // Requires `group/row` on the section that contains it.
  if (comments.length === 0) {
    return (
      <button
        onClick={onClick}
        aria-label="Add comment"
        title="Comment on this section"
        className="relative flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground/65 opacity-0 transition-[opacity,background-color,color,scale] duration-200 before:absolute before:-inset-1 before:content-[''] hover:bg-white/[0.06] hover:text-muted-foreground focus-visible:opacity-100 active:scale-[0.96] group-hover/row:opacity-100 group-focus-within/row:opacity-100"
      >
        <MessageCircle className="size-3.5" />
      </button>
    );
  }
  const lastAuthor = comments[comments.length - 1].author;
  return (
    <button
      onClick={onClick}
      aria-label={`${countComments(comments)} comments`}
      className="relative flex size-8 shrink-0 items-center justify-center rounded-full transition-[background-color,scale] duration-150 before:absolute before:-inset-1 before:content-[''] hover:bg-white/[0.06] active:scale-[0.96]"
    >
      <Avatar className="size-5 inset-ring-1 inset-ring-white/10">
        <AvatarFallback className="text-[9px]">{lastAuthor.name[0]}</AvatarFallback>
      </Avatar>
      <span className="absolute bottom-0.5 right-0.5 flex size-3.5 items-center justify-center rounded-full bg-violet-500 text-[8px] font-semibold tabular-nums text-white ring-2 ring-background">
        {countComments(comments)}
      </span>
    </button>
  );
}

/**
 * Who touched it last, and when. It sat under the post title, where it competed
 * with the title for the eye and pushed the readiness line further down. It is
 * provenance, not content — so it belongs in the toolbar beside the save state,
 * which is the other thing on screen reporting on the file rather than in it.
 */
export function Byline({ session }: { session: Session }) {
  return (
    <span className="hidden min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
      <Avatar className="size-4 shrink-0 inset-ring-1 inset-ring-white/10">
        <AvatarFallback className="text-[8px]">
          {session.lastEditedBy?.name?.[0] ?? "?"}
        </AvatarFallback>
      </Avatar>
      <span className="max-w-[120px] truncate">
        {session.lastEditedBy?.name ?? "Unknown"}
      </span>
      <span aria-hidden className="size-1 shrink-0 rounded-full bg-muted-foreground/40" />
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
      // Link blue: these two navigate away from the copy field rather than
      // acting on it, and blue is the one colour the web already reads as "goes
      // somewhere". It also keeps them out of the violet the app spends on state.
      className="flex h-7 items-center gap-1.5 rounded-full px-2 text-xs font-medium text-[#60a5fa] transition-[background-color,color,scale] duration-150 hover:bg-[#60a5fa]/10 hover:text-[#93c5fd] active:scale-[0.96]"
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
      <span className="relative hidden h-1 w-10 overflow-hidden rounded-full bg-white/10 @[460px]:block">
        <span
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-300",
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
 * Character budgets read as a traffic light rather than as brand colour: violet
 * said nothing about whether you were safe, and the whole app is violet anyway,
 * so the meter was decoration. Green / amber / red is the one colour language
 * everybody already knows without a legend.
 *
 * The amber band starts at 90%, not 80% — warn too early and the warning stops
 * meaning anything.
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
 * used to sit here restated what all three meters already say — and said it a
 * fourth time. Word count is the only number the meters do not carry.
 */
export function CopyMeta({ words, count }: { words: number; count: number }) {
  return (
    // @container so the meters answer the pane's width: with the discussion
    // panel open they used to wrap onto a second line. Below 460px the bars drop
    // and the numbers stay, which is the part that actually carries the meaning.
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 @container">
      <span className="text-[11px] tabular-nums text-muted-foreground">
        {words} {words === 1 ? "word" : "words"}
      </span>
      <CopyLimits count={count} />
    </div>
  );
}

/**
 * Flat black pill with a hairline stroke. Nothing else — no gradient, no sheen,
 * no glow. It stays discoverable without outranking Send, which is the button
 * that actually publishes.
 */
export function AiAssistButton({ className }: { className?: string }) {
  return (
    <button
      title="AI Assist"
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-full bg-[oklch(0.19_0_0)] px-2.5 text-xs font-medium text-foreground/90 inset-ring-1 inset-ring-white/[0.12] transition-[background-color,color,scale] duration-150 hover:bg-[oklch(0.24_0_0)] hover:text-foreground active:scale-[0.96]",
        className,
      )}
    >
      <Sparkles className="size-3.5" />
      AI Assist
    </button>
  );
}

/**
 * Suggestions, optionally revealed on demand.
 *
 * Always-on, two of these rows sat permanently in the lower third of the sheet —
 * a wall of chips you are mostly not using. With `collapsible`, the row grows
 * out of the field when it takes focus: a 0fr→1fr grid row, with the content in
 * a min-h-0 clip box so the collapsed track actually reaches zero. Focus stays
 * inside while you click a chip, so the row does not shut under your cursor.
 *
 * Requires `group/field` on the wrapper that holds both the input and this row.
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
      className="flex h-8 items-center rounded-full bg-white/[0.035] px-2.5 text-[11px] font-medium text-muted-foreground inset-ring-1 inset-ring-white/[0.08] transition-[background-color,color,box-shadow,scale] duration-150 hover:bg-violet-500/12 hover:text-violet-200 hover:inset-ring-violet-400/40 active:scale-[0.96]"
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
  return <span className="size-1 rounded-full bg-muted-foreground/40" />;
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
  saveSource,
  isDirty,
  onClick,
}: {
  saveStatus: "idle" | "saving" | "saved";
  saveSource: "blur" | "timer" | "instant" | null;
  /** Drafts differ from the saved session — work is genuinely not persisted yet. */
  isDirty: boolean;
  onClick: () => void;
}) {
  const saving = saveStatus === "saving";
  // Dirty must win over "saved": having typed since the last flush is the whole
  // point of the indicator, and claiming "Autosaved" then would be a lie.
  const state = saving ? "saving" : isDirty ? "dirty" : "saved";
  const suffix =
    saveSource === "timer" ? " (30s timer)" : saveSource === "blur" ? " (on blur)" : "";

  return (
    <button
      onClick={onClick}
      title="Save now (⌘S). Also autosaves on focus loss or every 30 seconds"
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs inset-ring-1 transition-[background-color,box-shadow,scale] duration-150 active:scale-[0.96]",
        state === "dirty"
          ? "bg-amber-500/[0.08] inset-ring-amber-400/25 hover:bg-amber-500/15"
          : "bg-white/[0.03] inset-ring-white/[0.08] hover:bg-white/[0.07] hover:inset-ring-white/15",
      )}
    >
      {/* all three icons stay mounted and cross-fade, so swaps animate in and out */}
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
            "absolute size-1.5 rounded-full bg-amber-400 transition-[opacity,scale,filter] duration-200",
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
        {state === "saving"
          ? `Saving${suffix}…`
          : state === "dirty"
            ? "Unsaved changes"
            : `Autosaved${suffix}`}
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
