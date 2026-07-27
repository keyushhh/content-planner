"use client";

import { useState } from "react";
import {
  ArrowUp,
  CornerDownRight,
  History,
  MessageCircle,
  Trash2,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, countComments } from "@/lib/utils";
import { currentUser } from "@/lib/mock-data";
import { ConfirmDialog } from "./confirm-dialog";
import type { Comment, HistoryEntry, Session } from "@/lib/types";

interface DiscussionPanelProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
  onAddComment: (text: string, parentId?: string, fieldLabel?: string) => void;
  onClearHistory?: () => void;
  /** Field the user clicked a comment anchor on, if any. */
  pendingFieldLabel?: string;
  onClearPendingField?: () => void;
}

type Filter = "all" | "comments" | "activity";

type TimelineItem =
  | { kind: "comment"; at: string; data: Comment }
  | { kind: "history"; at: string; data: HistoryEntry };

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Escape inside a composer must not reach the page's global handler, which
 * closes the whole sheet — losing the draft and the post being edited.
 */
function handleComposerEscape(e: React.KeyboardEvent, cancel: () => void) {
  e.preventDefault();
  e.stopPropagation();
  e.nativeEvent.stopImmediatePropagation();
  cancel();
}

function FieldChip({ label }: { label: string }) {
  return (
    <span className="inline-flex h-5 items-center rounded-full bg-violet-500/12 px-2 text-[10px] font-medium text-violet-200 inset-ring-1 inset-ring-violet-400/25">
      {label}
    </span>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder,
  size = "md",
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  placeholder: string;
  size?: "sm" | "md";
  autoFocus?: boolean;
}) {
  const sm = size === "sm";
  return (
    <div
      className={cn(
        "flex items-end gap-2 rounded-2xl bg-white/[0.04] inset-ring-1 inset-ring-white/[0.08] transition-[box-shadow,background-color] duration-200 focus-within:bg-white/[0.06] focus-within:inset-ring-violet-400/50",
        sm ? "py-1 pl-2 pr-1" : "py-1.5 pl-2.5 pr-1.5",
      )}
    >
      <Avatar className={cn("shrink-0 self-center", sm ? "size-5" : "size-6")}>
        <AvatarFallback className={sm ? "text-[8px]" : "text-[9px]"}>
          {initials(currentUser.name)}
        </AvatarFallback>
      </Avatar>
      <textarea
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={1}
        className={cn(
          "max-h-32 min-h-0 flex-1 resize-none bg-transparent py-1.5 caret-violet-400 outline-none placeholder:text-muted-foreground/75",
          sm ? "text-xs leading-5" : "text-[13px] leading-6",
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) onSubmit();
          } else if (e.key === "Escape") {
            // only swallow Escape when there is something to cancel
            if (value.trim() || onCancel) {
              handleComposerEscape(e, () => {
                onChange("");
                onCancel?.();
              });
            }
          }
        }}
      />
      <button
        disabled={!value.trim()}
        onClick={onSubmit}
        aria-label="Send"
        title="Send (↵)"
        className={cn(
          "flex shrink-0 items-center justify-center self-end rounded-full bg-violet-600 text-white transition-[opacity,background-color,scale] duration-150 hover:bg-violet-500 active:scale-[0.92] disabled:pointer-events-none disabled:opacity-25",
          sm ? "mb-1 size-6" : "mb-1 size-7",
        )}
      >
        <ArrowUp className={sm ? "size-3" : "size-3.5"} />
      </button>
    </div>
  );
}

function CommentThread({
  comment,
  onReply,
}: {
  comment: Comment;
  onReply: (parentId: string, text: string) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const replies = comment.replies ?? [];

  function submitReply() {
    const trimmed = replyDraft.trim();
    if (!trimmed) return;
    onReply(comment.id, trimmed);
    setReplyDraft("");
    setReplyOpen(false);
  }

  return (
    <div className="relative flex gap-3">
      <Avatar className="z-10 size-8 shrink-0 ring-4 ring-background">
        <AvatarFallback className="text-[10px]">
          {initials(comment.author.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[13px] font-medium">{comment.author.name}</span>
          {comment.fieldLabel && <FieldChip label={comment.fieldLabel} />}
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {formatTime(comment.createdAt)}
          </span>
        </div>

        <div className="mt-1.5 rounded-2xl rounded-tl-md bg-white/[0.05] px-3 py-2 text-[13px] leading-relaxed inset-ring-1 inset-ring-white/[0.06]">
          {comment.text}
        </div>

        <button
          onClick={() => setReplyOpen((v) => !v)}
          aria-expanded={replyOpen}
          className={cn(
            "mt-1.5 flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-medium transition-[color,background-color,scale] duration-150 active:scale-[0.96]",
            replyOpen
              ? "bg-violet-500/12 text-violet-200"
              : "text-muted-foreground hover:bg-white/[0.06] hover:text-violet-200",
          )}
        >
          <CornerDownRight className="size-3" />
          {replyOpen ? "Cancel" : "Reply"}
          {replies.length > 0 && !replyOpen && (
            <span className="ml-0.5 tabular-nums text-muted-foreground">
              · {replies.length}
            </span>
          )}
        </button>

        {/* Replies — connected to the parent by a rail that ends at the last one,
            rather than a full-height rule that implies more below. */}
        {replies.length > 0 && (
          <div className="relative mt-2 space-y-3 pl-4">
            <span
              aria-hidden
              className="absolute bottom-3 left-0 top-0 w-px bg-white/10"
            />
            {replies.map((reply) => (
              <div key={reply.id} className="relative flex gap-2.5">
                <span
                  aria-hidden
                  className="absolute -left-4 top-3 h-px w-3 bg-white/10"
                />
                <Avatar className="size-6 shrink-0">
                  <AvatarFallback className="text-[9px]">
                    {initials(reply.author.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className="text-xs font-medium">{reply.author.name}</span>
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {formatTime(reply.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1 rounded-xl rounded-tl-md bg-white/[0.028] px-2.5 py-1.5 text-xs leading-relaxed inset-ring-1 inset-ring-white/[0.05]">
                    {reply.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {replyOpen && (
          <div className="mt-2.5 pl-4">
            <Composer
              autoFocus
              size="sm"
              value={replyDraft}
              onChange={setReplyDraft}
              onSubmit={submitReply}
              onCancel={() => setReplyOpen(false)}
              placeholder="Write a reply…"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function DiscussionPanel({
  session,
  isOpen,
  onClose,
  onAddComment,
  onClearHistory,
  pendingFieldLabel,
  onClearPendingField,
}: DiscussionPanelProps) {
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showAll, setShowAll] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const allItems: TimelineItem[] = [
    ...session.comments.map((c) => ({ kind: "comment" as const, at: c.createdAt, data: c })),
    ...session.history.map((h) => ({ kind: "history" as const, at: h.createdAt, data: h })),
  ]
    .filter((item) =>
      filter === "all"
        ? true
        : filter === "comments"
          ? item.kind === "comment"
          : item.kind === "history",
    )
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const items = showAll ? allItems : allItems.slice(0, 10);
  const commentCount = countComments(session.comments);

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAddComment(trimmed, undefined, pendingFieldLabel);
    setDraft("");
    onClearPendingField?.();
  }

  const FILTERS: [Filter, string, number | null][] = [
    ["all", "All", null],
    ["comments", "Comments", commentCount],
    ["activity", "Changes", session.history.length],
  ];

  return (
    <div className="flex h-full w-[340px] shrink-0 flex-col border-l border-white/[0.07] bg-black/[0.14] animate-in fade-in slide-in-from-right-4 duration-200 motion-reduce:animate-none">
      <div className="flex shrink-0 items-center justify-between gap-2 px-5 pb-3 pt-4">
        <h3 className="text-[15px] font-semibold tracking-tight">Activity</h3>
        <div className="flex items-center gap-1">
          {session.history.length > 0 && onClearHistory && (
            <button
              onClick={() => setConfirmClear(true)}
              aria-label="Clear change history"
              title="Clear change history"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-destructive/15 hover:text-destructive active:scale-[0.96]"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close activity panel"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-white/[0.06] hover:text-foreground active:scale-[0.96]"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Filter activity"
        className="mx-5 mb-4 flex shrink-0 items-center gap-0.5 rounded-full bg-white/[0.03] p-0.5 inset-ring-1 inset-ring-white/[0.08]"
      >
        {FILTERS.map(([value, label, count]) => (
          <button
            key={value}
            role="tab"
            aria-selected={filter === value}
            onClick={() => {
              setFilter(value);
              setShowAll(false);
            }}
            className={cn(
              "flex h-7 flex-1 items-center justify-center gap-1.5 rounded-full text-[11px] font-medium transition-[background-color,color,box-shadow,scale] duration-150 active:scale-[0.97]",
              filter === value
                ? "bg-white/[0.11] text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {count !== null && count > 0 && (
              <span className="tabular-nums text-muted-foreground">{count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        {allItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-white/[0.04] text-muted-foreground inset-ring-1 inset-ring-white/[0.06]">
              <MessageCircle className="size-4" />
            </span>
            <span className="mt-1 text-sm font-medium">
              {filter === "comments"
                ? "No comments yet"
                : filter === "activity"
                  ? "No changes yet"
                  : "Nothing here yet"}
            </span>
            <span className="text-xs text-muted-foreground text-pretty">
              {filter === "activity"
                ? "Edits to this post will be logged here."
                : "Start a thread below, or use the comment icon next to any field."}
            </span>
          </div>
        ) : (
          <div className="relative">
            {/* rail sits on the avatar centre line: 32px avatar → 16px */}
            <div className="absolute bottom-1 left-4 top-1 w-px bg-white/[0.07]" />
            <div className="space-y-5">
              {items.map((item) =>
                item.kind === "comment" ? (
                  <CommentThread
                    key={item.data.id}
                    comment={item.data}
                    onReply={(parentId, text) => onAddComment(text, parentId)}
                  />
                ) : (
                  <div key={item.data.id} className="relative flex items-center gap-3">
                    <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground ring-4 ring-background">
                      <History className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1 text-[13px] leading-snug text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {item.data.actor.name}
                      </span>{" "}
                      {item.data.action}
                      <span className="ml-1.5 text-[11px] tabular-nums">
                        {formatTime(item.data.createdAt)}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
            {allItems.length > 10 && !showAll && (
              <div className="mt-5 text-center">
                <button
                  onClick={() => setShowAll(true)}
                  className="rounded-full bg-white/[0.035] px-4 py-1.5 text-xs font-medium text-violet-300 inset-ring-1 inset-ring-white/[0.08] transition-[background-color,box-shadow,scale] duration-150 hover:bg-violet-500/12 hover:inset-ring-violet-400/40 active:scale-[0.97]"
                >
                  Show {allItems.length - 10} earlier
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/[0.07] px-5 py-4">
        {/* Carries the field you clicked through to the comment, so it lands
            attached rather than floating at the top level. */}
        {pendingFieldLabel && (
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Commenting on</span>
            <FieldChip label={pendingFieldLabel} />
            <button
              onClick={onClearPendingField}
              aria-label="Comment on the post instead"
              className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color] duration-150 hover:bg-white/[0.08] hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </div>
        )}
        <Composer
          value={draft}
          onChange={setDraft}
          onSubmit={submit}
          placeholder={
            pendingFieldLabel ? `Comment on ${pendingFieldLabel}…` : "Add a comment…"
          }
        />
      </div>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        icon={Trash2}
        tone="destructive"
        title="Clear change history?"
        description="This removes every logged edit for this post. Comments are kept. This can't be undone."
        actions={[
          { label: "Cancel", tone: "outline", onClick: () => setConfirmClear(false) },
          {
            label: "Clear history",
            icon: Trash2,
            tone: "destructive",
            onClick: () => {
              setConfirmClear(false);
              onClearHistory?.();
            },
          },
        ]}
      />
    </div>
  );
}
