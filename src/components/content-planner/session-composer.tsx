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
import { MEDIA_COPY, assetsForType } from "@/lib/media";
import { postReadiness } from "@/lib/readiness";
import { MediaThumb } from "./media-thumb";
import { MentionAutocomplete, MentionList, useMentionTarget } from "./mention-list";
import { accountsByIds, stripMention, type MentionAccount } from "@/lib/mentions";
import { PostAiAssist } from "./variation-generator";
import type { Feedback, MediaAsset, PostType, Session } from "@/lib/types";

export const POST_TYPES: { id: PostType; icon: typeof Layers2 }[] = [
  { id: "Image", icon: ImageIcon },
  { id: "Frames", icon: Layers2 },
  { id: "PDF", icon: FileText },
  { id: "Reshare", icon: Repeat2 },
];

export { MEDIA_COPY, assetsForType };

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
  onUpdateWithPendingSave,
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
  const [mentionsOpen, setMentionsOpen] = useState(false);
  const [copyArea, mention] = useMentionTarget(copyDraft, onCopyChange);
  const aiAssist = usePostAiAssist();

  useComposerShortcuts({ savePendingChanges, readyToSend, onOpenSend });

  const activeMentions = accountsByIds(session.mentionedAccountIds);

  function toggleMention(account: MentionAccount) {
    if (session.mentionedAccountIds.includes(account.id)) {
      const stripped = stripMention(copyDraft, account.handle);
      onCopyChange(stripped);
      mention.clamp(stripped);
      onUpdate({
        mentionedAccountIds: session.mentionedAccountIds.filter((id) => id !== account.id),
      });
    } else {
      mention.insert(account.handle);
      onUpdate({ mentionedAccountIds: [...session.mentionedAccountIds, account.id] });
    }
  }

  const feedbackFor = (sectionLabel: string) =>
    session.feedback.filter((f) => f.sectionLabel === sectionLabel);
  const openCount = openFeedback(session.feedback).length;
  const media = MEDIA_COPY[session.postType];
  const canAddMore = session.visualAssetIds.length < media.max;

  const RAIL_LABEL: Record<string, string> = {
    copy: "Copy written",
    assets: media.attached,
    tags: "Tagged",
  };
  const checklist = postReadiness(session, copyDraft).map((item) => ({
    ...item,
    label: RAIL_LABEL[item.field],
  }));
  const doneCount = checklist.filter((c) => c.done).length;
  const wordCount = copyDraft.trim() ? copyDraft.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
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
            aria-label="Save and collapse this post"
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

      <div
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
        className="@container min-h-0 flex-1 overflow-y-auto @[880px]:overflow-hidden"
      >
        <div className="grid min-h-full grid-cols-1 @[880px]:h-full @[880px]:grid-cols-[minmax(0,1fr)_352px]">
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
                  aria-label="Post title"
                  placeholder="Untitled post"
                  data-pane-title
                  className="-mx-2 w-[calc(100%+1rem)] rounded-lg bg-transparent px-2 py-1 text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] outline-none transition-colors duration-150 hover:bg-(--ink)/[0.03] focus:bg-(--ink)/[0.045] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-transparent"
                />
              </Stagger>

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
                        <GhostAction
                          icon={AtSign}
                          active={mentionsOpen}
                          onClick={() => setMentionsOpen((v) => !v)}
                        >
                          Add Mentions
                          {activeMentions.length > 0 && (
                            <span className="ml-1 rounded-(--r-pill) bg-violet-500/20 px-1.5 text-[10px] font-semibold tabular-nums text-violet-200">
                              {activeMentions.length}
                            </span>
                          )}
                        </GhostAction>
                        <AiAssistButton
                          className="ml-1"
                          active={aiAssist.open}
                          disabled={isCampaignLocked}
                          onClick={() => aiAssist.setOpen((v) => !v)}
                        />
                      </div>
                    }
                  />
                  <div className="relative">
                    <textarea
                      ref={copyArea}
                      value={copyDraft}
                      onChange={mention.onChange}
                      onSelect={mention.onSelect}
                      onKeyDown={mention.onKeyDown}
                      onBlur={() => {
                        mention.onBlur();
                        savePendingChanges("blur");
                      }}
                      placeholder="Write your post…"
                      disabled={isCampaignLocked}
                      className="peer block min-h-[240px] w-full resize-y bg-transparent px-4 py-4 text-[15px] leading-[1.65] caret-violet-400 outline-none placeholder:text-muted-foreground/40 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                    <MentionAutocomplete {...mention.autocomplete} />
                    {!copyDraft && !isCampaignLocked && (
                      <span
                        aria-hidden
                        style={{ animation: "copy-caret-blink 1.1s steps(1, end) infinite" }}
                        className="pointer-events-none absolute left-[12px] top-[19px] h-[18px] w-px bg-violet-400 peer-focus:!opacity-0"
                      />
                    )}
                  </div>
                  {aiAssist.open && (
                    <PostAiAssist
                      source={copyDraft}
                      disabled={isCampaignLocked}
                      onUse={(copy) => {
                        onCopyChange(copy);
                        onUpdateWithPendingSave({ copy });
                      }}
                      onClose={() => aiAssist.setOpen(false)}
                    />
                  )}
                  <div className="border-t border-(--ink)/[0.06] px-4 py-2.5">
                    <CopyMeta words={wordCount} count={copyDraft.length} />
                  </div>
                </Card>
              </Stagger>

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
                      session.visualAssetIds.length > 0 && media.max > 1 ? (
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {session.visualAssetIds.length} attached
                        </span>
                      ) : undefined
                    }
                  />
                  <div className="p-3">
                    {session.visualAssetIds.length === 0 ? (
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

          <aside className="min-w-0 border-(--ink)/[0.06] @[880px]:min-h-0 @[880px]:overflow-y-auto @[880px]:border-l @[880px]:bg-(--sink)/[0.14]">
            {mentionsOpen ? (
              <MentionsPane
                accounts={activeMentions}
                taggedIds={session.mentionedAccountIds}
                disabled={isCampaignLocked}
                onToggle={toggleMention}
                onClose={() => setMentionsOpen(false)}
              />
            ) : (
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
            )}
          </aside>
        </div>
      </div>

      {unlockDialog}
    </div>
  );
}

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

export function Byline({ session }: { session: Session }) {
  return (
    <span className="mr-2 hidden min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
      <Avatar className="size-4 shrink-0 inset-ring-1 inset-ring-(--ink)/10">
        <AvatarFallback className="text-[8px]">
          {session.lastEditedBy?.name?.[0] ?? "\u2013"}
        </AvatarFallback>
      </Avatar>
      <span className="max-w-[120px] truncate">
        {session.lastEditedBy?.name ?? "Not edited yet"}
      </span>
      <span aria-hidden className="size-1 shrink-0 rounded-(--r-round) bg-muted-foreground/40" />
      <span className="shrink-0 tabular-nums">{formatDate(session.updatedAt)}</span>
    </span>
  );
}

export function GhostAction({
  icon: Icon,
  onClick,
  active,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-(--r-pill) px-2 text-xs font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)",
        active && "bg-(--ink)/[0.08] text-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </button>
  );
}

function MentionsPane({
  accounts,
  taggedIds,
  disabled,
  onToggle,
  onClose,
}: {
  accounts: MentionAccount[];
  taggedIds: string[];
  disabled?: boolean;
  onToggle: (account: MentionAccount) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col @container">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-(--ink)/[0.06] px-5 py-3">
        <span className="flex min-w-0 items-center gap-1.5">
          <AtSign className="size-3.5 shrink-0 text-violet-300" />
          <span className="truncate text-[13px] font-semibold tracking-tight">
            Tag community members
          </span>
        </span>
        <button
          onClick={onClose}
          aria-label="Close mentions"
          title="Close mentions"
          className="flex size-7 shrink-0 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {accounts.length > 0 && (
        <div className="shrink-0 border-b border-(--ink)/[0.06] px-5 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Tagged on this post
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {accounts.map((account) => (
              <span
                key={account.id}
                title={account.name}
                className="inline-flex h-7 min-w-0 items-center gap-1 rounded-(--r-pill) bg-blue-400/[0.12] px-2.5 text-[11.5px] font-medium text-blue-100 inset-ring-1 inset-ring-blue-400/25"
              >
                <span className="truncate">@{account.handle}</span>
                {!disabled && (
                  <button
                    onClick={() => onToggle(account)}
                    aria-label={`Remove @${account.handle}`}
                    className="-mr-0.5 flex size-4 shrink-0 items-center justify-center rounded-(--r-pill) text-blue-200/70 transition-[color,background-color] duration-150 hover:bg-destructive/20 hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col px-5 py-3">
        {disabled ? (
          <p className="text-[12px] text-muted-foreground text-pretty">
            This post is locked, so mentions cannot be changed.
          </p>
        ) : (
          <MentionList
            taggedIds={taggedIds}
            onPick={onToggle}
            className="min-h-0 flex-1"
            listClassName="flex-1"
          />
        )}
      </div>

      <div className="shrink-0 border-t border-(--ink)/[0.06] px-5 py-2.5 text-[11px] text-muted-foreground/70">
        Tagged accounts are also inserted at the cursor in your copy
      </div>
    </div>
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

export function CopyMeta({ words, count }: { words: number; count: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 @container">
      <span className="text-[11px] tabular-nums text-muted-foreground">
        {words} {words === 1 ? "word" : "words"}
      </span>
      <CopyLimits count={count} />
    </div>
  );
}

export function AiAssistButton({
  className,
  active,
  disabled,
  onClick,
}: {
  className?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title="AI Assist"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        SECONDARY_ACTION_SM,
        active && "bg-violet-500/12 text-violet-200 inset-ring-violet-400/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <Sparkles className="size-3.5" />
      AI Assist
    </button>
  );
}

export function usePostAiAssist() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}

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
  isDirty: boolean;
  onClick: () => void;
}) {
  const saving = saveStatus === "saving";
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
