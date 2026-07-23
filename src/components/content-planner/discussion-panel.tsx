"use client";

import { useState } from "react";
import { ArrowUp, History, MessageCircle, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { currentUser } from "@/lib/mock-data";
import type { Comment, HistoryEntry, Session } from "@/lib/types";

interface DiscussionPanelProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
  onAddComment: (text: string) => void;
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

export function DiscussionPanel({
  session,
  isOpen,
  onClose,
  onAddComment,
}: DiscussionPanelProps) {
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  if (!isOpen) return null;

  const items: TimelineItem[] = [
    ...session.comments.map((c) => ({ kind: "comment" as const, at: c.createdAt, data: c })),
    ...session.history.map((h) => ({ kind: "history" as const, at: h.createdAt, data: h })),
  ]
    .filter((item) =>
      filter === "all" ? true : filter === "comments" ? item.kind === "comment" : item.kind === "history",
    )
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <div className="flex h-full w-[320px] shrink-0 flex-col border-l border-border/60">
      <div className="flex shrink-0 items-center justify-between px-5 py-4">
        <h3 className="text-base font-semibold tracking-tight">Activity</h3>
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
            onClick={() => setFilter(value)}
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
        {items.length === 0 ? (
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
                  <div key={item.data.id} className="relative flex gap-3 pl-0">
                    <Avatar className="z-10 size-8 shrink-0 ring-4 ring-background">
                      <AvatarFallback className="text-[10px]">
                        {initials(item.data.author.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-medium">{item.data.author.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(item.data.createdAt)}
                        </span>
                      </div>
                      {item.data.fieldLabel && (
                        <span className="text-xs text-muted-foreground">
                          commented on{" "}
                          <span className="font-medium text-foreground/80">
                            {item.data.fieldLabel}
                          </span>
                        </span>
                      )}
                      <div className="mt-1 rounded-2xl rounded-tl-sm bg-accent/50 px-3 py-2 text-sm">
                        {item.data.text}
                      </div>
                    </div>
                  </div>
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
