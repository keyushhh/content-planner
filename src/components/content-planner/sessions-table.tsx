"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge, STATUS_TONE } from "./status-badge";
import { ConfirmDialog } from "./confirm-dialog";
import {
  avatarTint,
  cn,
  isSessionLocked,
  relativeTime,
  sessionNeedsResend,
  tagDot,
} from "@/lib/utils";
import {
  Send,
  Lock,
  LockOpen,
  Info,
  Trash2,
  RefreshCw,
  Copy,
  Plus,
  Pencil,
  MoreHorizontal,
  Inbox,
  SearchX,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ListFilter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CustomCellValues, CustomColumn, Session } from "@/lib/types";

interface SessionsTableProps {
  /** Custom columns are owned above the table so they outlive filtering,
      sorting, paging and reloads — see the page component. */
  customColumns: CustomColumn[];
  customCellValues: CustomCellValues;
  onAddColumn: () => string;
  onRenameColumn: (colId: string, name: string) => void;
  onDeleteColumn: (colId: string) => void;
  onSetCellValue: (sessionId: string, colId: string, value: string) => void;
  sessions: Session[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
  onOpenSend: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onUnlockSession: (id: string) => void;
  onDuplicateSession?: (id: string) => void;
  emptyState?: {
    title: string;
    description: string;
    /** The way out, when there is one. Filtered-to-nothing gets "Clear filters". */
    action?: { label: string; onClick: () => void };
    /** True when the table is empty because of filters, not because there is
     *  nothing to show — a different situation that deserves different words. */
    filtered?: boolean;
  };
  /** Shows skeleton rows in place of the body. No data source is async yet, so
   *  today this is driven by the dev controls — it exists so the loading state
   *  is designed alongside everything else rather than bolted on later. */
  loading?: boolean;
  /** "classic" keeps the original table; "canvas" matches the Canvas pane. */
  variant?: "classic" | "canvas";
  /** Canvas only: rows per page. */
  pageSize?: number;
  /** Canvas only: makes the column headers clickable sort controls. */
  sortKey?: string;
  sortReversed?: boolean;
  onSort?: (key: string) => void;
  /** Canvas only: Status header cycles the status filter. */
  statusLabel?: string;
  statusFiltered?: boolean;
  onCycleStatus?: () => void;
}

/** How long a deleted row takes to collapse before the data is dropped. */
const ROW_EXIT_MS = 220;

/**
 * A column title that sorts. Inactive headers stay plain text with the arrow
 * held back until hover, so the header row does not turn into a row of controls
 * — the affordance appears when you go looking for it.
 */
function SortableHeader({
  label,
  columnKey,
  sortKey,
  sortReversed,
  onSort,
  className,
}: {
  label: string;
  columnKey: string;
  sortKey?: string;
  sortReversed?: boolean;
  onSort?: (key: string) => void;
  className?: string;
}) {
  if (!onSort) return <span className={className}>{label}</span>;
  const active = sortKey === columnKey;

  return (
    <div className={className}>
      <button
        onClick={() => onSort(columnKey)}
        aria-label={`Sort by ${label}`}
        className={cn(
          "group/sort -mx-1.5 flex h-6 max-w-full items-center gap-1 rounded-md px-1.5 transition-colors duration-150 hover:bg-(--ink)/[0.06]",
          active ? "text-foreground" : "hover:text-foreground",
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronUp
          className={cn(
            "size-3 shrink-0 transition-[opacity,rotate] duration-200",
            active
              ? "opacity-100"
              : "opacity-0 group-hover/sort:opacity-40",
            active && !sortReversed && "rotate-180",
          )}
          style={{ transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
        />
      </button>
    </div>
  );
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
  loading = false,
  variant = "classic",
  pageSize = 15,
  sortKey,
  sortReversed,
  onSort,
  statusLabel = "Status",
  statusFiltered = false,
  onCycleStatus,
  customColumns,
  customCellValues,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
  onSetCellValue,
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
  /** The row currently playing its exit, still in `sessions` until it finishes. */
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [confirmUnlockId, setConfirmUnlockId] = useState<string | null>(null);

  // Only which cell is being typed in is local — that is transient UI, not data.
  const [editingHeaderId, setEditingHeaderId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{
    sessionId: string;
    colId: string;
  } | null>(null);

  const sessionPendingDelete =
    sessions.find((s) => s.id === confirmDeleteId) ?? null;
  const sessionPendingUnlock =
    sessions.find((s) => s.id === confirmUnlockId) ?? null;

  const handleAddColumn = () => {
    setEditingHeaderId(onAddColumn());
  };

  const [confirmDeleteColId, setConfirmDeleteColId] = useState<string | null>(null);
  const columnPendingDelete =
    customColumns.find((c) => c.id === confirmDeleteColId) ?? null;

  /** How many rows have something written in this column. */
  const filledCells = (colId: string) =>
    Object.values(customCellValues).filter((cells) => (cells?.[colId] ?? "").trim())
      .length;

  /**
   * An empty column is scaffolding — drop it. One with data in it is work, and
   * deleting work silently is how people stop trusting a table.
   */
  function requestDeleteColumn(colId: string) {
    if (filledCells(colId) === 0) onDeleteColumn(colId);
    else setConfirmDeleteColId(colId);
  }

  /**
   * The row leaves before the data does.
   *
   * Deleting used to yank the row out on the same frame the dialog closed, so
   * the list snapped shut and — on the last row — an empty state appeared out of
   * nowhere. The row now collapses and fades first, and the parent is told once
   * it is gone, which keeps the surface continuous either way.
   */
  function confirmDelete(id: string) {
    setConfirmDeleteId(null);
    setLeavingId(id);
    setTimeout(() => {
      onDeleteSession(id);
      setLeavingId(null);
    }, ROW_EXIT_MS);
  }

  const dialogs = (
    <>
      <DeleteContentDialog
        session={sessionPendingDelete}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        onConfirm={() => {
          if (sessionPendingDelete) confirmDelete(sessionPendingDelete.id);
        }}
      />

      <ConfirmDialog
        open={columnPendingDelete !== null}
        onOpenChange={(open) => !open && setConfirmDeleteColId(null)}
        icon={Trash2}
        tone="destructive"
        title={
          columnPendingDelete ? (
            <>Delete the &ldquo;{columnPendingDelete.name}&rdquo; column?</>
          ) : (
            ""
          )
        }
        description={
          columnPendingDelete ? (
            <>
              It holds values on{" "}
              <span className="tabular-nums text-foreground/90">
                {filledCells(columnPendingDelete.id)}
              </span>{" "}
              {filledCells(columnPendingDelete.id) === 1 ? "item" : "items"}. Those
              go with it, and this can&rsquo;t be undone.
            </>
          ) : (
            ""
          )
        }
        actions={[
          {
            label: "Cancel",
            tone: "outline",
            onClick: () => setConfirmDeleteColId(null),
          },
          {
            label: "Delete column",
            tone: "destructive",
            onClick: () => {
              if (columnPendingDelete) onDeleteColumn(columnPendingDelete.id);
              setConfirmDeleteColId(null);
            },
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

  /**
   * Custom columns describe rows. With no rows to describe, "Column 1ds" is a
   * heading over nothing — it makes an empty table look misconfigured rather
   * than new. They come back the moment there is content, since the columns
   * themselves are never deleted.
   */
  const headerColumns = sessions.length === 0 || loading ? [] : customColumns;

  // Dynamic CSS grid template columns
  const gridStyle = {
    gridTemplateColumns: `minmax(200px, 1.5fr) 160px 110px 130px ${headerColumns
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
    "--cols-lg": `minmax(0,1fr) 176px 116px 132px ${headerColumns
      .map(() => "140px")
      .join(" ")} 80px`,
  } as React.CSSProperties;

  const canvasGridClass =
    "grid-cols-[var(--cols-sm)] @[640px]:grid-cols-[var(--cols-md)] @[900px]:grid-cols-[var(--cols-lg)]";
  /** Columns that only earn their space at full width. */
  const wideOnly = "hidden @[900px]:block";
  /** Same gate, for cells whose own layout is a flex row — `block` would win
      over the component's `flex` and stack its children vertically instead. */
  const wideOnlyRow = "hidden @[900px]:flex";

  const totalPages = Math.max(1, Math.ceil(sessions.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rangeStart = sessions.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, sessions.length);
  const pageRows = sessions.slice((safePage - 1) * pageSize, safePage * pageSize);

  /**
   * Keyboard row cursor: j/k (and the arrow keys) move it, Enter opens.
   *
   * A cursor separate from the selection is the whole point — selection opens the
   * detail pane, so "move down one row" cannot mean "select" or every keypress
   * would swap the pane's contents and steal focus. This is the Mail model: a
   * highlight you drive with one hand, committed with Enter.
   *
   * It only listens while the pane is closed (nothing is selected), because in
   * there j and k are letters someone is typing.
   */
  const [cursor, setCursor] = useState<number | null>(null);
  const cursorId = cursor !== null ? pageRows[cursor]?.id ?? null : null;

  useEffect(() => {
    if (selectedSessionId !== null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Never while the caret is in a field — j is a letter first.
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return;
      }

      const down = e.key === "j" || e.key === "ArrowDown";
      const up = e.key === "k" || e.key === "ArrowUp";
      if (!down && !up && e.key !== "Enter" && e.key !== "Escape") return;
      if (pageRows.length === 0) return;

      if (e.key === "Escape") {
        setCursor(null);
        return;
      }
      if (e.key === "Enter") {
        if (cursorId) {
          e.preventDefault();
          onSelectSession(cursorId);
        }
        return;
      }

      e.preventDefault();
      setCursor((prev) => {
        // First press lands on the first row rather than jumping to row 2
        if (prev === null) return down ? 0 : pageRows.length - 1;
        const next = down ? prev + 1 : prev - 1;
        return Math.max(0, Math.min(pageRows.length - 1, next));
      });
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pageRows, cursorId, onSelectSession, selectedSessionId]);

  /** Keeps the cursor row on screen when it walks past the fold. */
  useEffect(() => {
    if (cursorId === null) return;
    bodyRef.current
      ?.querySelector(`[data-row-id="${cursorId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursorId]);

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
        <div className="relative flex min-h-0 flex-col overflow-clip rounded-(--r-surface) bg-(--surface-raised) shadow-(--lift-lg) [.wozku.wozku-light_&]:shadow-none inset-ring-1 inset-ring-(--ink)/[0.08] @container">
            <div
              aria-hidden
              className="h-px w-full shrink-0 [background-image:var(--specular)]"
            />

            <div
              style={canvasGrid}
              className={cn(
                "z-10 grid shrink-0 items-center gap-3 border-b bg-(--surface-panel) px-5 py-2.5 text-[11px] font-medium text-muted-foreground transition-[border-color,box-shadow] duration-200",
                canvasGridClass,
                // the header acknowledges scroll with the same lift the detail
                // pane's toolbar uses, so the two read as one system
                bodyScrolled
                  ? "border-(--ink)/[0.10] shadow-(--lift-md)"
                  : "border-(--ink)/[0.06]",
              )}
            >
              <SortableHeader
                label="Name"
                columnKey="name"
                sortKey={sortKey}
                sortReversed={sortReversed}
                onSort={onSort}
                className="min-w-0"
              />
              <SortableHeader
                label="Last edited by"
                columnKey="edited"
                sortKey={sortKey}
                sortReversed={sortReversed}
                onSort={onSort}
                className="hidden min-w-0 @[640px]:block"
              />
              {/* Status filters rather than sorts: ordering by bucket answers a
                  question nobody asks, where "show me only the approved ones"
                  is the whole reason to touch this column. Each click steps to
                  the next status and then back to All. */}
              <div className="min-w-0">
                {onCycleStatus ? (
                  <button
                    onClick={onCycleStatus}
                    title="Filter by status"
                    aria-label={`Filter by status, currently ${statusLabel}`}
                    className={cn(
                      "group/status -mx-1.5 flex h-6 max-w-full items-center gap-1 rounded-md px-1.5 transition-colors duration-150 hover:bg-(--ink)/[0.06]",
                      statusFiltered ? "text-violet-200" : "hover:text-foreground",
                    )}
                  >
                    <span className="truncate">{statusLabel}</span>
                    <ListFilter
                      className={cn(
                        "size-3 shrink-0 transition-opacity duration-200",
                        statusFiltered
                          ? "opacity-100"
                          : "opacity-0 group-hover/status:opacity-40",
                      )}
                    />
                  </button>
                ) : (
                  <span>Status</span>
                )}
              </div>
              <span className={wideOnly}>Campaign</span>

              {headerColumns.map((col) => (
                <CustomColumnHeader
                  key={col.id}
                  column={col}
                  variant="canvas"
                  className={wideOnlyRow}
                  editing={editingHeaderId === col.id}
                  onStartRename={() => setEditingHeaderId(col.id)}
                  onCommitRename={(name) => onRenameColumn(col.id, name)}
                  onStopRename={() => setEditingHeaderId(null)}
                  onDelete={() => requestDeleteColumn(col.id)}
                />
              ))}

              {/* only offered where custom columns actually render */}
              <div className={cn("items-center justify-end", "hidden @[900px]:flex")}>
                <button
                  onClick={handleAddColumn}
                  title="Add column"
                  aria-label="Add column"
                  className="flex size-7 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.08] hover:text-foreground active:scale-(--press)"
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
            {loading ? (
              <SkeletonRows rows={pageSize > 10 ? 10 : pageSize} />
            ) : sessions.length === 0 ? (
              <EmptyRows emptyState={emptyState} />
            ) : (
              pageRows.map((session) => {
                const isSelected = session.id === selectedSessionId;
                const locked = isSessionLocked(session);
                const needsResend = sessionNeedsResend(session);

                return (
                  <div
                    key={session.id}
                    data-row-id={session.id}
                    onClick={() => onSelectSession(session.id)}
                    style={canvasGrid}
                    className={cn(
                      // A FIXED row height is what makes 15 rows read as a
                      // rhythm: with padding alone, a row with tags stood 14px
                      // taller than one without and the whole list stuttered.
                      "group relative grid h-[58px] cursor-pointer items-center gap-3 border-b border-(--ink)/[0.05] px-5 last:border-b-0",
                      "transition-[height,opacity,translate,background-color,box-shadow] duration-220",
                      canvasGridClass,
                      // Collapses and slips left on its way out, so the rows
                      // below close the gap instead of jumping into it.
                      session.id === leavingId &&
                        "pointer-events-none !h-0 -translate-x-2 overflow-hidden !border-b-0 opacity-0",
                      // Selection is a LIFT — a ring plus a shadow, the row
                      // coming forward off the sheet. Hover stays a tint. They
                      // were two volumes of one gesture before; now "I am reading
                      // this" and "my cursor is here" are different kinds of
                      // signal, which is what lets them coexist on one row.
                      isSelected
                        ? "z-10 bg-violet-500/[0.09] shadow-(--lift-md) inset-ring-1 inset-ring-violet-400/35"
                        : "hover:bg-(--ink)/[0.035]",
                      // The keyboard cursor: lighter than selection, because it
                      // is a place you are pointing at rather than a thing you
                      // have opened.
                      !isSelected &&
                        session.id === cursorId &&
                        "bg-(--ink)/[0.05] inset-ring-1 inset-ring-(--ink)/[0.14]",
                    )}
                  >
                    {/* Status, as a hairline down the leading edge. Fifteen of
                        these read as a column of state before you have read a
                        single word — which is the job the badge cannot do,
                        because you have to look at it to use it. */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-y-0 left-0 w-[2px] transition-opacity duration-150",
                        STATUS_TONE[session.status].bar,
                        // Held back a little at rest so a full table does not
                        // read as a barcode; full strength on the row you are on.
                        isSelected ? "opacity-100" : "opacity-70 group-hover:opacity-100",
                      )}
                    />
                    <div className="min-w-0 pr-4">
                      {/* title brightens on row hover — the row answers the
                          cursor instead of merely being highlighted */}
                      <div
                        data-row-title
                        className={cn(
                          "truncate text-[13.5px] font-medium transition-colors duration-150",
                          isSelected
                            ? "text-foreground"
                            : "text-foreground/85 group-hover:text-foreground",
                        )}
                      >
                        {session.title}
                      </div>
                      {/* Tags as quiet text, not pills. Filled chips here put a
                          second chip treatment on screen competing with the
                          filter bar, and they out-weighted the title itself.
                          The colour rides on a 4px dot instead: enough to scan a
                          topic down the column, nowhere near enough to shout. */}
                      {session.tags.length > 0 && (
                        <div className="mt-0.5 flex items-center gap-2 truncate text-[11px] text-muted-foreground/70">
                          {session.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="flex shrink-0 items-center gap-1.5">
                              <span
                                aria-hidden
                                className={cn(
                                  "size-1 rounded-(--r-round) opacity-80 transition-opacity duration-150 group-hover:opacity-100",
                                  tagDot(tag),
                                )}
                              />
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
                          <Avatar className="size-6 shrink-0 inset-ring-1 inset-ring-(--ink)/10">
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
                      <StatusBadge status={session.status} variant="dot" />
                    </div>

                    <div className={wideOnly} onClick={(e) => e.stopPropagation()}>
                      {locked ? (
                        // Quiet: a filled emerald pill in every sent row made the
                        // column read as clutter. Only Send stays loud.
                        <button
                          onClick={() => setConfirmUnlockId(session.id)}
                          title="Sent and unchanged since. Click to unlock and edit."
                          className="inline-flex h-7 items-center gap-1.5 rounded-(--r-pill) px-2 text-xs font-medium text-emerald-300/80 transition-[background-color,color,scale] duration-150 hover:bg-emerald-500/10 hover:text-emerald-200 active:scale-(--press)"
                        >
                          <Lock className="size-3" />
                          Locked
                        </button>
                      ) : session.status === "approved" ? (
                        <button
                          onClick={() => onOpenSend(session.id)}
                          className="inline-flex h-7 items-center gap-1.5 rounded-(--r-pill) bg-violet-600 px-3 text-xs font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-(--press)"
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

                    {customColumns.map((col) => (
                      <CustomCell
                        key={col.id}
                        variant="canvas"
                        className={wideOnly}
                        columnName={col.name}
                        value={customCellValues[session.id]?.[col.id] ?? ""}
                        editing={
                          editingCell?.sessionId === session.id &&
                          editingCell?.colId === col.id
                        }
                        onStartEdit={() =>
                          setEditingCell({ sessionId: session.id, colId: col.id })
                        }
                        onCommit={(value) => onSetCellValue(session.id, col.id, value)}
                        onStopEdit={() => setEditingCell(null)}
                      />
                    ))}

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
                          className="flex size-8 translate-x-1.5 items-center justify-center rounded-(--r-pill) text-muted-foreground opacity-0 transition-[opacity,translate,background-color,color,scale] duration-200 hover:bg-(--ink)/[0.08] hover:text-foreground focus-visible:translate-x-0 focus-visible:opacity-100 active:scale-(--press) group-hover:translate-x-0 group-hover:opacity-100"
                        >
                          <Copy className="size-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDeleteId(session.id)}
                        aria-label="Delete"
                        title="Delete"
                        style={{ transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
                        className="flex size-8 translate-x-1.5 items-center justify-center rounded-(--r-pill) text-muted-foreground opacity-0 transition-[opacity,translate,background-color,color,scale] duration-200 hover:bg-destructive/15 hover:text-destructive focus-visible:translate-x-0 focus-visible:opacity-100 active:scale-(--press) group-hover:translate-x-0 group-hover:opacity-100"
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
                "pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-(--surface-raised) via-(--surface-raised)/70 to-transparent transition-opacity duration-300",
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
              className="flex items-center gap-0.5 rounded-(--r-pill) bg-white dark:bg-(--ink)/[0.03] p-1 inset-ring-1 inset-ring-(--ink)/[0.08]"
            >
              <PagerButton
                label="Previous page"
                disabled={safePage === 1}
                onClick={() => goToPage(safePage - 1)}
              >
                <ChevronLeft className="size-4" />
              </PagerButton>

              <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-(--ink)/[0.08]" />

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
                      "relative flex h-8 min-w-8 items-center justify-center rounded-(--r-pill) px-2.5 text-[12px] font-medium tabular-nums transition-[background-color,color,box-shadow,scale] duration-150 after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] active:scale-(--press)",
                      item === safePage
                        ? "bg-violet-500/[0.17] text-violet-100 shadow-(--lift-sm) inset-ring-1 inset-ring-violet-400/40"
                        : "text-muted-foreground hover:bg-(--ink)/[0.06] hover:text-foreground",
                    )}
                  >
                    {item}
                  </button>
                ),
              )}

              <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-(--ink)/[0.08]" />

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
          {headerColumns.map((col) => (
            <CustomColumnHeader
              key={col.id}
              column={col}
              variant="classic"
              editing={editingHeaderId === col.id}
              onStartRename={() => setEditingHeaderId(col.id)}
              onCommitRename={(name) => onRenameColumn(col.id, name)}
              onStopRename={() => setEditingHeaderId(null)}
              onDelete={() => requestDeleteColumn(col.id)}
            />
          ))}

          <span />

          {/* Add Column Button (+ icon at the extreme right) */}
          <div className="flex items-center justify-center">
            <button
              onClick={handleAddColumn}
              title="Add column"
              className="flex size-6 items-center justify-center rounded-sm bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 transition-colors"
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
        {loading ? (
          <SkeletonRows rows={8} />
        ) : sessions.length === 0 ? (
          <div className="min-w-max">
            <EmptyRows emptyState={emptyState} />
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
                  "group relative grid min-w-max items-center border-b border-border/60 px-4 py-3 cursor-pointer gap-3",
                  "transition-[height,padding,opacity,translate,background-color,box-shadow] duration-220",
                  isSelected
                    ? "z-10 bg-primary/[0.06] shadow-(--lift-md) inset-ring-1 inset-ring-violet-400/30"
                    : "hover:bg-accent/30",
                  // Same exit as the canvas rows — see confirmDelete
                  session.id === leavingId &&
                    "pointer-events-none !h-0 -translate-x-2 overflow-hidden !border-b-0 !py-0 opacity-0",
                )}
              >
                {/* Status hairline, same as the canvas table */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-0 left-0 w-[2px] transition-opacity duration-150",
                    STATUS_TONE[session.status].bar,
                    isSelected ? "opacity-100" : "opacity-70 group-hover:opacity-100",
                  )}
                />
                <span data-row-title className="truncate pr-4 font-medium text-sm">
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
                {customColumns.map((col) => (
                  <CustomCell
                    key={col.id}
                    variant="classic"
                    columnName={col.name}
                    value={customCellValues[session.id]?.[col.id] ?? ""}
                    editing={
                      editingCell?.sessionId === session.id &&
                      editingCell?.colId === col.id
                    }
                    onStartEdit={() =>
                      setEditingCell({ sessionId: session.id, colId: col.id })
                    }
                    onCommit={(value) => onSetCellValue(session.id, col.id, value)}
                    onStopEdit={() => setEditingCell(null)}
                  />
                ))}

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

/**
 * A one-line field that lives only while it is being edited.
 *
 * The draft is local, which is the whole point: writing every keystroke straight
 * through meant an empty field instantly refilled itself with its fallback, so a
 * name could never be cleared and retyped — the thing that made these columns
 * feel write-once. Enter and blur commit, Escape abandons.
 */
/**
 * Loading rows.
 *
 * Built to the real row's measurements — 58px pitch, bars where the title,
 * status and byline sit — so the table does not jump when the data lands. The
 * sheen sweeps across the whole block rather than each bar pulsing on its own:
 * one light passing over one surface, not fifteen rows blinking out of phase.
 */
function SkeletonRows({ rows = 8 }: { rows?: number }) {
  return (
    <div aria-hidden className="relative overflow-hidden">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex h-[58px] items-center gap-3 border-b border-(--ink)/[0.04] px-5 last:border-b-0"
        >
          <div
            className="h-2.5 rounded-(--r-pill) bg-(--ink)/[0.055]"
            // Varied widths: equal bars read as a grid of placeholders, uneven
            // ones read as titles of different lengths.
            style={{ width: `${28 + ((i * 37) % 22)}%` }}
          />
          <div className="h-2.5 w-14 rounded-(--r-pill) bg-(--ink)/[0.04]" />
          <div className="ml-auto flex items-center gap-3">
            <div className="h-2.5 w-20 rounded-(--r-pill) bg-(--ink)/[0.035]" />
            <div className="size-6 rounded-(--r-pill) bg-(--ink)/[0.04]" />
          </div>
        </div>
      ))}
      <div
        className="pointer-events-none absolute inset-0 motion-reduce:hidden"
        style={{
          background:
            "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.045) 50%, transparent 70%)",
          backgroundSize: "220% 100%",
          animation: "table-sheen 1.6s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/**
 * The empty table.
 *
 * No ghost rows: dim bars at row pitch are the vocabulary of LOADING, and
 * borrowing them here told you to wait for something that is never coming. An
 * empty table is a finished state, and it should look settled rather than
 * pending.
 *
 * So it is the same small composition the rest of the app uses for nothing-here
 * — violet medallion, title, one line of explanation, one action — sized to its
 * content and centred in whatever height the sheet has. Filtered-to-nothing and
 * genuinely-nothing differ in glyph, words, and which of the two is worth a
 * violet button.
 */
function EmptyRows({
  emptyState,
}: {
  emptyState: {
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
    filtered?: boolean;
  };
}) {
  const Glyph = emptyState.filtered ? SearchX : Inbox;

  return (
    // Fades in, because it usually arrives right after the last row left: two
    // hard cuts in a row is what made deleting feel like the table broke.
    <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden duration-300 animate-in fade-in">
      {/* One soft violet lift under the composition — the app's own signal that
          a surface is a place where something begins. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:var(--wash-center)]"
      />

      <div className="relative flex flex-col items-center gap-2 px-8 py-12 text-center">
        <span className="flex size-11 items-center justify-center rounded-(--r-pill) bg-violet-500/[0.10] text-violet-300 inset-ring-1 inset-ring-violet-400/25">
          <Glyph className="size-[17px]" />
        </span>
        <span className="mt-1.5 text-[14px] font-semibold tracking-[-0.01em]">
          {emptyState.title}
        </span>
        <span className="max-w-[330px] text-[12.5px] leading-snug text-muted-foreground text-pretty">
          {emptyState.description}
        </span>

        {emptyState.action && (
          <button
            onClick={emptyState.action.onClick}
            className={cn(
              "mt-3.5 flex h-9 items-center gap-1.5 rounded-(--r-pill) px-4 text-[13px] font-medium transition-[background-color,box-shadow,scale] duration-150 active:scale-(--press)",
              // Creating content is the primary act; clearing a filter is a way
              // back. Only one of the two earns the violet.
              emptyState.filtered
                ? "bg-(--ink)/[0.04] inset-ring-1 inset-ring-(--ink)/[0.09] hover:bg-(--ink)/[0.08] hover:inset-ring-(--ink)/20"
                : "bg-violet-600 text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 hover:bg-violet-500",
            )}
          >
            {!emptyState.filtered && <Plus className="size-4" />}
            {emptyState.action.label}
          </button>
        )}
      </div>
    </div>
  );
}

function InlineEdit({
  initial,
  ariaLabel,
  className,
  selectOnFocus,
  onCommit,
  onDone,
}: {
  initial: string;
  ariaLabel: string;
  className?: string;
  selectOnFocus?: boolean;
  onCommit: (value: string) => void;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState(initial);

  function commit() {
    onCommit(draft.trim());
    onDone();
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={selectOnFocus ? (e) => e.currentTarget.select() : undefined}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        else if (e.key === "Escape") {
          // must not reach the page handler, which closes the whole view
          e.stopPropagation();
          onDone();
        }
      }}
      aria-label={ariaLabel}
      className={cn("w-full outline-none", className)}
    />
  );
}

/**
 * A custom column's title. Renaming keeps a LOCAL draft: writing every keystroke
 * straight to the column meant an empty field instantly refilled itself with
 * "Column", so the name could never actually be cleared and retyped — which is
 * what made these columns feel write-once.
 *
 * Rename and Delete also live in a menu, not only on a hover-X: an affordance
 * you have to discover by accident is not an affordance.
 */
function CustomColumnHeader({
  column,
  variant,
  className,
  editing,
  onStartRename,
  onCommitRename,
  onStopRename,
  onDelete,
}: {
  column: CustomColumn;
  variant: "canvas" | "classic";
  className?: string;
  editing: boolean;
  onStartRename: () => void;
  onCommitRename: (name: string) => void;
  onStopRename: () => void;
  onDelete: () => void;
}) {
  const isCanvas = variant === "canvas";

  if (editing) {
    return (
      <div className={cn("min-w-0", className)}>
        {/* Mounted only while renaming, so its draft starts from the current
            name by construction — no effect re-seeding it after the fact. */}
        <InlineEdit
          initial={column.name}
          selectOnFocus
          ariaLabel="Column name"
          onCommit={(next) => onCommitRename(next || column.name)}
          onDone={onStopRename}
          className={cn(
            "h-6",
            isCanvas
              ? "rounded-md bg-(--ink)/[0.06] px-1.5 text-[11px] font-medium caret-violet-400 inset-ring-1 inset-ring-violet-400/50"
              : "rounded-sm border border-violet-500/50 bg-background px-1.5 text-xs font-medium uppercase tracking-wide text-foreground",
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn("group/col flex min-w-0 items-center gap-1", className)}>
      <button
        onClick={onStartRename}
        title={`Rename “${column.name}”`}
        className={cn(
          "min-w-0 truncate text-left transition-colors hover:text-foreground",
          !isCanvas && "font-medium",
        )}
      >
        {column.name}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              aria-label={`${column.name} column options`}
              title="Column options"
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-[opacity,background-color,color] duration-150 focus-visible:opacity-100 group-hover/col:opacity-100 data-[popup-open]:opacity-100",
                isCanvas ? "hover:bg-(--ink)/[0.10] hover:text-foreground" : "hover:bg-accent",
              )}
            />
          }
        >
          <MoreHorizontal className="size-3.5" />
        </DropdownMenuTrigger>
        {/* Sized to its items, not to the 20px trigger it is anchored to —
            inheriting the anchor width wrapped "Delete column" onto two lines. */}
        <DropdownMenuContent align="end" className="w-auto min-w-[172px]">
          <DropdownMenuItem onClick={onStartRename} className="whitespace-nowrap">
            <Pencil className="size-3.5 text-muted-foreground" />
            <span className="flex-1">Rename</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="whitespace-nowrap">
            <Trash2 className="size-3.5 text-destructive" />
            <span className="flex-1 text-destructive">Delete column</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * One custom-column cell. Editable at any point in the row's life, not only at
 * the moment the column is born: click (or Enter on the keyboard) opens it, blur
 * or Enter commits, Escape reverts to what was there.
 */
function CustomCell({
  variant,
  className,
  columnName,
  value,
  editing,
  onStartEdit,
  onCommit,
  onStopEdit,
}: {
  variant: "canvas" | "classic";
  className?: string;
  columnName: string;
  value: string;
  editing: boolean;
  onStartEdit: () => void;
  onCommit: (value: string) => void;
  onStopEdit: () => void;
}) {
  const isCanvas = variant === "canvas";

  return (
    <div className={cn("min-w-0", className)} onClick={(e) => e.stopPropagation()}>
      {editing ? (
        <InlineEdit
          initial={value}
          ariaLabel={columnName}
          onCommit={onCommit}
          onDone={onStopEdit}
          className={cn(
            "h-7",
            isCanvas
              ? "rounded-md bg-(--ink)/[0.06] px-2 text-xs caret-violet-400 inset-ring-1 inset-ring-violet-400/50"
              : "rounded-sm border border-violet-500/50 bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-violet-500",
          )}
        />
      ) : (
        <button
          onClick={onStartEdit}
          title={`Edit ${columnName}`}
          className={cn(
            "block max-w-full truncate rounded-md px-1.5 py-0.5 text-left text-xs transition-colors",
            isCanvas ? "hover:bg-(--ink)/[0.06]" : "hover:bg-accent/60",
            value
              ? "font-medium"
              : // Nothing written yet: stay out of the way until the row is
                // hovered, then offer. A column of italic "Empty" repeated 15
                // times is noise pretending to be data.
                "text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
          )}
        >
          {value || "Add…"}
        </button>
      )}
    </div>
  );
}

/**
 * Deleting a piece of content, stated as the thing itself rather than as a
 * generic alarm. Two problems with the old dialog: an amber warning triangle
 * borrowed from an OS error, and body copy ("All content associated with this
 * session will be permanently removed") that padded out one fact into a
 * sentence. What actually matters is WHICH item this is, and whether it is live
 * anywhere — so the item is shown, and the campaigns are counted.
 */
function DeleteContentDialog({
  session,
  onOpenChange,
  onConfirm,
}: {
  session: Session | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const sentCount = session?.sentToCampaignIds.length ?? 0;

  return (
    <ConfirmDialog
      open={session !== null}
      onOpenChange={onOpenChange}
      icon={Trash2}
      tone="destructive"
      title="Delete this content?"
      description={
        sentCount > 0 ? (
          <>
            It is live on Wozku in{" "}
            <span className="tabular-nums text-foreground/90">{sentCount}</span>{" "}
            {sentCount === 1 ? "campaign" : "campaigns"} and will be removed from{" "}
            {sentCount === 1 ? "it" : "them"} too. It will be deleted{" "}
            <span className="text-foreground/90">permanently</span>. This action
            cannot be undone.
          </>
        ) : (
          <>
            Its copy, assets and comments go with it. It will be deleted{" "}
            <span className="text-foreground/90">permanently</span>. This action
            cannot be undone.
          </>
        )
      }
      preview={
        session && (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-medium">
                {session.title}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                <span>{session.postType}</span>
                <span aria-hidden className="text-muted-foreground/30">
                  ·
                </span>
                <span>
                  {session.lastEditedBy
                    ? `${session.lastEditedBy.name} · ${relativeTime(session.updatedAt)}`
                    : "Not edited yet"}
                </span>
              </div>
            </div>
            <StatusBadge status={session.status} variant="dot" />
          </div>
        )
      }
      actions={[
        { label: "Cancel", tone: "outline", onClick: () => onOpenChange(false) },
        { label: "Delete", tone: "destructive", icon: Trash2, onClick: onConfirm },
      ]}
    />
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
      className="relative flex size-8 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color,scale] duration-150 after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press) disabled:pointer-events-none disabled:text-muted-foreground/30"
    >
      {children}
    </button>
  );
}
