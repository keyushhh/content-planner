"use client";

import { useState } from "react";
import {
  AlertCircle,
  AtSign,
  ChevronsRight,
  Layers,
  Repeat2,
  Lock,
  RefreshCw,
  Send,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { openFeedback } from "@/lib/feedback";
import { MediaThumb } from "./media-thumb";
import {
  Banner,
  Chip,
  ChipRow,
  FeedbackButton,
  FeedbackToolbarButton,
  EASE,
  GhostAction,
  CopyMeta,
  AiAssistButton,
  Byline,
  SaveChip,
  Stagger,
  MEDIA_COPY,
  TAG_SUGGESTIONS,
  formatDate,
  useComposerShortcuts,
  useTagFlash,
  type ComposerLayoutProps,
} from "./session-composer";
import type { Feedback } from "@/lib/types";

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

  useComposerShortcuts({ savePendingChanges, readyToSend, onOpenSend });
  const { flashedTag, flashTag } = useTagFlash();

  const feedbackFor = (sectionLabel: string) =>
    session.feedback.filter((f) => f.sectionLabel === sectionLabel);
  const openCount = openFeedback(session.feedback).length;
  const media = MEDIA_COPY[session.postType];
  const canAddMore = session.visualAssetIds.length < media.max;

  const checklist = [
    { label: "copy", done: copyDraft.trim().length > 0 },
    // Reshare has no media of its own, so requiring an asset would make it
    // permanently incomplete.
    ...(session.postType === "Reshare"
      ? []
      : [
          {
            label: media.checklist,
            done: session.visualAssetIds.length > 0,
          },
        ]),
    { label: "tags", done: session.tags.length > 0 },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const missing = checklist.filter((c) => !c.done).map((c) => c.label);
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
              // Appears the instant the last checklist item lands — the sheet's
              // most triumphant moment, so it arrives rather than blinking in.
              className="h-8 animate-in gap-1.5 rounded-full bg-violet-600 px-3.5 text-sm text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_16px_-8px_rgba(139,92,246,0.7)] duration-300 fade-in zoom-in-95 inset-ring-1 inset-ring-white/15 transition-[background-color,scale] hover:bg-violet-500 active:scale-[0.96]"
              onClick={onOpenSend}
              title={`${needsResend ? "Send update" : "Send to campaign"} (⌘↵)`}
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
        className={cn(
          "min-h-0 flex-1 overflow-y-auto transition-[background-image] duration-500",
          // the canvas itself loses its violet cast when the post is locked
          isCampaignLocked
            ? "bg-[radial-gradient(120%_80%_at_50%_0%,rgba(255,255,255,0.02),transparent_60%)]"
            : "bg-[radial-gradient(120%_80%_at_50%_0%,rgba(139,92,246,0.055),transparent_60%)]",
        )}
      >
        {/* items-start: the sheet sizes to its content instead of stretching, so no
            dead space opens up inside it. The surrounding canvas margin is deliberate. */}
        <div className="flex min-h-full items-start justify-center px-7 pb-12 pt-6 @container">
          <Stagger
            index={0}
            className={cn(
              "flex w-full max-w-[900px] flex-col overflow-hidden rounded-[28px] transition-[filter,box-shadow,background-color] duration-500",
              // A locked document should look locked from across the room: colour
              // drains out and it settles lower, as though set down rather than held.
              isCampaignLocked
                ? "bg-white/[0.018] shadow-[0_1px_3px_rgba(0,0,0,0.45)] saturate-50 inset-ring-1 inset-ring-white/[0.05]"
                : "bg-white/[0.028] shadow-[0_2px_4px_rgba(0,0,0,0.3),0_28px_64px_-32px_rgba(0,0,0,1)] inset-ring-1 inset-ring-white/[0.08]",
            )}
          >
            {/* Readiness reads as a hairline at the sheet's edge, not another card.
                It is meaningless once the post is live, so it goes away entirely. */}
            {!isCampaignLocked && (
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
            )}
            {/* Specular edge — light catching the rim of a physical surface */}
            <div
              className={cn(
                "h-px w-full shrink-0 bg-gradient-to-r from-transparent to-transparent transition-colors duration-500",
                isCampaignLocked ? "via-white/[0.04]" : "via-white/[0.09]",
              )}
            />

            {/* Title */}
            <Stagger index={1} className="px-9 pb-7 pt-8">
              <div className="min-w-0">
                <input
                  value={titleDraft}
                  onChange={(e) => onTitleChange(e.target.value)}
                  onBlur={() => savePendingChanges("blur")}
                  disabled={isCampaignLocked}
                  aria-label="Session title"
                  placeholder="Untitled session"
                  className="-mx-2 w-[calc(100%+1rem)] rounded-lg bg-transparent px-2 py-1 text-[32px] font-semibold leading-[1.12] tracking-[-0.028em] caret-violet-400 outline-none transition-colors duration-150 hover:bg-white/[0.03] focus:bg-white/[0.045] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-transparent"
                />
                {/* Byline moved to the toolbar, so this line now carries one
                    thought only: how close this post is to being sendable. */}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-0.5 text-[13px] text-muted-foreground">
                  {isCampaignLocked && (
                    <span className="inline-flex items-center gap-1.5">
                      <Lock className="size-3 shrink-0" />
                      Locked · live on Wozku
                    </span>
                  )}
                  {!isCampaignLocked && (
                    <>
                      {missing.length === 0 ? (
                        <span className="text-emerald-300/90">Ready to send</span>
                      ) : (
                        <span>
                          <span className="tabular-nums">
                            {doneCount} of {checklist.length}
                          </span>{" "}
                          ready&nbsp;· needs {missing.join(", ")}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Stagger>

            {/* Copy — the writing surface, flush to the sheet, no nested box.
                Focus is expressed as the section lighting up rather than a ring,
                which would contradict the flush treatment. */}
            <Stagger index={2}>
              {/* Focus is a barely-there warming of the whole section, nothing
                  more. Tinting the section's own border violet drew a full-width
                  line across the sheet — a hard rule where a hint belongs. */}
              <div className="flex flex-col border-t border-white/[0.06] transition-[background-color] duration-300 focus-within:bg-violet-500/[0.03]">
              <div className="group/row flex min-h-11 flex-wrap items-center justify-between gap-2 px-9 py-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  <label
                    htmlFor="canvas-copy"
                    className="w-fit cursor-pointer text-[13px] font-medium text-muted-foreground"
                  >
                    Copy
                  </label>
                  <FeedbackButton
                    items={feedbackFor("Copy")}
                    onClick={() => onOpenFeedback("Copy")}
                  />
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
                  <AiAssistButton className="ml-1" />
                </div>
              </div>
              {/* relative: hosts the stand-in caret below */}
              <div className="relative">
                <textarea
                  id="canvas-copy"
                  value={copyDraft}
                  onChange={(e) => onCopyChange(e.target.value)}
                  onBlur={() => savePendingChanges("blur")}
                  placeholder="Write your post…"
                  disabled={isCampaignLocked}
                  className="peer block min-h-[260px] w-full resize-y bg-transparent px-9 pb-6 pt-1 text-[16px] leading-[1.7] caret-violet-400 outline-none placeholder:text-muted-foreground/40 disabled:cursor-not-allowed disabled:opacity-70"
                />
                {/* Empty and unfocused, the field looked inert — no caret, and a
                    placeholder alone does not say "type here". This blinks in the
                    gutter just ahead of the text origin, so nothing shifts when
                    the real caret takes over on focus. */}
                {!copyDraft && !isCampaignLocked && (
                  <span
                    aria-hidden
                    style={{ animation: "copy-caret-blink 1.1s steps(1, end) infinite" }}
                    className="pointer-events-none absolute left-[32px] top-[8px] h-[19px] w-px bg-violet-400 transition-opacity duration-150 peer-focus:!opacity-0"
                  />
                )}
              </div>
              <div className="px-9 pb-4">
                <CopyMeta words={wordCount} count={copyDraft.length} />
              </div>
              </div>
            </Stagger>

            {/* Settings-style rows: label left, control right */}
            {/* No "Post type" row: the type is chosen in the creation modal and
                cannot change afterwards, so restating it here spent a row of the
                sheet on a fact you already acted on. It still decides which rows
                exist below — that is where you see it. */}

            {/* Reshare carries no media of its own — Wozku keeps the original
                post's. So the row states that instead of offering a picker that
                would not do anything. */}
            {session.postType === "Reshare" ? (
              // anchored to "Assets", not "Media", so a comment about the post's
              // imagery survives a switch between Image and Reshare
              <SettingRow
                label="Media"
                feedback={feedbackFor("Assets")}
                onFeedback={() => onOpenFeedback("Assets")}
                staggerIndex={4}
                valueAlign="end"
              >
                <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Repeat2 className="size-3.5 shrink-0" />
                  Comes from the post you&rsquo;re resharing
                </span>
              </SettingRow>
            ) : (
            <SettingRow
              label={media.section}
              feedback={feedbackFor("Assets")}
              onFeedback={() => onOpenFeedback("Assets")}
              // a single pill sits right; a wrapping thumbnail grid must start
              // left, or the ragged edge lands on the wrong side
              align={session.visualAssetIds.length > 0 ? "start" : "center"}
              valueAlign={session.visualAssetIds.length > 0 ? "start" : "end"}
              staggerIndex={4}
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
                  {media.cta}
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
                        url={mediaAssets.find((a) => a.id === assetId)?.url}
                        name={mediaAssets.find((a) => a.id === assetId)?.name}
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
                  {!isCampaignLocked && canAddMore && (
                    <button
                      onClick={onOpenMediaLibrary}
                      title="Pick from Media Library"
                      aria-label="Add another asset"
                      // solid hairline, not dashed — a dashed edge reads as a
                      // wireframe placeholder rather than a real control
                      className="flex size-20 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.03] text-muted-foreground inset-ring-1 inset-ring-white/[0.08] transition-[background-color,box-shadow,color,scale] duration-200 hover:bg-violet-500/[0.08] hover:text-violet-300 hover:inset-ring-violet-400/40 active:scale-[0.97]"
                    >
                      <UploadCloud className="size-5" />
                    </button>
                  )}
                </div>
              )}
            </SettingRow>
            )}

            <SettingRow
              label="Tags"
              htmlFor="canvas-tags"
              feedback={feedbackFor("Tags")}
              onFeedback={() => onOpenFeedback("Tags")}
              align="start"
              staggerIndex={5}
            >
              <div className="group/field w-full">
                <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-[10px] bg-white/[0.04] p-1.5 inset-ring-1 inset-ring-white/[0.08] transition-[box-shadow,background-color] duration-200 focus-within:bg-white/[0.06] focus-within:inset-ring-violet-400/50">
                  {session.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium inset-ring-1 transition-[background-color,box-shadow,scale] duration-200",
                        flashedTag === tag
                          ? "scale-[1.06] bg-amber-500/20 inset-ring-amber-400/50"
                          : "bg-white/[0.08] inset-ring-white/[0.06]",
                      )}
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
                    id="canvas-tags"
                    value={tagDraft}
                    onChange={(e) => onTagDraftChange(e.target.value)}
                    disabled={isCampaignLocked}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === ",") && tagDraft.trim()) {
                        e.preventDefault();
                        const next = tagDraft.trim().toLowerCase();
                        if (session.tags.includes(next)) {
                          flashTag(next);
                          return;
                        }
                        onUpdate({ tags: [...session.tags, next] });
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
                    className="h-6 min-w-24 flex-1 bg-transparent px-1 text-sm caret-violet-400 outline-none placeholder:text-muted-foreground/75 disabled:cursor-not-allowed"
                  />
                </div>
                {!isCampaignLocked && (
                  <ChipRow collapsible>
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
            <Stagger
              index={6}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/[0.06] bg-white/[0.012] px-9 py-3 text-[11px] text-muted-foreground"
            >
              {/* Only facts that exist. "No variations · No comments" was two
                  lines of nothing, stated every time. */}
              <span className="tabular-nums">Created {formatDate(session.createdAt)}</span>
              {session.variations.length > 0 && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="tabular-nums">
                    {session.variations.length} variation
                    {session.variations.length === 1 ? "" : "s"}
                  </span>
                </>
              )}
              {session.feedback.length > 0 && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="tabular-nums">
                    {openCount > 0
                      ? `${openCount} open feedback`
                      : `${session.feedback.length} feedback, all closed`}
                  </span>
                </>
              )}
            </Stagger>
          </Stagger>
        </div>
      </div>

      {unlockDialog}
    </div>
  );
}

/**
 * Label left, value right. Two columns, not three.
 *
 * The third column was a permanent 32px slot for a feedback button that only
 * appeared on hover — a dead stripe running the height of the sheet, and the
 * empty space a tooltip kept firing into. The control now rides beside the
 * label, in room the label was never using, so the row loses the gutter without
 * losing the affordance and the value column gains the width back.
 */
function SettingRow({
  label,
  htmlFor,
  align = "center",
  valueAlign = "end",
  feedback,
  onFeedback,
  staggerIndex,
  children,
}: {
  label: string;
  /** Bind the label to its control so clicking it focuses the field. */
  htmlFor?: string;
  align?: "center" | "start";
  valueAlign?: "start" | "end";
  feedback?: Feedback[];
  onFeedback?: () => void;
  staggerIndex: number;
  children: React.ReactNode;
}) {
  const Label = htmlFor ? "label" : "span";
  return (
    <Stagger index={staggerIndex}>
      <div
        className={cn(
          "group/row grid gap-x-4 gap-y-2.5 border-t border-white/[0.06] px-9 py-4",
          "grid-cols-1 @[560px]:grid-cols-[168px_minmax(0,1fr)]",
          "transition-[background-color] duration-300 focus-within:bg-violet-500/[0.03]",
          align === "center" ? "items-center" : "items-start",
        )}
      >
      <span
        className={cn(
          "flex items-center gap-1.5",
          align === "start" && "@[560px]:pt-2",
        )}
      >
        <Label
          htmlFor={htmlFor}
          className={cn(
            "text-[13px] font-medium text-muted-foreground",
            htmlFor && "w-fit cursor-pointer",
          )}
        >
          {label}
        </Label>
        {onFeedback && (
          <FeedbackButton items={feedback ?? []} onClick={onFeedback} />
        )}
      </span>
      <div
        className={cn(
          "flex min-w-0 justify-start",
          valueAlign === "end" && "@[560px]:justify-end",
        )}
      >
        {children}
      </div>
      </div>
    </Stagger>
  );
}
