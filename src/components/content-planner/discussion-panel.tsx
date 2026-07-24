"use client";

import { useState } from "react";
import { ArrowUp, CornerDownRight, History, MessageCircle, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { currentUser } from "@/lib/mock-data";
import type { Comment, HistoryEntry, Session } from "@/lib/types";

interface DiscussionPanelProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
  onAddComment: (text: string, parentId?: string) => void;
  onClearHistory?: () => void;
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

// Renders a single comment (and optionally its replies as a thread)
function CommentThread({
  comment,
  onReply,
}: {
  comment: Comment;
  onReply: (parentId: string, text: string) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");

  function submitReply() {
    const trimmed = replyDraft.trim();
    if (!trimmed) return;
    onReply(comment.id, trimmed);
    setReplyDraft("");
    setReplyOpen(false);
  }

  return (
    <div className="relative flex gap-3 pl-0">
      <Avatar className="z-10 size-8 shrink-0 ring-4 ring-background">
        <AvatarFallback className="text-[10px]">
          {initials(comment.author.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-medium">{comment.author.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatTime(comment.createdAt)}
          </span>
        </div>
        {comment.fieldLabel && (
          <span className="text-xs text-muted-foreground">
            commented on{" "}
            <span className="font-medium text-foreground/80">
              {comment.fieldLabel}
            </span>
          </span>
        )}
        <div className="mt-1 rounded-2xl rounded-tl-sm bg-accent/50 px-3 py-2 text-sm">
          {comment.text}
        </div>

        {/* Reply button */}
        <button
          onClick={() => setReplyOpen((v) => !v)}
          className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-blue-400"
        >
          <CornerDownRight className="size-3" />
          Reply
        </button>

        {/* Inline reply replies as a thread */}
        {(comment.replies?.length ?? 0) > 0 && (
          <div className="mt-3 space-y-3 border-l-2 border-border/50 pl-3">
            {comment.replies!.map((reply) => (
              <div key={reply.id} className="flex gap-2.5">
                <Avatar className="size-6 shrink-0">
                  <AvatarFallback className="text-[9px]">
                    {initials(reply.author.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-medium">{reply.author.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(reply.createdAt)}
                    </span>
                  </div>
                  <div className="mt-0.5 rounded-xl rounded-tl-sm bg-accent/35 px-2.5 py-1.5 text-xs">
                    {reply.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply input */}
        {replyOpen && (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-border bg-accent/20 py-1 pr-1.5 pl-3 focus-within:border-violet-500/40">
            <Avatar className="size-5 shrink-0">
              <AvatarFallback className="text-[8px]">
                {initials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            <Textarea
              autoFocus
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              placeholder="Write a reply…"
              rows={1}
              className="min-h-0 flex-1 resize-none rounded-lg border-0 bg-transparent px-2 py-1 text-xs leading-5 shadow-none focus-visible:ring-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitReply();
                }
                if (e.key === "Escape") {
                  setReplyOpen(false);
                  setReplyDraft("");
                }
              }}
            />
            <button
              disabled={!replyDraft.trim()}
              onClick={submitReply}
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition-opacity disabled:opacity-30"
            >
              <ArrowUp className="size-3" />
            </button>
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
}: DiscussionPanelProps) {
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showAll, setShowAll] = useState(false);

  if (!isOpen) return null;

  const allItems: TimelineItem[] = [
    ...session.comments.map((c) => ({ kind: "comment" as const, at: c.createdAt, data: c })),
    ...session.history.map((h) => ({ kind: "history" as const, at: h.createdAt, data: h })),
  ]
    .filter((item) =>
      filter === "all" ? true : filter === "comments" ? item.kind === "comment" : item.kind === "history",
    )
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const items = showAll ? allItems : allItems.slice(0, 10);

  return (
    <div className="flex h-full w-[320px] shrink-0 flex-col border-l border-border/60">
      <div className="flex shrink-0 items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold tracking-tight">Activity</h3>
          {session.history.length > 0 && onClearHistory && (
            <button
              onClick={onClearHistory}
              className="text-[11px] font-medium text-rose-500/80 hover:text-rose-400 hover:underline transition-colors ml-1"
            >
              Clear history
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close activity panel"
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1 px-5 pb-4">
        {(
          [
            ["all", "All"],
            ["comments", "Comments"],
            ["activity", "Changes"],
          ] as [Filter, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => {
              setFilter(value);
              setShowAll(false);
            }}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filter === value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-accent/60",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        {allItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <MessageCircle className="size-6 opacity-50" />
            <span className="text-sm">Nothing here yet</span>
            <span className="text-xs">Comments and changes will show up here.</span>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-1 bottom-1 left-[15px] w-px bg-border" />
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
                    <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-4 ring-background">
                      <History className="size-3.5 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{item.data.actor.name}</span>{" "}
                      {item.data.action}
                      <span className="ml-1.5 text-xs">{formatTime(item.data.createdAt)}</span>
                    </div>
                  </div>
                ),
              )}
            </div>
            {allItems.length > 10 && !showAll && (
              <div className="mt-5 text-center">
                <button
                  onClick={() => setShowAll(true)}
                  className="rounded-full border border-border/80 bg-accent/40 px-4 py-1.5 text-xs font-medium text-violet-400 transition-colors hover:bg-accent hover:text-violet-300"
                >
                  See More ({allItems.length - 10} earlier activities)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border/60 px-5 py-4">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-accent/20 py-1 pr-1.5 pl-3 focus-within:border-violet-500/40">
          <Avatar className="size-6 shrink-0">
            <AvatarFallback className="text-[9px]">
              {initials(currentUser.name)}
            </AvatarFallback>
          </Avatar>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            rows={1}
            className="min-h-0 flex-1 resize-none rounded-lg border-0 bg-transparent px-2 py-1.5 leading-6 shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && draft.trim()) {
                e.preventDefault();
                onAddComment(draft.trim());
                setDraft("");
              }
            }}
          />
          <button
            disabled={!draft.trim()}
            onClick={() => {
              if (!draft.trim()) return;
              onAddComment(draft.trim());
              setDraft("");
            }}
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition-opacity disabled:opacity-30"
          >
            <ArrowUp className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
