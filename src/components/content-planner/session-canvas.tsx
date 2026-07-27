"use client";

import { useState } from "react";
import {
  AlertCircle,
  AtSign,
  ChevronsRight,
  Layers,
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
import { cn } from "@/lib/utils";
import { MediaThumb } from "./media-thumb";
import {
  Banner,
  Chip,
  ChipRow,
  CommentButton,
  EASE,
  GhostAction,
  HASHTAG_SUGGESTIONS,
  LimitMeter,
  SaveChip,
  Stagger,
  TAG_SUGGESTIONS,
  formatDate,
  type ComposerLayoutProps,
} from "./session-composer";

/**
 * Canvas layout — the single-column alternative to SessionComposer.
 *
 * One elevated "document" centred on a washed canvas. No side rail: sections are
 * divided by hairlines inside a single sheet, and the secondary fields use
 * label-left / control-right rows (the macOS System Settings pattern) so they
 * read as settings rather than as more form to fill.
 */
export function SessionCanvas({
  session,
  mediaAssets,
  isCampaignLocked,
  titleDraft,
  onTitleChange,
  copyDraft,
  onCopyChange,
  hashtagsDraft,
  onHashtagsChange,
  tagDraft,
  onTagDraftChange,
  saveStatus,
  saveSource,
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

  const commentsFor = (fieldLabel: string) =>
    session.comments.filter((c) => c.fieldLabel === fieldLabel);

  const checklist = [
    { label: "Copy", done: copyDraft.trim().length > 0 },
    { label: "Asset", done: session.visualAssetIds.length > 0 },
    { label: "Hashtags", done: hashtagsDraft.trim().length > 0 },
    { label: "Tags", done: session.tags.length > 0 },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const wordCount = copyDraft.trim() ? copyDraft.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
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
          <span
            aria-hidden={!scrolled}
            className={cn(
              "min-w-0 truncate text-sm font-medium transition-[opacity,translate] duration-200",
              scrolled
                ? "translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-1 opacity-0",
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
              className="h-8 gap-1.5 rounded-full bg-violet-600 px-3.5 text-sm text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_16px_-8px_rgba(139,92,246,0.7)] inset-ring-1 inset-ring-white/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-[0.96]"
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

          <SaveChip
            saveStatus={saveStatus}
            saveSource={saveSource}
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
            {session.comments.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-semibold tabular-nums text-white ring-2 ring-background">
                {session.comments.length}
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

      {/* Canvas — the wash makes the surrounding space read as deliberate margin */}
      <div
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
        className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(120%_80%_at_50%_0%,rgba(139,92,246,0.055),transparent_60%)]"
      >
        {/* items-start: the sheet sizes to its content instead of stretching, so no
            dead space opens up inside it. The surrounding canvas margin is deliberate. */}
        <div className="flex min-h-full items-start justify-center px-7 pb-12 pt-6 @container">
          <Stagger
            index={0}
            className="flex w-full max-w-[900px] flex-col overflow-hidden rounded-[28px] bg-white/[0.028] shadow-[0_2px_4px_rgba(0,0,0,0.3),0_28px_64px_-32px_rgba(0,0,0,1)] inset-ring-1 inset-ring-white/[0.08]"
          >
            {/* Readiness reads as a hairline at the sheet's edge, not another card */}
            <div className="flex h-0.5 w-full shrink-0 overflow-hidden">
              {checklist.map((item, i) => (
                <span
                  key={item.label}
                  className={cn(
                    "h-full flex-1 transition-colors duration-500",
                    i < doneCount ? "bg-violet-400" : "bg-white/[0.06]",
                  )}
                  style={{ transitionTimingFunction: EASE }}
                />
              ))}
            </div>

            {/* Title */}
            <div className="flex flex-wrap items-end justify-between gap-4 px-9 pb-7 pt-8">
              <div className="min-w-0 flex-1">
                <input
                  value={titleDraft}
                  onChange={(e) => onTitleChange(e.target.value)}
                  onBlur={() => savePendingChanges("blur")}
                  disabled={isCampaignLocked}
                  aria-label="Session title"
                  className="-mx-2 w-[calc(100%+1rem)] rounded-lg bg-transparent px-2 py-1 text-[32px] font-semibold leading-[1.12] tracking-[-0.028em] caret-violet-400 outline-none transition-colors duration-150 hover:bg-white/[0.03] focus:bg-white/[0.045] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-transparent"
                />
                <div className="mt-2.5 flex items-center gap-2 pl-0.5 text-[13px] text-muted-foreground">
                  <Avatar className="size-5 inset-ring-1 inset-ring-white/10">
                    <AvatarFallback className="text-[9px]">
                      {session.lastEditedBy?.name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground/80">
                    {session.lastEditedBy?.name ?? "Unknown"}
                  </span>
                  <span className="size-1 rounded-full bg-muted-foreground/40" />
                  <span className="tabular-nums">Edited {formatDate(session.updatedAt)}</span>
                </div>
              </div>

              {!isCampaignLocked && (
                <div className="flex shrink-0 items-center gap-2 pb-1">
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {doneCount}/{checklist.length} ready
                  </span>
                  {/* fills left-to-right by count — these are progress, not per-item state */}
                  <span className="flex items-center gap-1">
                    {checklist.map((item, i) => (
                      <span
                        key={item.label}
                        className={cn(
                          "size-1.5 rounded-full transition-colors duration-300",
                          i < doneCount ? "bg-violet-400" : "bg-white/15",
                        )}
                      />
                    ))}
                  </span>
                </div>
              )}
            </div>

            {/* Copy — the writing surface, flush to the sheet, no nested box */}
            <div className="flex flex-col border-t border-white/[0.06]">
              <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 px-9 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/75">
                  Copy
                </span>
                <div className="-mr-1.5 flex items-center gap-1">
                  <GhostAction onClick={onOpenVariations} icon={Layers}>
                    Post Variations
                    {session.variations.length > 0 && (
                      <span className="ml-1 rounded-full bg-violet-500/20 px-1.5 text-[10px] font-semibold tabular-nums text-violet-200">
                        {session.variations.length}
                      </span>
                    )}
                  </GhostAction>
                  <GhostAction icon={AtSign}>Add Mentions</GhostAction>
                  <button className="ml-1 flex h-7 items-center gap-1.5 rounded-full bg-gradient-to-b from-violet-500 to-indigo-600 px-2.5 text-xs font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.35),0_6px_16px_-10px_rgba(139,92,246,0.9)] inset-ring-1 inset-ring-white/20 transition-[filter,scale] duration-150 hover:brightness-110 active:scale-[0.96]">
                    <Sparkles className="size-3.5" />
                    AI Assist
                  </button>
                  <CommentButton
                    comments={commentsFor("Copy")}
                    onClick={() => onOpenDiscussion("Copy")}
                  />
                </div>
              </div>
              <textarea
                value={copyDraft}
                onChange={(e) => onCopyChange(e.target.value)}
                onBlur={() => savePendingChanges("blur")}
                placeholder="Write your post…"
                disabled={isCampaignLocked}
                className="block min-h-[260px] w-full resize-y bg-transparent px-9 pb-6 pt-1 text-[16px] leading-[1.7] caret-violet-400 outline-none placeholder:text-muted-foreground/45 disabled:cursor-not-allowed disabled:opacity-70"
              />
              <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 px-9 pb-4">
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                  <span className="mx-1.5 text-muted-foreground/40">·</span>
                  {copyDraft.length} characters
                </span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <LimitMeter label="X" count={copyDraft.length} limit={280} />
                  <LimitMeter label="LinkedIn" count={copyDraft.length} limit={3000} />
                  <LimitMeter label="IG" count={copyDraft.length} limit={2200} />
                </div>
              </div>
            </div>

            {/* Settings-style rows: label left, control right */}
            <SettingRow
              label="Assets"
              comments={commentsFor("Assets")}
              onComment={() => onOpenDiscussion("Assets")}
            >
              {session.visualAssetIds.length === 0 ? (
                <button
                  disabled={isCampaignLocked}
                  onClick={onOpenMediaLibrary}
                  className="group flex items-center gap-2.5 rounded-full bg-white/[0.04] py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium inset-ring-1 inset-ring-white/[0.08] transition-[background-color,box-shadow,scale] duration-150 hover:bg-violet-500/10 hover:inset-ring-violet-400/40 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-violet-500/15 text-violet-300 transition-transform duration-200 group-hover:scale-[1.08]">
                    <UploadCloud className="size-3.5" />
                  </span>
                  Add an image, video or embed
                </button>
              ) : (
                <div className="flex flex-wrap justify-end gap-2.5">
                  {session.visualAssetIds.map((assetId) => (
                    <div
                      key={assetId}
                      className="group relative size-20 shrink-0 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.3)] outline outline-1 -outline-offset-1 outline-white/10"
                    >
                      <MediaThumb
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
                      className="flex size-20 shrink-0 items-center justify-center rounded-[10px] border border-dashed border-white/15 text-muted-foreground transition-[background-color,border-color,color,scale] duration-200 hover:border-violet-400/50 hover:bg-violet-500/[0.06] hover:text-violet-300 active:scale-[0.97]"
                    >
                      <UploadCloud className="size-5" />
                    </button>
                  )}
                </div>
              )}
            </SettingRow>

            <SettingRow
              label="Hashtags"
              comments={commentsFor("Hashtags")}
              onComment={() => onOpenDiscussion("Hashtags")}
              align="start"
            >
              <div className="w-full">
                <input
                  value={hashtagsDraft}
                  onChange={(e) => onHashtagsChange(e.target.value)}
                  onBlur={() => savePendingChanges("blur")}
                  placeholder="#product #launch"
                  disabled={isCampaignLocked}
                  className="h-9 w-full rounded-[10px] bg-white/[0.04] px-3 text-sm caret-violet-400 inset-ring-1 inset-ring-white/[0.08] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted-foreground/55 focus:bg-white/[0.06] focus:inset-ring-violet-400/50 disabled:cursor-not-allowed disabled:opacity-60"
                />
                {!isCampaignLocked && (
                  <ChipRow>
                    {HASHTAG_SUGGESTIONS.filter((ht) => !hashtagsDraft.includes(ht))
                      .slice(0, 5)
                      .map((ht) => (
                        <Chip
                          key={ht}
                          onClick={() => {
                            const trimmed = hashtagsDraft.trim();
                            const next = trimmed ? `${trimmed} ${ht}` : ht;
                            onHashtagsChange(next);
                            onUpdateWithPendingSave({ hashtags: next });
                          }}
                        >
                          {ht}
                        </Chip>
                      ))}
                  </ChipRow>
                )}
              </div>
            </SettingRow>

            <SettingRow label="Tags" align="start">
              <div className="w-full">
                <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-[10px] bg-white/[0.04] p-1.5 inset-ring-1 inset-ring-white/[0.08] transition-[box-shadow,background-color] duration-200 focus-within:bg-white/[0.06] focus-within:inset-ring-violet-400/50">
                  {session.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex h-6 items-center gap-1.5 rounded-md bg-white/[0.08] px-2 text-xs font-medium inset-ring-1 inset-ring-white/[0.06]"
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
                    className="h-6 min-w-24 flex-1 bg-transparent px-1 text-sm caret-violet-400 outline-none placeholder:text-muted-foreground/55 disabled:cursor-not-allowed"
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
              </div>
            </SettingRow>

            {/* Colophon — metadata as a quiet footer, not a card */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/[0.06] bg-white/[0.012] px-9 py-3 text-[11px] text-muted-foreground/70">
              <span className="tabular-nums">Created {formatDate(session.createdAt)}</span>
              <span className="text-muted-foreground/30">·</span>
              <span className="tabular-nums">
                {session.variations.length === 0
                  ? "No variations"
                  : `${session.variations.length} variation${session.variations.length === 1 ? "" : "s"}`}
              </span>
              <span className="text-muted-foreground/30">·</span>
              <span className="tabular-nums">
                {session.comments.length === 0
                  ? "No comments"
                  : `${session.comments.length} comment${session.comments.length === 1 ? "" : "s"}`}
              </span>
            </div>
          </Stagger>
        </div>
      </div>

      {unlockDialog}
    </div>
  );
}

function SettingRow({
  label,
  align = "center",
  comments,
  onComment,
  children,
}: {
  label: string;
  align?: "center" | "start";
  comments?: import("@/lib/types").Comment[];
  onComment?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-x-4 gap-y-2.5 border-t border-white/[0.06] px-9 py-4",
        "grid-cols-1 @[560px]:grid-cols-[132px_minmax(0,1fr)_auto]",
        align === "center" ? "items-center" : "items-start",
      )}
    >
      <span
        className={cn(
          "text-[13px] font-medium text-muted-foreground",
          align === "start" && "@[560px]:pt-2",
        )}
      >
        {label}
      </span>
      <div className="flex min-w-0 justify-start @[560px]:justify-end">{children}</div>
      <div className={cn("hidden @[560px]:flex", align === "start" && "pt-0.5")}>
        {onComment ? (
          <CommentButton comments={comments ?? []} onClick={onComment} />
        ) : (
          <span className="size-8" aria-hidden />
        )}
      </div>
    </div>
  );
}
