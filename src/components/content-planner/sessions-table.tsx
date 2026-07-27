"use client";

import { useCallback, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { ConfirmDialog } from "./confirm-dialog";
import {
  avatarTint,
  cn,
  isSessionLocked,
  relativeTime,
  sessionNeedsResend,
} from "@/lib/utils";
import {
  Send,
  Lock,
  LockOpen,
  Info,
  Trash2,
  RefreshCw,
  Copy,
  AlertTriangle,
  Plus,
  X,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Session } from "@/lib/types";

interface CustomColumn {
  id: string;
  name: string;
}

interface SessionsTableProps {
  sessions: Session[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
  onOpenSend: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onUnlockSession: (id: string) => void;
  onDuplicateSession?: (id: string) => void;
  emptyState?: { title: string; description: string };
  /** "classic" keeps the original table; "canvas" matches the Canvas pane. */
  variant?: "classic" | "canvas";
  /** Canvas only: rows per page. */
  pageSize?: number;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function SessionsTable({
  sessions,
  selectedSessionId,
  onSelectSession,
  onOpenSend,
  onDeleteSession,
  onUnlockSession,
  onDuplicateSession,
  emptyState = {
    title: "No sessions yet",
    description: 'Click "New Session" to create your first post.',
  },
  variant = "classic",
  pageSize = 15,
}: SessionsTableProps) {
  const [page, setPage] = useState(1);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [bodyScrolled, setBodyScrolled] = useState(false);
  // starts true so a short, unscrollable list never shows a fade
  const [bodyAtEnd, setBodyAtEnd] = useState(true);

  const readScrollEdges = useCallback((el: HTMLElement) => {
    setBodyScrolled(el.scrollTop > 2);
    // 1px of slack: fractional scroll heights mean the sum rarely lands exactly
    setBodyAtEnd(el.scrollHeight - el.scrollTop - el.clientHeight <= 1);
  }, []);

  /**
   * Measuring ref rather than an effect. Whether the fade should show depends on
   * whether the body actually overflows, which only the DOM knows — and it
   * changes when the window resizes or the detail pane opens, neither of which
   * fires a scroll event. Memoised so React does not detach and re-observe on
   * every render.
   */
  const attachBody = useCallback(
    (el: HTMLDivElement | null) => {
      bodyRef.current = el;
      if (!el) return;
      readScrollEdges(el);
      const observer = new ResizeObserver(() => readScrollEdges(el));
      observer.observe(el);
      return () => {
        observer.disconnect();
        bodyRef.current = null;
      };
    },
    [readScrollEdges],
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmUnlockId, setConfirmUnlockId] = useState<string | null>(null);

  // Dynamic custom columns state
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [editingHeaderId, setEditingHeaderId] = useState<string | null>(null);
  const [customCellValues, setCustomCellValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const [editingCell, setEditingCell] = useState<{
    sessionId: string;
    colId: string;
  } | null>(null);

  const sessionPendingDelete =
    sessions.find((s) => s.id === confirmDeleteId) ?? null;
  const sessionPendingUnlock =
    sessions.find((s) => s.id === confirmUnlockId) ?? null;

  const handleAddColumn = () => {
    const newId = `col-${Date.now()}`;
    const newName = `Column ${customColumns.length + 1}`;
    setCustomColumns((prev) => [...prev, { id: newId, name: newName }]);
    setEditingHeaderId(newId);
  };

  const handleRemoveColumn = (colId: string) => {
    setCustomColumns((prev) => prev.filter((c) => c.id !== colId));
  };

  const handleUpdateHeaderName = (colId: string, newName: string) => {
    setCustomColumns((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, name: newName || "Column" } : c))
    );
  };

  const handleUpdateCellValue = (
    sessionId: string,
    colId: string,
    val: string
  ) => {
    setCustomCellValues((prev) => ({
      ...prev,
      [sessionId]: {
        ...(prev[sessionId] || {}),
        [colId]: val,
      },
    }));
  };

  const dialogs = (
    <>
      <ConfirmDialog
        open={sessionPendingDelete !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        icon={AlertTriangle}
        tone="destructive"
        title={
          sessionPendingDelete ? (
            <>Delete &ldquo;{sessionPendingDelete.title}&rdquo;?</>
          ) : (
            ""
          )
        }
        description="This action cannot be undone. All content associated with this session will be permanently removed."
        actions={[
          {
            label: "Delete session",
            tone: "destructive",
            onClick: () => {
              if (sessionPendingDelete) onDeleteSession(sessionPendingDelete.id);
              setConfirmDeleteId(null);
            },
          },
          {
            label: "Cancel",
            tone: "outline",
            onClick: () => setConfirmDeleteId(null),
          },
        ]}
      />

      <ConfirmDialog
        open={sessionPendingUnlock !== null}
        onOpenChange={(open) => !open && setConfirmUnlockId(null)}
        icon={LockOpen}
        tone="violet"
        title="Unlock this post?"
        description="This moves it back to WIP so you can edit it. It stays sent to Wozku as-is until you re-approve and send the update \u2014 nothing changes there until then."
        actions={[
          {
            label: "Cancel",
            tone: "outline",
            onClick: () => setConfirmUnlockId(null),
          },
          {
            label: "Unlock",
            icon: LockOpen,
            tone: "primary",
            onClick: () => {
              if (sessionPendingUnlock) onUnlockSession(sessionPendingUnlock.id);
              setConfirmUnlockId(null);
            },
          },
        ]}
      />
    </>
  );

  // Dynamic CSS grid template columns
  const gridStyle = {
    gridTemplateColumns: `minmax(200px, 1.5fr) 160px 110px 130px ${customColumns
      .map(() => "140px")
      .join(" ")} 60px 40px`,
  };

  // ---- Canvas variant -------------------------------------------------------
  // Rows live inside one elevated sheet on the washed canvas, so the table reads
  // as the same material as the detail pane. The sheet is measure-capped, which
  // is what kills the huge dead gutter in the name column on wide screens.
  //
  // Three column sets, chosen by CONTAINER width rather than viewport: opening
  // the detail pane squeezes this table to ~38%, and a table that keeps
  // rendering six columns at 480px is just six truncated columns. Inline styles
  // cannot answer container queries, so the templates ride in as custom
  // properties and Tailwind's @-variants pick which one applies.
  const canvasGrid = {
    "--cols-sm": "minmax(0,1fr) 104px 72px",
    "--cols-md": "minmax(0,1fr) 168px 112px 72px",
    "--cols-lg": `minmax(0,1fr) 176px 116px 132px ${customColumns
      .map(() => "140px")
      .join(" ")} 80px`,
  } as React.CSSProperties;

  const canvasGridClass =
    "grid-cols-[var(--cols-sm)] @[640px]:grid-cols-[var(--cols-md)] @[900px]:grid-cols-[var(--cols-lg)]";
  /** Columns that only earn their space at full width. */
  const wideOnly = "hidden @[900px]:block";

  const totalPages = Math.max(1, Math.ceil(sessions.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rangeStart = sessions.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, sessions.length);
  const pageRows = sessions.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageItems = buildPageItems(safePage, totalPages);

  function handleBodyScroll(e: React.UIEvent<HTMLDivElement>) {
    readScrollEdges(e.currentTarget);
  }

  /** Changing pages while scrolled mid-list would land you in the middle of the
      new page — send the body back to row 1. Instant, not smooth: the rows under
      the cursor have already been replaced, so animating past them is a lie. */
  function goToPage(next: number) {
    setPage(next);
    const el = bodyRef.current;
    if (el) {
      el.scrollTo({ top: 0 });
      setBodyScrolled(false);
      // the next page can be shorter than this one, so re-test the bottom edge
      requestAnimationFrame(() => {
        if (bodyRef.current) readScrollEdges(bodyRef.current);
      });
    }
  }

  if (variant === "canvas") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {/* The sheet owns its own scroll region: the header is a sibling of the
            body rather than sticky inside it, so the column titles are simply
            always there. The page itself no longer scrolls at all.

            No `flex-1` on purpose — that stretched the sheet to fill the column
            and left a lake of empty surface under four rows. With auto height it
            sizes to its content, and flex-shrink caps it at the space available,
            at which point the body starts scrolling. Short list: short table. */}
        <div className="relative flex min-h-0 flex-col overflow-clip rounded-[20px] bg-[oklch(0.185_0_0)] shadow-[0_2px_4px_rgba(0,0,0,0.3),0_28px_64px_-32px_rgba(0,0,0,1)] inset-ring-1 inset-ring-white/[0.08] @container">
            <div
              aria-hidden
              className="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-white/[0.09] to-transparent"
            />

            <div
              style={canvasGrid}
              className={cn(
                "z-10 grid shrink-0 items-center gap-3 border-b bg-[oklch(0.205_0_0)] px-5 py-2.5 text-[11px] font-medium text-muted-foreground transition-[border-color,box-shadow] duration-200",
                canvasGridClass,
                // the header acknowledges scroll with the same lift the detail
                // pane's toolbar uses, so the two read as one system
                bodyScrolled
                  ? "border-white/[0.10] shadow-[0_10px_22px_-18px_rgba(0,0,0,1)]"
                  : "border-white/[0.06]",
              )}
            >
              <span>Name</span>
              <span className="hidden @[640px]:block">Last edited by</span>
              <span>Status</span>
              <span className={wideOnly}>Campaign</span>

              {customColumns.map((col) => (
                <div key={col.id} className={cn("min-w-0", wideOnly)}>
                  {editingHeaderId === col.id ? (
                    <input
                      autoFocus
                      value={col.name}
                      onChange={(e) => handleUpdateHeaderName(col.id, e.target.value)}
                      onBlur={() => setEditingHeaderId(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") setEditingHeaderId(null);
                      }}
                      className="h-6 w-full rounded-md bg-white/[0.06] px-1.5 text-[11px] font-medium caret-violet-400 inset-ring-1 inset-ring-violet-400/50 outline-none"
                    />
                  ) : (
                    <div className="group/col flex items-center justify-between gap-1">
                      <span
                        onClick={() => setEditingHeaderId(col.id)}
                        title="Click to rename"
                        className="cursor-pointer truncate transition-colors hover:text-foreground"
                      >
                        {col.name}
                      </span>
                      <button
                        onClick={() => handleRemoveColumn(col.id)}
                        title="Remove column"
                        aria-label={`Remove ${col.name}`}
                        className="shrink-0 text-muted-foreground opacity-0 transition-[opacity,color] hover:text-destructive group-hover/col:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* only offered where custom columns actually render */}
              <div className={cn("items-center justify-end", "hidden @[900px]:flex")}>
                <button
                  onClick={handleAddColumn}
                  title="Add column"
                  aria-label="Add column"
                  className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-white/[0.08] hover:text-foreground active:scale-[0.94]"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>

            <div
              ref={attachBody}
              onScroll={handleBodyScroll}
              // pb keeps the final row off the sheet's bottom edge, so the end of
              // the list reads as an end rather than as a crop
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2"
            >
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-8 py-16 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-white/[0.04] text-muted-foreground inset-ring-1 inset-ring-white/[0.06]">
                  <Inbox className="size-4" />
                </span>
                <span className="mt-1 text-sm font-medium">{emptyState.title}</span>
                <span className="max-w-[380px] text-xs text-muted-foreground text-pretty">
                  {emptyState.description}
                </span>
              </div>
            ) : (
              pageRows.map((session) => {
                const isSelected = session.id === selectedSessionId;
                const locked = isSessionLocked(session);
                const needsResend = sessionNeedsResend(session);

                return (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    style={canvasGrid}
                    className={cn(
                      // A FIXED row height is what makes 15 rows read as a
                      // rhythm: with padding alone, a row with tags stood 14px
                      // taller than one without and the whole list stuttered.
                      "group relative grid h-[58px] cursor-pointer items-center gap-3 border-b border-white/[0.05] px-5 transition-colors duration-150 last:border-b-0",
                      canvasGridClass,
                      // selected gets a left accent instead of only a tint
                      isSelected
                        ? "bg-violet-500/[0.10] before:absolute before:left-0 before:top-1/2 before:h-7 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-violet-400 before:content-['']"
                        : "hover:bg-white/[0.035]",
                    )}
                  >
                    <div className="min-w-0 pr-4">
                      <div className="truncate text-[13.5px] font-medium">{session.title}</div>
                      {/* Tags as quiet text, not pills. Filled chips here put a
                          second chip treatment on screen competing with the
                          filter bar, and they out-weighted the title itself. */}
                      {session.tags.length > 0 && (
                        <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground/70">
                          {session.tags.slice(0, 2).map((tag, i) => (
                            <span key={tag} className="flex shrink-0 items-center gap-1.5">
                              {i > 0 && (
                                <span aria-hidden className="size-1 rounded-full bg-current opacity-40" />
                              )}
                              {tag}
                            </span>
                          ))}
                          {session.tags.length > 2 && (
                            <span className="shrink-0 tabular-nums opacity-70">
                              +{session.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="hidden min-w-0 items-center gap-2 text-[13px] text-muted-foreground @[640px]:flex">
                      {session.lastEditedBy ? (
                        <>
                          <Avatar className="size-6 shrink-0 inset-ring-1 inset-ring-white/10">
                            <AvatarFallback
                              className={cn(
                                "text-[10px] font-medium",
                                avatarTint(session.lastEditedBy.name),
                              )}
                            >
                              {initials(session.lastEditedBy.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0">
                            <span className="block truncate">{session.lastEditedBy.name}</span>
                            <span className="block text-[11px] text-muted-foreground/70">
                              {relativeTime(session.updatedAt)}
                            </span>
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground/70">Not edited yet</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <StatusBadge status={session.status} />
                    </div>

                    <div className={wideOnly} onClick={(e) => e.stopPropagation()}>
                      {locked ? (
                        // Quiet: a filled emerald pill in every sent row made the
                        // column read as clutter. Only Send stays loud.
                        <button
                          onClick={() => setConfirmUnlockId(session.id)}
                          title="Sent and unchanged since. Click to unlock and edit."
                          className="inline-flex h-7 items-center gap-1.5 rounded-full px-2 text-xs font-medium text-emerald-300/80 transition-[background-color,color,scale] duration-150 hover:bg-emerald-500/10 hover:text-emerald-200 active:scale-[0.96]"
                        >
                          <Lock className="size-3" />
                          Locked
                        </button>
                      ) : session.status === "approved" ? (
                        <button
                          onClick={() => onOpenSend(session.id)}
                          className="inline-flex h-7 items-center gap-1.5 rounded-full bg-violet-600 px-3 text-xs font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_5px_14px_-8px_rgba(139,92,246,0.8)] inset-ring-1 inset-ring-white/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-[0.96]"
                        >
                          {needsResend ? (
                            <RefreshCw className="size-3" />
                          ) : (
                            <Send className="size-3" />
                          )}
                          {needsResend ? "Update" : "Send"}
                        </button>
                      ) : (
                        // plain text, not a dead button that reads as broken chrome
                        <span
                          title={`Approve this post to ${needsResend ? "send the update" : "send it"}`}
                          className="text-xs text-muted-foreground/70"
                        >
                          Not ready
                        </span>
                      )}
                    </div>

                    {customColumns.map((col) => {
                      const cellVal = customCellValues[session.id]?.[col.id] || "";
                      const isEditing =
                        editingCell?.sessionId === session.id && editingCell?.colId === col.id;

                      return (
                        <div
                          key={col.id}
                          className={cn("min-w-0", wideOnly)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              value={cellVal}
                              onChange={(e) =>
                                handleUpdateCellValue(session.id, col.id, e.target.value)
                              }
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === "Escape") setEditingCell(null);
                              }}
                              className="h-7 w-full rounded-md bg-white/[0.06] px-2 text-xs caret-violet-400 inset-ring-1 inset-ring-violet-400/50 outline-none"
                            />
                          ) : (
                            <span
                              onClick={() =>
                                setEditingCell({ sessionId: session.id, colId: col.id })
                              }
                              title="Click to edit"
                              className={cn(
                                "inline-block max-w-full cursor-pointer truncate rounded-md px-1.5 py-0.5 text-xs transition-colors hover:bg-white/[0.06]",
                                cellVal ? "font-medium" : "text-muted-foreground/60 italic",
                              )}
                            >
                              {cellVal || "Empty"}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-end gap-0.5"
                    >
                      {/* Reveal drifts in from the right rather than blinking on.
                          The 2px of travel is what turns a state change into a
                          gesture; the row's own hover tint carries the rest. */}
                      {onDuplicateSession && (
                        <button
                          onClick={() => onDuplicateSession(session.id)}
                          aria-label="Duplicate"
                          title="Duplicate"
                          style={{ transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
                          className="flex size-8 translate-x-1.5 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-[opacity,translate,background-color,color,scale] duration-200 hover:bg-white/[0.08] hover:text-foreground focus-visible:translate-x-0 focus-visible:opacity-100 active:scale-[0.94] group-hover:translate-x-0 group-hover:opacity-100"
                        >
                          <Copy className="size-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDeleteId(session.id)}
                        aria-label="Delete"
                        title="Delete"
                        style={{ transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
                        className="flex size-8 translate-x-1.5 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-[opacity,translate,background-color,color,scale] duration-200 hover:bg-destructive/15 hover:text-destructive focus-visible:translate-x-0 focus-visible:opacity-100 active:scale-[0.94] group-hover:translate-x-0 group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            </div>

            {/* Scroll-edge fade: only while rows continue below. It says "there
                is more" without a scrollbar having to, and it means the row at
                the boundary dissolves instead of looking sliced. */}
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[oklch(0.185_0_0)] via-[oklch(0.185_0_0)]/70 to-transparent transition-opacity duration-300",
                bodyAtEnd ? "opacity-0" : "opacity-100",
              )}
            />
          </div>

        {/* The row is always present once there are rows at all — a footer that
            appears only past 15 items makes the whole table shift on filter. */}
        {sessions.length > 0 && (
          <div className="mt-4 flex min-h-9 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-3">
            {/* Range first — the count is what people actually read; "page N of M"
                is redundant with the highlighted number in the control itself. */}
            <p className="text-[12px] text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground/90">
                {rangeStart}&ndash;{rangeEnd}
              </span>{" "}
              of <span className="tabular-nums">{sessions.length}</span>
            </p>

            {/* One cohesive control, same segmented-pill idiom as the design
                toggle. Omitted at one page: a pill of dead arrows around a lone
                "1" reads as broken, where the range line alone reads as calm. */}
            {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="flex items-center gap-0.5 rounded-full bg-white/[0.03] p-1 inset-ring-1 inset-ring-white/[0.08]"
            >
              <PagerButton
                label="Previous page"
                disabled={safePage === 1}
                onClick={() => goToPage(safePage - 1)}
              >
                <ChevronLeft className="size-4" />
              </PagerButton>

              <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-white/[0.08]" />

              {pageItems.map((item, i) =>
                item === "gap" ? (
                  <span
                    key={`gap-${i}`}
                    aria-hidden
                    className="flex h-8 w-5 items-end justify-center pb-1.5 text-[12px] leading-none text-muted-foreground/50"
                  >
                    &hellip;
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => goToPage(item)}
                    aria-label={`Page ${item}`}
                    aria-current={item === safePage ? "page" : undefined}
                    className={cn(
                      // pseudo-element extends the tap target past the 32px pill
                      "relative flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 text-[12px] font-medium tabular-nums transition-[background-color,color,box-shadow,scale] duration-150 after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] active:scale-[0.96]",
                      item === safePage
                        ? "bg-violet-500/[0.17] text-violet-100 shadow-[0_1px_2px_rgba(0,0,0,0.3)] inset-ring-1 inset-ring-violet-400/40"
                        : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
                    )}
                  >
                    {item}
                  </button>
                ),
              )}

              <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-white/[0.08]" />

              <PagerButton
                label="Next page"
                disabled={safePage === totalPages}
                onClick={() => goToPage(safePage + 1)}
              >
                <ChevronRight className="size-4" />
              </PagerButton>
            </nav>
            )}
          </div>
        )}

        {dialogs}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="w-full overflow-x-auto border-b border-border">
        <div
          style={gridStyle}
          className="grid min-w-max items-center px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground/80 gap-3"
        >
          <span>Session Name</span>
          <span>Last Edited By</span>
          <span>Status</span>
          <span>Sent to Campaign</span>

          {/* Custom Column Headers */}
          {customColumns.map((col) => (
            <div key={col.id} className="min-w-0">
              {editingHeaderId === col.id ? (
                <input
                  autoFocus
                  value={col.name}
                  onChange={(e) => handleUpdateHeaderName(col.id, e.target.value)}
                  onBlur={() => setEditingHeaderId(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") setEditingHeaderId(null);
                  }}
                  className="h-6 w-full rounded border border-violet-500/50 bg-background px-1.5 text-xs text-foreground uppercase tracking-wide font-medium outline-none"
                />
              ) : (
                <div className="group/col flex items-center justify-between gap-1 pr-1">
                  <span
                    onClick={() => setEditingHeaderId(col.id)}
                    title="Click to rename column"
                    className="truncate cursor-pointer hover:text-foreground font-medium transition-colors"
                  >
                    {col.name}
                  </span>
                  <button
                    onClick={() => handleRemoveColumn(col.id)}
                    title="Remove column"
                    className="opacity-0 group-hover/col:opacity-100 text-muted-foreground hover:text-rose-400 transition-opacity"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              )}
            </div>
          ))}

          <span />

          {/* Add Column Button (+ icon at the extreme right) */}
          <div className="flex items-center justify-center">
            <button
              onClick={handleAddColumn}
              title="Add column"
              className="flex size-6 items-center justify-center rounded bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 transition-colors"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* relative: anchors the scroll-edge fade below */}
      <div className="relative min-h-0 flex-1">
      <div
        ref={attachBody}
        onScroll={handleBodyScroll}
        className="h-full overflow-y-auto overflow-x-auto pb-2"
      >
        {sessions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-muted-foreground min-w-max p-8">
            <span className="text-sm font-medium">{emptyState.title}</span>
            <span className="text-xs">{emptyState.description}</span>
          </div>
        ) : (
          pageRows.map((session) => {
            const isSelected = session.id === selectedSessionId;
            const locked = isSessionLocked(session);
            const needsResend = sessionNeedsResend(session);

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                style={gridStyle}
                className={cn(
                  "group grid min-w-max items-center border-b border-border/60 px-4 py-3 cursor-pointer transition-colors gap-3",
                  isSelected ? "bg-primary/[0.06]" : "hover:bg-accent/30"
                )}
              >
                <span className="truncate pr-4 font-medium text-sm">
                  {session.title}
                </span>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {session.lastEditedBy ? (
                    <>
                      <Avatar className="size-6">
                        <AvatarFallback className="text-[10px]">
                          {initials(session.lastEditedBy.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">
                        {session.lastEditedBy.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground/50">
                      Not edited yet
                    </span>
                  )}
                </div>

                <div>
                  <StatusBadge status={session.status} />
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  {locked ? (
                    <button
                      onClick={() => setConfirmUnlockId(session.id)}
                      title="Sent and unchanged since. Click to unlock and edit."
                      className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                    >
                      <Lock className="size-3" />
                      Locked
                    </button>
                  ) : needsResend ? (
                    session.status === "approved" ? (
                      <Button
                        size="sm"
                        className="h-7 gap-1.5 bg-violet-600 text-xs text-white hover:bg-violet-500"
                        onClick={() => onOpenSend(session.id)}
                      >
                        <RefreshCw className="size-3" />
                        Update
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled
                        title="Approve this post to send the update"
                        className="h-7 gap-1.5 text-xs text-muted-foreground/60"
                      >
                        <Info className="size-3" />
                        Update
                      </Button>
                    )
                  ) : session.status === "approved" ? (
                    <Button
                      size="sm"
                      className="h-7 gap-1.5 bg-violet-600 text-xs text-white hover:bg-violet-500"
                      onClick={() => onOpenSend(session.id)}
                    >
                      <Send className="size-3" />
                      Send
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled
                      className="h-7 gap-1.5 text-xs text-muted-foreground/60"
                    >
                      <Info className="size-3" />
                      Send
                    </Button>
                  )}
                </div>

                {/* Custom Column Cell Values */}
                {customColumns.map((col) => {
                  const cellVal =
                    customCellValues[session.id]?.[col.id] || "Untitled";
                  const isEditing =
                    editingCell?.sessionId === session.id &&
                    editingCell?.colId === col.id;

                  return (
                    <div key={col.id} className="min-w-0" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <input
                          autoFocus
                          value={
                            customCellValues[session.id]?.[col.id] ??
                            (cellVal === "Untitled" ? "" : cellVal)
                          }
                          onChange={(e) =>
                            handleUpdateCellValue(
                              session.id,
                              col.id,
                              e.target.value
                            )
                          }
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Escape")
                              setEditingCell(null);
                          }}
                          className="h-7 w-full rounded border border-violet-500/50 bg-background px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-violet-500"
                        />
                      ) : (
                        <span
                          onClick={() =>
                            setEditingCell({
                              sessionId: session.id,
                              colId: col.id,
                            })
                          }
                          title="Click to edit"
                          className={cn(
                            "inline-block max-w-full cursor-pointer truncate rounded px-1.5 py-0.5 text-xs transition-colors hover:bg-accent/60",
                            cellVal === "Untitled"
                              ? "text-muted-foreground/50 italic"
                              : "text-foreground font-medium"
                          )}
                        >
                          {cellVal}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Actions column */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-end gap-1"
                >
                  {onDuplicateSession && (
                    <button
                      onClick={() => onDuplicateSession(session.id)}
                      aria-label="Duplicate session"
                      title="Duplicate content item"
                      className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDeleteId(session.id)}
                    aria-label="Delete session"
                    title="Delete session"
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                {/* Empty column placeholder matching header + button */}
                <div />
              </div>
            );
          })
        )}
      </div>

        {/* Same scroll-edge fade as Canvas, in this table's own surface colour,
            so the boundary row dissolves instead of looking sliced. */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-background via-background/70 to-transparent transition-opacity duration-300",
            bodyAtEnd ? "opacity-0" : "opacity-100",
          )}
        />
      </div>

      {/* Classic pagination: bordered footer bar, square controls, no violet —
          it belongs to this table's language, not the Canvas one. */}
      {sessions.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border px-4 py-2.5">
          <span className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium tabular-nums text-foreground">
              {rangeStart}&ndash;{rangeEnd}
            </span>{" "}
            of <span className="tabular-nums">{sessions.length}</span>
          </span>

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center gap-1">
              <ClassicPagerButton
                label="Previous page"
                disabled={safePage === 1}
                onClick={() => goToPage(safePage - 1)}
              >
                <ChevronLeft className="size-4" />
              </ClassicPagerButton>

              {pageItems.map((item, i) =>
                item === "gap" ? (
                  <span
                    key={`gap-${i}`}
                    aria-hidden
                    className="px-1 text-xs text-muted-foreground/60"
                  >
                    &hellip;
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => goToPage(item)}
                    aria-label={`Page ${item}`}
                    aria-current={item === safePage ? "page" : undefined}
                    className={cn(
                      "flex h-7 min-w-7 items-center justify-center rounded-md border px-2 text-xs font-medium tabular-nums transition-colors",
                      item === safePage
                        ? "border-border bg-accent text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    {item}
                  </button>
                ),
              )}

              <ClassicPagerButton
                label="Next page"
                disabled={safePage === totalPages}
                onClick={() => goToPage(safePage + 1)}
              >
                <ChevronRight className="size-4" />
              </ClassicPagerButton>
            </nav>
          )}
        </div>
      )}

      {dialogs}
    </div>
  );
}

function ClassicPagerButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/**
 * A sliding window of `size` consecutive pages, plus the first and last page
 * pinned with gaps. The window is biased forward — one page behind, the rest
 * ahead — because paging is overwhelmingly a forward motion: you want to see
 * where you are going, not where you have been.
 */
function buildPageItems(
  current: number,
  total: number,
  size = 5,
): (number | "gap")[] {
  if (total <= size + 2) return Array.from({ length: total }, (_, i) => i + 1);

  const start = Math.min(Math.max(current - 1, 1), total - size + 1);
  const end = start + size - 1;

  const out: (number | "gap")[] = [];
  if (start > 1) {
    out.push(1);
    if (start > 2) out.push("gap");
  }
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total) {
    if (end < total - 1) out.push("gap");
    out.push(total);
  }
  return out;
}

function PagerButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="relative flex size-8 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,scale] duration-150 after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] hover:bg-white/[0.06] hover:text-foreground active:scale-[0.96] disabled:pointer-events-none disabled:text-muted-foreground/30"
    >
      {children}
    </button>
  );
}
