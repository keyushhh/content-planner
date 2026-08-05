"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronsRight,
  Circle,
  Layers,
  Repeat2,
  Lock,
  RefreshCw,
  Send,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, tagTint } from "@/lib/utils";
import { openFeedback } from "@/lib/feedback";
import { MediaThumb } from "./media-thumb";
import { MentionAutocomplete, MentionPopover, useMentionTarget } from "./mention-list";
import { stripMention, type MentionAccount } from "@/lib/mentions";
import { PostAiAssist } from "./variation-generator";
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
  usePostAiAssist,
  useTagFlash,
  type ComposerLayoutProps,
} from "./session-composer";
import { missingRequired, postReadiness } from "@/lib/readiness";
import type { Feedback } from "@/lib/types";

/* Jumps to the field a readiness item refers to. */
function focusField(field: string) {
  const row = document.querySelector<HTMLElement>(`[data-field="${field}"]`);
  if (!row) return;
  row.scrollIntoView({ block: "center", behavior: "smooth" });
  // Inputs before buttons: the section's own toolbar buttons come first in DOM order.
  const target =
    row.querySelector<HTMLElement>("textarea, input") ??
    row.querySelector<HTMLElement>("button");
  target?.focus({ preventScroll: true });
}

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
  const [copyArea, mention] = useMentionTarget(copyDraft, onCopyChange);
  const aiAssist = usePostAiAssist();

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

  useComposerShortcuts({ savePendingChanges, readyToSend, onOpenSend });
  const { flashedTag, flashTag } = useTagFlash();

  const feedbackFor = (sectionLabel: string) =>
    session.feedback.filter((f) => f.sectionLabel === sectionLabel);
  const openCount = openFeedback(session.feedback).length;
  const media = MEDIA_COPY[session.postType];
  const canAddMore = session.visualAssetIds.length < media.max;

  const checklist = postReadiness(session, copyDraft);
  const doneCount = checklist.filter((c) => c.done).length;
  const missing = checklist.filter((c) => !c.done);
  const blocking = missingRequired(checklist);
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
          <span data-tour="composer-status" className="flex shrink-0">
            {statusMenu}
          </span>
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
              className="h-8 animate-in gap-1.5 rounded-(--r-pill) bg-violet-600 px-3.5 text-sm text-white shadow-(--lift-accent) duration-300 fade-in zoom-in-95 inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,scale] hover:bg-violet-500 active:scale-(--press)"
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
        className={cn(
          "min-h-0 flex-1 overflow-y-auto transition-[background-image] duration-500",
          isCampaignLocked
            ? "[background-image:var(--wash-neutral)]"
            : "[background-image:var(--wash-page)]",
        )}
      >
        <div className="flex min-h-full items-start justify-center px-7 pb-12 pt-6 @container">
          <Stagger
            index={0}
            className={cn(
              "flex w-full max-w-[900px] flex-col overflow-hidden rounded-(--r-surface) transition-[filter,box-shadow,background-color] duration-500",
              isCampaignLocked
                ? "bg-(--ink)/[0.018] shadow-(--lift-sm) saturate-50 inset-ring-1 inset-ring-(--ink)/[0.05]"
                : "bg-(--ink)/[0.028] shadow-(--lift-lg) [.wozku.wozku-light_&]:shadow-none inset-ring-1 inset-ring-(--ink)/[0.08]",
            )}
          >
            {!isCampaignLocked && (
              <div className="flex h-0.5 w-full shrink-0 overflow-hidden">
                {/* Fills left-to-right by how many items are done, not by which
                    specific field is done — so completing them out of order
                    (e.g. tags before copy) still reads as steady left-to-right
                    progress instead of lighting up a fixed per-field slot. */}
                {checklist.map((item, i) => (
                  <span
                    key={item.field}
                    className={cn(
                      "h-full flex-1 transition-colors duration-500",
                      i < doneCount ? "bg-violet-400" : "bg-(--ink)/[0.06]",
                    )}
                    style={{ transitionTimingFunction: EASE }}
                  />
                ))}
              </div>
            )}
            <div
              className={cn(
                "h-px w-full shrink-0 bg-gradient-to-r from-transparent to-transparent transition-colors duration-500",
                isCampaignLocked ? "via-(--ink)/[0.04]" : "via-(--ink)/[0.09]",
              )}
            />

            <Stagger index={1} className="px-9 pb-7 pt-8">
              <div className="min-w-0">
                <input
                  value={titleDraft}
                  onChange={(e) => onTitleChange(e.target.value)}
                  onBlur={() => savePendingChanges("blur")}
                  disabled={isCampaignLocked}
                  aria-label="Post title"
                  placeholder="Untitled post"
                  data-pane-title
                  className="-mx-2 w-[calc(100%+1rem)] rounded-lg bg-transparent px-2 py-1 text-[32px] font-semibold leading-[1.12] tracking-[-0.028em] caret-violet-400 outline-none transition-colors duration-150 hover:bg-(--ink)/[0.03] focus:bg-(--ink)/[0.045] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-transparent"
                />
                <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-0.5 text-[13px] text-muted-foreground">
                  {!isCampaignLocked && (
                    <>
                      <span className="text-[13px]">{session.postType}</span>
                      <span className="text-muted-foreground/30">&middot;</span>
                    </>
                  )}
                  {isCampaignLocked && (
                    <span className="inline-flex items-center gap-1.5">
                      <Lock className="size-3 shrink-0" />
                      Locked · live on Wozku
                    </span>
                  )}
                  {!isCampaignLocked && (
                    <>
                      {missing.length === 0 ? (
                        <span className="flex items-center gap-1.5 text-live-300/90">
                          <CheckCircle2 className="size-3.5 shrink-0" />
                          Ready to send
                        </span>
                      ) : (
                        <span className="flex flex-wrap items-center gap-x-1.5">
                          <span className="tabular-nums">
                            {blocking.length === 0
                              ? "Ready to approve"
                              : `${doneCount} of ${checklist.length} ready`}
                          </span>
                          <span className="text-muted-foreground/30">&middot;</span>
                          {checklist.map((item) => (
                            <button
                              key={item.field}
                              type="button"
                              onClick={() => focusField(item.field)}
                              title={
                                item.done
                                  ? `${item.label} \u2014 done`
                                  : item.required
                                    ? `${item.label} \u2014 needed before you can approve`
                                    : `${item.label} \u2014 optional, but worth adding`
                              }
                              className={cn(
                                "flex items-center gap-1 rounded-(--r-pill) px-1.5 py-0.5 text-[12.5px] transition-colors duration-200",
                                item.done
                                  ? "text-live-300/90 hover:bg-live-500/10"
                                  : item.required
                                    ? "text-amber-300/90 hover:bg-amber-500/10"
                                    : "text-muted-foreground/70 hover:bg-(--ink)/[0.06]",
                              )}
                            >
                              {item.done ? (
                                <Check className="size-3 shrink-0" />
                              ) : (
                                <Circle className="size-3 shrink-0" />
                              )}
                              {item.label}
                            </button>
                          ))}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Stagger>

            <Stagger index={2}>
              <div
                data-field="copy"
                data-tour="composer-copy"
                className="flex flex-col border-t border-(--ink)/[0.06] transition-[background-color] duration-300 focus-within:bg-violet-500/[0.03]"
              >
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
                      <span className="ml-1 rounded-(--r-pill) bg-violet-500/20 px-1.5 text-[10px] font-semibold tabular-nums text-violet-200">
                        {session.variations.length}
                      </span>
                    )}
                  </GhostAction>
                  <MentionPopover
                    taggedIds={session.mentionedAccountIds}
                    onToggle={toggleMention}
                    disabled={isCampaignLocked}
                  />
                  <AiAssistButton
                    className="ml-1"
                    active={aiAssist.open}
                    disabled={isCampaignLocked}
                    onClick={() => aiAssist.setOpen((v) => !v)}
                  />
                </div>
              </div>
              <div className="relative">
                <textarea
                  id="canvas-copy"
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
                  className="peer block min-h-[260px] w-full resize-y bg-transparent px-9 pb-6 pt-1 text-[16px] leading-[1.7] caret-violet-400 outline-none placeholder:text-muted-foreground/40 disabled:cursor-not-allowed disabled:opacity-70"
                />
                <MentionAutocomplete {...mention.autocomplete} />
                {!copyDraft && !isCampaignLocked && (
                  <span
                    aria-hidden
                    style={{ animation: "copy-caret-blink 1.1s steps(1, end) infinite" }}
                    className="pointer-events-none absolute left-[32px] top-[8px] h-[19px] w-px bg-violet-400 transition-opacity duration-150 peer-focus:!opacity-0"
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
              <div className="px-9 pb-4">
                <CopyMeta words={wordCount} count={copyDraft.length} />
              </div>
              </div>
            </Stagger>

            {session.postType === "Reshare" ? (
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
              field="assets"
              tourAnchor="composer-assets"
              feedback={feedbackFor("Assets")}
              onFeedback={() => onOpenFeedback("Assets")}
              align={session.visualAssetIds.length > 0 ? "start" : "center"}
              valueAlign={session.visualAssetIds.length > 0 ? "start" : "end"}
              staggerIndex={4}
            >
              {session.visualAssetIds.length === 0 ? (
                <button
                  disabled={isCampaignLocked}
                  onClick={onOpenMediaLibrary}
                  className="group flex items-center gap-2.5 rounded-(--r-pill) bg-(--ink)/[0.04] py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium inset-ring-1 inset-ring-(--ink)/[0.08] transition-[background-color,box-shadow,scale] duration-150 hover:bg-violet-500/10 hover:inset-ring-violet-400/40 active:scale-(--press) disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex size-6 items-center justify-center rounded-(--r-pill) bg-violet-500/15 text-violet-300 transition-transform duration-200 group-hover:scale-[1.08]">
                    <UploadCloud className="size-3.5" />
                  </span>
                  {media.cta}
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
            </SettingRow>
            )}

            <SettingRow
              label="Tags"
              field="tags"
              tourAnchor="composer-tags"
              htmlFor="canvas-tags"
              feedback={feedbackFor("Tags")}
              onFeedback={() => onOpenFeedback("Tags")}
              align="start"
              staggerIndex={5}
            >
              <div className="group/field w-full">
                <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-(--r-inner) bg-(--ink)/[0.04] p-1.5 inset-ring-1 inset-ring-(--ink)/[0.08] transition-[box-shadow,background-color] duration-200 focus-within:bg-(--ink)/[0.06] focus-within:inset-ring-violet-400/50">
                  {session.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium inset-ring-1 transition-[background-color,box-shadow,scale] duration-200",
                        flashedTag === tag
                          ? "scale-[1.06] bg-amber-500/20 inset-ring-amber-400/50"
                          : cn(tagTint(tag), "inset-ring-(--ink)/[0.06]"),
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

            <Stagger
              index={6}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-(--ink)/[0.06] bg-(--ink)/[0.012] px-9 py-3 text-[11px] text-muted-foreground"
            >
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

function SettingRow({
  label,
  htmlFor,
  field,
  tourAnchor,
  align = "center",
  valueAlign = "end",
  feedback,
  onFeedback,
  staggerIndex,
  children,
}: {
  label: string;
  htmlFor?: string;
  field?: string;
  tourAnchor?: string;
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
        data-field={field}
        data-tour={tourAnchor}
        className={cn(
          "group/row grid gap-x-4 gap-y-2.5 border-t border-(--ink)/[0.06] px-9 py-4",
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
