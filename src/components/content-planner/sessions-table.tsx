"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  PRIMARY_ACTION_MD,
  PRIMARY_ACTION_SM,
  SECONDARY_ACTION_MD,
} from "@/lib/button-styles";
import { Hint } from "@/components/ui/tooltip";
import {
  Send,
  Check,
  ExternalLink,
  Lock,
  LockOpen,
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
  PencilLine,
  CheckCircle2,
  ChevronUp,
  ListFilter,
  Tag,
  Minus,
  FileEdit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { campaignNamesFor } from "@/lib/campaigns";
import type { Campaign, CustomCellValues, CustomColumn, Session } from "@/lib/types";

export interface EmptyStateSpec {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  filtered?: boolean;
  /** Draws the Write → Approve → Send row. */
  journey?: boolean;
}

const JOURNEY_STEPS = [
  { icon: PencilLine, label: "Write it" },
  { icon: CheckCircle2, label: "Get it approved" },
  { icon: Send, label: "Send to a campaign" },
];

interface SessionsTableProps {
  customColumns?: CustomColumn[];
  customCellValues?: CustomCellValues;
  onAddColumn?: () => string;
  onRenameColumn?: (colId: string, name: string) => void;
  onDeleteColumn?: (colId: string) => void;
  onSetCellValue?: (sessionId: string, colId: string, value: string) => void;
  sessions: Session[];
  campaigns?: Campaign[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
  onOpenSend: (id: string) => void;
  onOpenCampaign?: (id: string) => void;
  onViewPublic?: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onUnlockSession: (id: string) => void;
  onDuplicateSession?: (id: string) => void;
  emptyState?: EmptyStateSpec;
  loading?: boolean;
  variant?: "classic" | "canvas";
  pageSize?: number;
  sortKey?: string;
  sortReversed?: boolean;
  onSort?: (key: string) => void;
  statusLabel?: string;
  statusFiltered?: boolean;
  onCycleStatus?: () => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  actionsFade?: boolean;
}

const ROW_EXIT_MS = 220;

const EDITED_LEFT = 560;

const NAME_CAP = 310;

export const MAX_CUSTOM_COLUMNS = 2;

function SelectBox({
  checked,
  indeterminate,
  label,
  onToggle,
}: {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onToggle: (shiftKey: boolean) => void;
}) {
  const on = checked || Boolean(indeterminate);
  return (
    <button
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      title={label}
      onClick={(e) => onToggle(e.shiftKey)}
      className={cn(
        "flex size-[17px] shrink-0 items-center justify-center rounded-[5px] transition-[background-color,box-shadow,opacity,scale] duration-150 active:scale-90",
        on
          ? "bg-violet-500 text-white inset-ring-1 inset-ring-violet-400"
          : "bg-transparent inset-ring-1 inset-ring-(--ink)/[0.16] group-hover:inset-ring-(--ink)/40 hover:!inset-ring-(--ink)/55",
      )}
    >
      {indeterminate ? (
        <Minus className="size-3" strokeWidth={3} />
      ) : (
        <Check
          className={cn(
            "size-3 transition-[scale,opacity] duration-150",
            checked ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
          strokeWidth={3}
        />
      )}
    </button>
  );
}

const CAMPAIGN_NAME_MAX = 18;

function CampaignNames({
  session,
  campaigns,
  onOpenCampaign,
}: {
  session: Session;
  campaigns: Campaign[];
  onOpenCampaign?: (id: string) => void;
}) {
  const named = campaignNamesFor(session, campaigns);

  if (named.length === 0) {
    return (
      <span title="Not in a campaign" className="text-muted-foreground/40">
        ·
      </span>
    );
  }

  const first = named[0];
  const clipped =
    first.name.length > CAMPAIGN_NAME_MAX
      ? `${first.name.slice(0, CAMPAIGN_NAME_MAX).trimEnd()}…`
      : first.name;
  const describe = named
    .map((n) => (n.draft ? `${n.name} (draft)` : n.name))
    .join(", ");
  const title = named.length === 1 ? describe : `In ${describe}`;

  const nameEl = onOpenCampaign ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpenCampaign(first.id);
      }}
      className={cn(
        "truncate rounded-sm text-left underline-offset-2 transition-colors duration-150 hover:text-violet-300 hover:underline",
        first.draft ? "text-amber-100/80" : "text-foreground/80",
      )}
    >
      {clipped}
    </button>
  ) : (
    <span
      className={cn(
        "truncate",
        first.draft ? "text-amber-100/80" : "text-foreground/80",
      )}
    >
      {clipped}
    </span>
  );

  return (
    <span title={title} className="flex min-w-0 items-center gap-1.5">
      {first.draft && (
        <FileEdit
          aria-label="Waiting as a draft"
          className="size-3 shrink-0 text-amber-300/85"
        />
      )}
      {nameEl}
      {named.length > 1 && (
        <span className="shrink-0 tabular-nums text-muted-foreground/70">
          +{named.length - 1}
        </span>
      )}
    </span>
  );
}

function CampaignCell({
  session,
  campaigns,
  onOpenSend,
  singleDestination,
}: {
  session: Session;
  campaigns: Campaign[];
  onOpenSend: (id: string) => void;
  singleDestination?: boolean;
}) {
  const locked = isSessionLocked(session);
  const needsResend = sessionNeedsResend(session);
  const sent = session.sentToCampaignIds.length > 0;
  const approved = session.status === "approved";
  const staged = session.draftCampaignIds.length > 0;

  if (staged) {
    return (
      <button
        onClick={() => onOpenSend(session.id)}
        disabled={!approved}
        title={`Staged, not yet submitted, in ${session.draftCampaignIds.length} ${
          session.draftCampaignIds.length === 1 ? "campaign" : "campaigns"
        }${approved ? " · send it to another" : ""}`}
        className="group/send inline-flex h-7 max-w-full items-center gap-1.5 rounded-(--r-pill) bg-amber-500/[0.12] px-2.5 text-xs font-medium text-amber-200 inset-ring-1 inset-ring-amber-400/25 transition-[background-color,scale] duration-150 hover:bg-amber-500/20 active:scale-(--press) disabled:pointer-events-none"
      >
        <FileEdit className="size-3 shrink-0" />
        <span className="truncate">Staged</span>
      </button>
    );
  }

  if (!sent) {
    return approved ? (
      <button
        onClick={() => onOpenSend(session.id)}
        className={cn(PRIMARY_ACTION_SM, "inline-flex")}
      >
        <Send className="size-3" />
        Send
      </button>
    ) : (
      <span
        title="Approve this post to send it"
        className="text-xs text-muted-foreground/70"
      >
        Not ready
      </span>
    );
  }

  const names = session.sentToCampaignIds
    .map((id) => campaigns.find((c) => c.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  const label = names.length
    ? names.length === 1
      ? names[0]
      : `${names[0]} +${names.length - 1}`
    : `${session.sentToCampaignIds.length} campaigns`;

  const action = needsResend
    ? approved
      ? "Send update"
      : "Approve to update"
    : singleDestination
      ? "Up to date"
      : "Send to another";
  const actionable = approved && (needsResend || !singleDestination);

  return (
    <button
      onClick={() => onOpenSend(session.id)}
      disabled={!actionable}
      title={
        names.length
          ? `In ${names.join(", ")}${
              actionable
                ? needsResend
                  ? " · send the update"
                  : " · send it to another campaign"
                : approved
                  ? " · sent and unchanged since"
                  : " · approve it to send the update"
            }`
          : undefined
      }
      className="group/send -mx-1.5 flex max-w-full flex-col items-start gap-px rounded-md px-1.5 py-1 text-left transition-colors duration-150 hover:bg-(--ink)/[0.06] disabled:pointer-events-none"
    >
      <span className="flex max-w-full items-center gap-1">
        {locked && (
          <Lock className="size-2.5 shrink-0 text-muted-foreground/55" />
        )}
        <span className="truncate text-[12px] text-foreground/85">{label}</span>
      </span>
      <span
        className={cn(
          "flex max-w-full items-center gap-1 text-[11px] font-medium transition-colors duration-150",
          !actionable
            ? "text-muted-foreground/60"
            : needsResend
              ? "text-violet-200"
              : "text-muted-foreground/70 group-hover/send:text-violet-200",
        )}
      >
        {actionable && <RefreshCw className="size-2.5 shrink-0" />}
        <span className="truncate">{action}</span>
      </span>
    </button>
  );
}

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
  campaigns = [],
  selectedSessionId,
  onSelectSession,
  onOpenSend,
  onOpenCampaign,
  onViewPublic,
  onDeleteSession,
  onUnlockSession,
  onDuplicateSession,
  emptyState = {
    title: "No posts yet",
    description: 'Click "New post" to create your first one.',
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
  selectedIds,
  onSelectionChange,
  actionsFade = true,
  customColumns = [],
  customCellValues = {},
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
  onSetCellValue,
}: SessionsTableProps) {
  const [page, setPage] = useState(1);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [bodyScrolled, setBodyScrolled] = useState(false);
  const [bodyAtEnd, setBodyAtEnd] = useState(true);
  const [bodyAtRight, setBodyAtRight] = useState(true);

  const readScrollEdges = useCallback((el: HTMLElement) => {
    setBodyScrolled(el.scrollTop > 2);
    setBodyAtEnd(el.scrollHeight - el.scrollTop - el.clientHeight <= 1);
    setBodyAtRight(el.scrollWidth - el.scrollLeft - el.clientWidth <= 1);
  }, []);

  const attachBody = useCallback(
    (el: HTMLDivElement | null) => {
      bodyRef.current = el;
      if (!el) return;
      readScrollEdges(el);
      const observer = new ResizeObserver(() => readScrollEdges(el));
      observer.observe(el);
      for (const child of Array.from(el.children)) observer.observe(child);
      return () => {
        observer.disconnect();
        bodyRef.current = null;
      };
    },
    [readScrollEdges],
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [confirmUnlockId, setConfirmUnlockId] = useState<string | null>(null);

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
    const id = onAddColumn?.();
    if (id) setEditingHeaderId(id);
  };

  const [confirmDeleteColId, setConfirmDeleteColId] = useState<string | null>(null);
  const columnPendingDelete =
    customColumns.find((c) => c.id === confirmDeleteColId) ?? null;

  const filledCells = (colId: string) =>
    Object.values(customCellValues).filter((cells) => (cells?.[colId] ?? "").trim())
      .length;

  function requestDeleteColumn(colId: string) {
    if (filledCells(colId) === 0) onDeleteColumn?.(colId);
    else setConfirmDeleteColId(colId);
  }

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
              if (columnPendingDelete) onDeleteColumn?.(columnPendingDelete.id);
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
        description="This moves it back to WIP so you can edit it. It stays sent to Wozku as-is until you re-approve and send the update, and nothing changes there until then."
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

  const selectable = Boolean(selectedIds && onSelectionChange);
  const selectedSet = new Set<string>(selectedIds ?? []);
  const lastPickedRef = useRef<number | null>(null);

  const headerColumns = sessions.length === 0 || loading ? [] : customColumns;

  const gridStyle = {
    gridTemplateColumns: `minmax(200px, 1.5fr) 110px 160px 110px 130px ${headerColumns
      .map(() => "140px")
      .join(" ")} 60px 40px`,
  };

  const pick = selectable ? "26px " : "";
  const campaignLeft = 20 + (selectable ? 26 + 12 : 0) + NAME_CAP + 12;
  const campaignWidth = EDITED_LEFT - 12 - campaignLeft;
  const viewCol = onViewPublic ? "96px " : "";
  const actionsBuffer = headerColumns.length === 0 ? " 88px" : "";
  const canvasGrid = {
    "--cols-sm": `${pick}minmax(0,1fr) 104px`,
    "--cols-md": `${pick}minmax(0,1fr) 152px 184px 112px`,
    "--cols-lg": `${pick}${NAME_CAP}px ${campaignWidth}px 160px 118px ${viewCol}116px${actionsBuffer} ${headerColumns
      .map(() => "140px")
      .join(" ")}`,
  } as React.CSSProperties;

  const canvasGridClass =
    "grid-cols-[var(--cols-sm)] @[640px]:grid-cols-[var(--cols-md)] @[900px]:grid-cols-[var(--cols-lg)]";
  const wideOnly = "hidden @[900px]:block";
  const midOnly = "hidden @[640px]:block";
  const wideOnlyRow = "hidden @[900px]:flex";

  const totalPages = Math.max(1, Math.ceil(sessions.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rangeStart = sessions.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, sessions.length);
  const pageRows = sessions.slice((safePage - 1) * pageSize, safePage * pageSize);

  const pageIds = pageRows.map((r) => r.id);
  const pagePicked = pageIds.filter((id) => selectedSet.has(id)).length;
  const allPagePicked = pageIds.length > 0 && pagePicked === pageIds.length;

  function commitSelection(next: Set<string>) {
    onSelectionChange?.(Array.from(next));
  }

  const toggleRow = useCallback(
    (index: number, id: string, shiftKey: boolean) => {
      const rows = sessions.slice((safePage - 1) * pageSize, safePage * pageSize);
      const next = new Set<string>(selectedIds ?? []);
      const turningOn = !next.has(id);
      if (shiftKey && lastPickedRef.current !== null) {
        const from = Math.min(lastPickedRef.current, index);
        const to = Math.max(lastPickedRef.current, index);
        for (const row of rows.slice(from, to + 1)) {
          if (turningOn) next.add(row.id);
          else next.delete(row.id);
        }
      } else if (turningOn) {
        next.add(id);
      } else {
        next.delete(id);
      }
      lastPickedRef.current = index;
      onSelectionChange?.(Array.from(next));
    },
    [sessions, safePage, pageSize, selectedIds, onSelectionChange],
  );

  function togglePage() {
    const next = new Set<string>(selectedSet);
    for (const id of pageIds) {
      if (allPagePicked) next.delete(id);
      else next.add(id);
    }
    lastPickedRef.current = null;
    commitSelection(next);
  }

  const [cursor, setCursor] = useState<number | null>(null);
  const cursorId = cursor !== null ? pageRows[cursor]?.id ?? null : null;

  useEffect(() => {
    if (selectedSessionId !== null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
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
      const tick = e.key === "x" || e.key === "X";
      if (!down && !up && !tick && e.key !== "Enter" && e.key !== "Escape") return;
      if (pageRows.length === 0) return;

      if (tick) {
        if (selectable && cursor !== null && cursorId) {
          e.preventDefault();
          toggleRow(cursor, cursorId, e.shiftKey);
        }
        return;
      }

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
        if (prev === null) return down ? 0 : pageRows.length - 1;
        const next = down ? prev + 1 : prev - 1;
        return Math.max(0, Math.min(pageRows.length - 1, next));
      });
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    pageRows,
    cursor,
    cursorId,
    onSelectSession,
    selectedSessionId,
    selectable,
    toggleRow,
  ]);

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

  function goToPage(next: number) {
    setPage(next);
    const el = bodyRef.current;
    if (el) {
      el.scrollTo({ top: 0 });
      setBodyScrolled(false);
      requestAnimationFrame(() => {
        if (bodyRef.current) readScrollEdges(bodyRef.current);
      });
    }
  }

  if (variant === "canvas") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative flex min-h-0 flex-col overflow-clip rounded-(--r-surface) bg-(--surface-raised) shadow-(--lift-lg) [.wozku.wozku-light_&]:shadow-none inset-ring-1 inset-ring-(--ink)/[0.08] @container">
            <div
              aria-hidden
              className="h-px w-full shrink-0 [background-image:var(--specular)]"
            />

            <div
              ref={attachBody}
              onScroll={handleBodyScroll}
              className="min-h-0 flex-1 overflow-auto overscroll-contain pb-2"
            >
            <div
              className={cn(
                "sticky top-0 z-10 grid min-w-max border-b bg-(--surface-panel) text-[11px] font-medium text-muted-foreground transition-[border-color,box-shadow] duration-200",
                bodyScrolled
                  ? "border-(--ink)/[0.10] shadow-(--lift-md)"
                  : "border-(--ink)/[0.06]",
              )}
            >
            <div
              style={canvasGrid}
              className={cn(
                "col-start-1 row-start-1 grid items-center gap-3 px-5 py-2.5",
                canvasGridClass,
              )}
            >
              {selectable && (
                <div className="group flex items-center">
                  <SelectBox
                    checked={allPagePicked}
                    indeterminate={pagePicked > 0 && !allPagePicked}
                    label={
                      allPagePicked
                        ? "Clear the selection on this page"
                        : "Select every post on this page"
                    }
                    onToggle={togglePage}
                  />
                </div>
              )}
              <SortableHeader
                label="Name"
                columnKey="name"
                sortKey={sortKey}
                sortReversed={sortReversed}
                onSort={onSort}
                className="min-w-0"
              />
              <span className={cn("min-w-0", midOnly)}>Campaign</span>
              <SortableHeader
                label="Last edited by"
                columnKey="edited"
                sortKey={sortKey}
                sortReversed={sortReversed}
                onSort={onSort}
                className="hidden min-w-0 @[640px]:block"
              />
              <div className="min-w-0" data-tour="repo-status">
                {onCycleStatus ? (
                  <Hint label="Click to filter by status" side="bottom">
                    <button
                      onClick={onCycleStatus}
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
                  </Hint>
                ) : (
                  <span>Status</span>
                )}
              </div>
              {onViewPublic && <span className={wideOnly}>View</span>}
              <span className={wideOnly}>Actions</span>

              {headerColumns.map((col) => (
                <CustomColumnHeader
                  key={col.id}
                  column={col}
                  variant="canvas"
                  className={wideOnlyRow}
                  editing={editingHeaderId === col.id}
                  onStartRename={() => setEditingHeaderId(col.id)}
                  onCommitRename={(name) => onRenameColumn?.(col.id, name)}
                  onStopRename={() => setEditingHeaderId(null)}
                  onDelete={() => requestDeleteColumn(col.id)}
                />
              ))}

            </div>

              {onAddColumn && (
                <div
                  className={cn(
                    "sticky right-0 z-20 col-start-1 row-start-1 items-center justify-self-end bg-gradient-to-l from-(--surface-panel) from-65% to-transparent pl-12 pr-5",
                    "hidden @[900px]:flex",
                  )}
                >
                  {/* On the wrapper: a disabled button has pointer-events:none. */}
                  <Hint
                    label={
                      customColumns.length >= MAX_CUSTOM_COLUMNS
                        ? `${MAX_CUSTOM_COLUMNS} columns is the limit`
                        : "Add column"
                    }
                  >
                    <span className="flex">
                      <button
                        onClick={handleAddColumn}
                        disabled={customColumns.length >= MAX_CUSTOM_COLUMNS}
                        aria-label="Add column"
                        className="flex size-7 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.08] hover:text-foreground active:scale-(--press) disabled:pointer-events-none disabled:opacity-30"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </span>
                  </Hint>
                </div>
              )}
            </div>

            {loading ? (
              <SkeletonRows rows={pageSize > 10 ? 10 : pageSize} />
            ) : sessions.length === 0 ? (
              <EmptyRows emptyState={emptyState} />
            ) : (
              pageRows.map((session, rowIndex) => {
                const isSelected = session.id === selectedSessionId;
                const picked = selectedSet.has(session.id);
                const locked = isSessionLocked(session);

                return (
                  <div
                    key={session.id}
                    data-row-id={session.id}
                    data-tour={rowIndex === 0 ? "repo-row" : undefined}
                    onClick={() => onSelectSession(session.id)}
                    style={{
                      animation: `post-type-in 260ms cubic-bezier(0.2,0,0,1) ${
                        Math.min(rowIndex, 7) * 22
                      }ms backwards`,
                    }}
                    className={cn(
                      "group relative grid min-w-max cursor-pointer border-b border-(--ink)/[0.05] last:border-b-0",
                      "transition-[height,opacity,translate,background-color,box-shadow] duration-220",
                      session.id === leavingId &&
                        "pointer-events-none !h-0 -translate-x-2 overflow-hidden !border-b-0 opacity-0",
                      isSelected
                        ? "z-10 bg-violet-500/[0.09] shadow-(--lift-md) inset-ring-1 inset-ring-violet-400/35"
                        : picked
                          ? "bg-violet-500/[0.05] hover:bg-violet-500/[0.075]"
                          : "hover:bg-(--ink)/[0.035]",
                      !isSelected &&
                        session.id === cursorId &&
                        "bg-(--ink)/[0.05] inset-ring-1 inset-ring-(--ink)/[0.14]",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-y-0 left-0 w-[2px] transition-opacity duration-150",
                        STATUS_TONE[session.status].bar,
                        isSelected ? "opacity-100" : "opacity-70 group-hover:opacity-100",
                      )}
                    />

                    <div
                      style={canvasGrid}
                      className={cn(
                        "col-start-1 row-start-1 grid h-[58px] items-center gap-3 px-5",
                        canvasGridClass,
                      )}
                    >
                    {selectable && (
                      <div
                        className="flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectBox
                          checked={picked}
                          label={picked ? `Deselect ${session.title}` : `Select ${session.title}`}
                          onToggle={(shiftKey) =>
                            toggleRow(rowIndex, session.id, shiftKey)
                          }
                        />
                      </div>
                    )}
                    <div className="min-w-0 pr-4">
                      <div className="flex min-w-0 items-center gap-2">
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
                      </div>
                      {session.tags.length > 0 && (
                        <div className="mt-0.5 flex items-center gap-2 truncate text-[11px] text-muted-foreground/70">
                          <Tag
                            aria-hidden
                            className="size-2.5 shrink-0 text-muted-foreground/45"
                          />
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

                    <div className={cn("min-w-0 text-[12.5px]", midOnly)}>
                      <CampaignNames
                        session={session}
                        campaigns={campaigns}
                        onOpenCampaign={onOpenCampaign}
                      />
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

                    {onViewPublic && (
                      <div className={wideOnly} onClick={(e) => e.stopPropagation()}>
                        {session.sentToCampaignIds.length > 0 ? (
                          <button
                            onClick={() => onViewPublic(session.id)}
                            title="Open this post's public link in a new tab"
                            className="flex h-7 items-center gap-1.5 rounded-(--r-pill) bg-(--ink)/[0.04] px-2.5 text-[11.5px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.08] hover:text-foreground active:scale-(--press)"
                          >
                            <ExternalLink className="size-3" />
                            Open
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </div>
                    )}

                    <div
                      className={wideOnly}
                      data-tour={rowIndex === 0 ? "repo-send" : undefined}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CampaignCell
                        session={session}
                        campaigns={campaigns}
                        onOpenSend={onOpenSend}
                      />
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
                        onCommit={(value) => onSetCellValue?.(session.id, col.id, value)}
                        onStopEdit={() => setEditingCell(null)}
                      />
                    ))}

                    </div>

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "pointer-events-none sticky right-0 z-20 col-start-1 row-start-1 flex h-[58px] items-center gap-0.5 justify-self-end pl-12 pr-5 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100",
                        actionsFade && "bg-gradient-to-l from-(--surface-raised) from-65% to-transparent",
                      )}
                    >
                      {locked && (
                        <Hint label="Live on Wozku and locked from editing. Unlock to edit.">
                          <button
                            onClick={() => setConfirmUnlockId(session.id)}
                            aria-label="Unlock to edit"
                            className="group/lock relative flex size-8 items-center justify-center rounded-(--r-pill) text-muted-foreground/50 transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.08] hover:text-foreground active:scale-(--press)"
                          >
                            <Lock className="size-3.5 transition-[opacity,scale] duration-150 group-hover/lock:scale-90 group-hover/lock:opacity-0" />
                            <LockOpen className="absolute size-3.5 scale-90 opacity-0 transition-[opacity,scale] duration-150 group-hover/lock:scale-100 group-hover/lock:opacity-100" />
                          </button>
                        </Hint>
                      )}
                      {onDuplicateSession && (
                        <Hint label="Duplicate">
                          <button
                            onClick={() => onDuplicateSession(session.id)}
                            aria-label="Duplicate"
                            className="flex size-8 items-center justify-center rounded-(--r-pill) text-muted-foreground/50 transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.08] hover:text-foreground active:scale-(--press)"
                          >
                            <Copy className="size-3.5" />
                          </button>
                        </Hint>
                      )}
                      <Hint label="Delete">
                        <button
                          onClick={() => setConfirmDeleteId(session.id)}
                          aria-label="Delete"
                          className="flex size-8 items-center justify-center rounded-(--r-pill) text-muted-foreground/50 transition-[background-color,color,scale] duration-150 hover:bg-destructive/15 hover:text-destructive active:scale-(--press)"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </Hint>
                    </div>
                  </div>
                );
              })
            )}
            </div>

            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-(--surface-raised) via-(--surface-raised)/70 to-transparent transition-opacity duration-300",
                bodyAtEnd ? "opacity-0" : "opacity-100",
              )}
            />

            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-(--surface-raised) via-(--surface-raised)/70 to-transparent transition-opacity duration-300",
                bodyAtRight ? "opacity-0" : "opacity-100",
              )}
            />
          </div>

        {sessions.length > 0 && (
          <div className="mt-4 flex min-h-9 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <p className="text-[12px] text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground/90">
                {rangeStart}&ndash;{rangeEnd}
              </span>{" "}
              of <span className="tabular-nums">{sessions.length}</span>
            </p>

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
          <span>Post Name</span>
          <span>Campaign</span>
          <span>Last Edited By</span>
          <span>Status</span>
          <span>Actions</span>

          {headerColumns.map((col) => (
            <CustomColumnHeader
              key={col.id}
              column={col}
              variant="classic"
              editing={editingHeaderId === col.id}
              onStartRename={() => setEditingHeaderId(col.id)}
              onCommitRename={(name) => onRenameColumn?.(col.id, name)}
              onStopRename={() => setEditingHeaderId(null)}
              onDelete={() => requestDeleteColumn(col.id)}
            />
          ))}

          <span />

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
                  session.id === leavingId &&
                    "pointer-events-none !h-0 -translate-x-2 overflow-hidden !border-b-0 !py-0 opacity-0",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-0 left-0 w-[2px] transition-opacity duration-150",
                    STATUS_TONE[session.status].bar,
                    isSelected ? "opacity-100" : "opacity-70 group-hover:opacity-100",
                  )}
                />
                <div className="flex min-w-0 items-center gap-2 pr-4">
                  <span data-row-title className="truncate font-medium text-sm">
                    {session.title}
                  </span>
                </div>

                <div className="min-w-0 text-sm">
                  <CampaignNames
                    session={session}
                    campaigns={campaigns}
                    onOpenCampaign={onOpenCampaign}
                  />
                </div>

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
                  <CampaignCell
                    session={session}
                    campaigns={campaigns}
                    onOpenSend={onOpenSend}
                    singleDestination
                  />
                </div>

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
                    onCommit={(value) => onSetCellValue?.(session.id, col.id, value)}
                    onStopEdit={() => setEditingCell(null)}
                  />
                ))}

                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-end gap-1"
                >
                  {locked && (
                    <button
                      onClick={() => setConfirmUnlockId(session.id)}
                      aria-label="Unlock to edit"
                      title="Live on Wozku and locked from editing. Unlock to edit."
                      className="group/lock relative flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                    >
                      <Lock className="size-3.5 transition-[opacity,scale] duration-150 group-hover/lock:scale-90 group-hover/lock:opacity-0 group-focus-visible/lock:scale-90 group-focus-visible/lock:opacity-0" />
                      <LockOpen className="absolute size-3.5 scale-90 opacity-0 transition-[opacity,scale] duration-150 group-hover/lock:scale-100 group-hover/lock:opacity-100 group-focus-visible/lock:scale-100 group-focus-visible/lock:opacity-100" />
                    </button>
                  )}
                  {onDuplicateSession && (
                    <button
                      onClick={() => onDuplicateSession(session.id)}
                      aria-label="Duplicate this post"
                      title="Duplicate content item"
                      className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDeleteId(session.id)}
                    aria-label="Delete this post"
                    title="Delete this post"
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <div />
              </div>
            );
          })
        )}
      </div>

        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-background via-background/70 to-transparent transition-opacity duration-300",
            bodyAtEnd ? "opacity-0" : "opacity-100",
          )}
        />
      </div>

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

function EmptyRows({ emptyState }: { emptyState: EmptyStateSpec }) {
  const Glyph = emptyState.filtered ? SearchX : Inbox;
  const showJourney = emptyState.journey && !emptyState.filtered;

  return (
    <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden duration-300 animate-in fade-in">
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
        <span
          className={cn(
            "text-[12.5px] leading-snug text-muted-foreground text-pretty",
            showJourney ? "max-w-[420px]" : "max-w-[330px]",
          )}
        >
          {emptyState.description}
        </span>

        {showJourney && (
          <div className="mt-4 flex flex-col items-center gap-2 @[560px]:flex-row @[560px]:gap-3">
            {JOURNEY_STEPS.map(({ icon: Icon, label }, i) => (
              <div key={label} className="flex items-center gap-2 @[560px]:gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-(--r-pill) bg-(--ink)/[0.05] text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.09]">
                    <Icon className="size-3.5" />
                  </span>
                  <span className="whitespace-nowrap text-[11.5px] font-medium text-foreground/80">
                    {label}
                  </span>
                </span>
                {i < JOURNEY_STEPS.length - 1 && (
                  <ChevronRight
                    aria-hidden
                    className="size-3.5 shrink-0 rotate-90 text-muted-foreground/40 @[560px]:rotate-0"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {(emptyState.action || emptyState.secondaryAction) && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            {emptyState.action && (
              <button
                onClick={emptyState.action.onClick}
                className={cn(
                  emptyState.filtered
                    ? "flex h-9 items-center gap-1.5 rounded-(--r-pill) bg-(--ink)/[0.04] px-4 text-[13px] font-medium transition-[background-color,box-shadow,scale] duration-150 inset-ring-1 inset-ring-(--ink)/[0.09] hover:bg-(--ink)/[0.08] hover:inset-ring-(--ink)/20 active:scale-(--press)"
                    : PRIMARY_ACTION_MD,
                )}
              >
                {!emptyState.filtered && <Plus className="size-4" />}
                {emptyState.action.label}
              </button>
            )}
            {emptyState.secondaryAction && (
              <button
                onClick={emptyState.secondaryAction.onClick}
                className={SECONDARY_ACTION_MD}
              >
                {emptyState.secondaryAction.label}
              </button>
            )}
          </div>
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
          e.stopPropagation();
          onDone();
        }
      }}
      aria-label={ariaLabel}
      className={cn("w-full outline-none", className)}
    />
  );
}

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
              :
                "text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
          )}
        >
          {value || "Add…"}
        </button>
      )}
    </div>
  );
}

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
