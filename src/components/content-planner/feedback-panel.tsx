"use client";

import { useState } from "react";
import { ArrowUp, Check, ChevronDown, History, MessageSquare, Trash2, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { avatarTint, cn } from "@/lib/utils";
import {
  FEEDBACK_STATUSES,
  feedbackStatusMeta,
  openFeedback,
  sortFeedback,
} from "@/lib/feedback";
import { currentUser } from "@/lib/mock-data";
import { ConfirmDialog } from "./confirm-dialog";
import type { Feedback, FeedbackStatus, Session } from "@/lib/types";

interface FeedbackPanelProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
  onAddFeedback: (text: string, sectionLabel?: string) => void;
  onSetStatus: (feedbackId: string, status: FeedbackStatus) => void;
  onClearHistory?: () => void;
  /** Section whose feedback affordance was clicked, if any. */
  pendingSectionLabel?: string;
  onClearPendingSection?: () => void;
}

type Tab = "feedback" | "changes";

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

export function SectionChip({ label }: { label: string }) {
  return (
    <span className="inline-flex h-5 shrink-0 items-center rounded-(--r-pill) bg-(--ink)/[0.07] px-2 text-[10px] font-medium text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.07]">
      {label}
    </span>
  );
}

/**
 * The status control: a chip that reads as its own state and opens the four
 * choices when clicked, so there is no separate "change status" control to
 * find.
 */
export function StatusChip({
  status,
  onChange,
  size = "md",
}: {
  status: FeedbackStatus;
  onChange: (next: FeedbackStatus) => void;
  size?: "sm" | "md";
}) {
  const meta = feedbackStatusMeta(status);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            title="Change status"
            aria-label={`Status: ${meta.label}. Change it`}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-(--r-pill) font-medium inset-ring-1 transition-[background-color,box-shadow,scale] duration-150 hover:brightness-110 active:scale-(--press)",
              size === "sm" ? "h-5 pl-1.5 pr-1 text-[10px]" : "h-6 pl-2 pr-1.5 text-[11px]",
              meta.chip,
            )}
          />
        }
      >
        <span className={cn("size-1.5 shrink-0 rounded-(--r-round)", meta.dot)} />
        {meta.label}
        <ChevronDown className="size-3 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-[168px]">
        {FEEDBACK_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => onChange(s.id)}
            className="whitespace-nowrap"
          >
            <span className={cn("size-1.5 shrink-0 rounded-(--r-round)", s.dot)} />
            <span className="flex-1">{s.label}</span>
            {s.id === status && <Check className="size-3.5 text-violet-300" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-end gap-2 rounded-2xl bg-(--ink)/[0.04] py-1.5 pl-2.5 pr-1.5 inset-ring-1 inset-ring-(--ink)/[0.08] transition-[box-shadow,background-color] duration-200 focus-within:bg-(--ink)/[0.06] focus-within:inset-ring-violet-400/50">
      <Avatar className="size-6 shrink-0 self-center">
        <AvatarFallback className={cn("text-[9px]", avatarTint(currentUser.name))}>
          {initials(currentUser.name)}
        </AvatarFallback>
      </Avatar>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={1}
        className="max-h-32 min-h-0 flex-1 resize-none bg-transparent py-1.5 text-[13px] leading-6 caret-violet-400 outline-none placeholder:text-muted-foreground/75"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) onSubmit();
          } else if (e.key === "Escape" && value.trim()) {
            // Escape here must not reach the page handler, which closes the whole
            // sheet and takes the post being edited with it.
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            onChange("");
          }
        }}
      />
      <button
        disabled={!value.trim()}
        onClick={onSubmit}
        aria-label="Add feedback"
        title="Add feedback (↵)"
        className="mb-1 flex size-7 shrink-0 items-center justify-center self-end rounded-(--r-pill) bg-violet-600 text-white transition-[opacity,background-color,scale] duration-150 hover:bg-violet-500 active:scale-(--press) disabled:pointer-events-none disabled:opacity-25"
      >
        <ArrowUp className="size-3.5" />
      </button>
    </div>
  );
}

/**
 * One row of the feedback list, laid out as a table row rather than a chat
 * bubble: who, what, where, status, with status in a fixed right-hand column
 * so a column of chips can be scanned in one pass.
 */
function FeedbackRow({
  item,
  onSetStatus,
}: {
  item: Feedback;
  onSetStatus: (status: FeedbackStatus) => void;
}) {
  const meta = feedbackStatusMeta(item.status);

  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-(--r-float) px-2.5 py-2.5 transition-[background-color,opacity] duration-200 inset-ring-1",
        meta.active
          ? "bg-(--ink)/[0.028] inset-ring-(--ink)/[0.07]"
          : "bg-(--ink)/[0.014] inset-ring-(--ink)/[0.045]",
      )}
    >
      <Avatar className="mt-px size-6 shrink-0 inset-ring-1 inset-ring-(--ink)/10">
        <AvatarFallback
          className={cn("text-[9px] font-medium", avatarTint(item.author.name))}
        >
          {initials(item.author.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "min-w-0 text-[13px] leading-snug",
              meta.active ? "text-foreground/90" : "text-muted-foreground",
            )}
          >
            {item.text}
          </span>
          <StatusChip status={item.status} onChange={onSetStatus} size="sm" />
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10.5px] text-muted-foreground/80">
          {item.sectionLabel && <SectionChip label={item.sectionLabel} />}
          <span className="tabular-nums">{item.author.name}</span>
          <span aria-hidden className="text-muted-foreground/30">
            ·
          </span>
          <span className="tabular-nums">{formatTime(item.createdAt)}</span>
          {!meta.active && item.resolvedBy && (
            <>
              <span aria-hidden className="text-muted-foreground/30">
                ·
              </span>
              <span>
                {meta.label.toLowerCase()} by {item.resolvedBy.name}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Feedback, and the change log, in one rail. No threads; see the note on
 * `Feedback` in types.ts.
 */
export function FeedbackPanel({
  session,
  isOpen,
  onClose,
  onAddFeedback,
  onSetStatus,
  onClearHistory,
  pendingSectionLabel,
  onClearPendingSection,
}: FeedbackPanelProps) {
  const [draft, setDraft] = useState("");
  const [tab, setTab] = useState<Tab>("feedback");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const openCount = openFeedback(session.feedback).length;
  const sorted = sortFeedback(session.feedback);
  const rows = onlyOpen ? sorted.filter((f) => feedbackStatusMeta(f.status).active) : sorted;
  const history = [...session.history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAddFeedback(trimmed, pendingSectionLabel);
    setDraft("");
    onClearPendingSection?.();
  }

  const TABS: [Tab, string, number | null][] = [
    ["feedback", "Feedback", session.feedback.length],
    ["changes", "Changes", session.history.length],
  ];

  return (
    <div className="flex h-full w-[356px] shrink-0 flex-col border-l border-(--ink)/[0.07] bg-(--sink)/[0.14] animate-in fade-in slide-in-from-right-4 duration-200 motion-reduce:animate-none">
      <div className="flex shrink-0 items-center justify-between gap-2 px-5 pb-3 pt-4">
        <h3 className="flex min-w-0 items-baseline gap-2 text-[15px] font-semibold tracking-tight">
          Feedback
          {openCount > 0 && (
            <span className="text-[11px] font-medium tabular-nums text-amber-300">
              {openCount} open
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1">
          {tab === "changes" && session.history.length > 0 && onClearHistory && (
            <button
              onClick={() => setConfirmClear(true)}
              aria-label="Clear change history"
              title="Clear change history"
              className="flex size-8 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-destructive/15 hover:text-destructive active:scale-(--press)"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close feedback panel"
            className="flex size-8 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Feedback or changes"
        className="mx-5 mb-3 flex shrink-0 items-center gap-0.5 rounded-(--r-pill) bg-(--ink)/[0.03] p-0.5 inset-ring-1 inset-ring-(--ink)/[0.08]"
      >
        {TABS.map(([value, label, count]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "flex h-7 flex-1 items-center justify-center gap-1.5 rounded-(--r-pill) text-[11px] font-medium transition-[background-color,color,box-shadow,scale] duration-150 active:scale-(--press)",
              tab === value
                ? "bg-(--ink)/[0.11] text-foreground shadow-(--lift-sm)"
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

      {tab === "feedback" ? (
        <>
          {/* Column headers: the list is a table, and saying so out loud is
              what makes the right-hand chips read as a column rather than as
              decoration. */}
          {session.feedback.length > 0 && (
            <div className="flex shrink-0 items-center justify-between gap-2 px-5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground/60">
              <button
                onClick={() => setOnlyOpen((v) => !v)}
                title={onlyOpen ? "Show everything" : "Show only what is still open"}
                className={cn(
                  "-mx-1.5 flex h-5 items-center gap-1.5 rounded-md px-1.5 uppercase tracking-[0.09em] transition-colors duration-150 hover:text-foreground",
                  onlyOpen && "text-amber-300",
                )}
              >
                {onlyOpen ? "Open only" : "All feedback"}
                <ChevronDown className="size-3 opacity-60" />
              </button>
              <span>Status</span>
            </div>
          )}

          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-5 pb-4">
            {rows.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title={
                  session.feedback.length === 0
                    ? "No feedback yet"
                    : "Nothing open"
                }
                body={
                  session.feedback.length === 0
                    ? "Add a note below, or use the feedback icon beside any section of the post."
                    : "Every piece of feedback on this post has been closed out."
                }
              />
            ) : (
              rows.map((item) => (
                <FeedbackRow
                  key={item.id}
                  item={item}
                  onSetStatus={(status) => onSetStatus(item.id, status)}
                />
              ))
            )}
          </div>

          <div className="shrink-0 border-t border-(--ink)/[0.07] px-5 py-4">
            {/* Carries the section you clicked through to the note, so it
                lands attached rather than floating against the whole post. */}
            {pendingSectionLabel && (
              <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>On</span>
                <SectionChip label={pendingSectionLabel} />
                <button
                  onClick={onClearPendingSection}
                  aria-label="Give feedback on the whole post instead"
                  className="flex size-5 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.08] hover:text-foreground"
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
                pendingSectionLabel
                  ? `Feedback on ${pendingSectionLabel}…`
                  : "Add feedback…"
              }
            />
          </div>
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {history.length === 0 ? (
            <EmptyState
              icon={History}
              title="No changes yet"
              body="Edits to this post will be logged here."
            />
          ) : (
            <div className="relative">
              {/* rail sits on the marker centre line: 28px marker → 14px */}
              <div className="absolute bottom-1 left-3.5 top-1 w-px bg-(--ink)/[0.07]" />
              <div className="space-y-4">
                {history.map((entry) => (
                  <div key={entry.id} className="relative flex items-center gap-3">
                    <span className="z-10 flex size-7 shrink-0 items-center justify-center rounded-(--r-pill) bg-background text-muted-foreground ring-4 ring-background">
                      <History className="size-3" />
                    </span>
                    <div className="min-w-0 flex-1 text-[12.5px] leading-snug text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {entry.actor.name}
                      </span>{" "}
                      {entry.action}
                      <span className="ml-1.5 text-[10.5px] tabular-nums">
                        {formatTime(entry.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        icon={Trash2}
        tone="destructive"
        title="Clear change history?"
        description="This removes every logged edit for this post. Feedback is kept. This can't be undone."
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

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof MessageSquare;
  title: string;
  body: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-(--r-pill) bg-(--ink)/[0.04] text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.06]">
        <Icon className="size-4" />
      </span>
      <span className="mt-1 text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground text-pretty">{body}</span>
    </div>
  );
}
