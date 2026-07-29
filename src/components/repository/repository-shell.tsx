"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SessionsTable } from "@/components/content-planner/sessions-table";
import { InviteModal } from "@/components/content-planner/invite-modal";
import { TagFilterBar } from "@/components/content-planner/tag-filter-bar";
import type { ComposerLayout } from "@/components/content-planner/session-detail-pane";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, isSessionLocked } from "@/lib/utils";
import { SECONDARY_ACTION } from "@/lib/button-styles";
import {
  Database,
  PlusCircle,
  Tag,
  UserPlus,
  Search,
  X,
  ArrowUpDown,
  CircleDot,
  ChevronDown,
  Check,
  Send,
} from "lucide-react";
import type { Campaign, CustomCellValues, CustomColumn, Session } from "@/lib/types";

/** Custom-column state is owned by the page, so it travels as one bundle. */
export interface CustomColumnProps {
  customColumns: CustomColumn[];
  customCellValues: CustomCellValues;
  onAddColumn: () => string;
  onRenameColumn: (colId: string, name: string) => void;
  onDeleteColumn: (colId: string) => void;
  onSetCellValue: (sessionId: string, colId: string, value: string) => void;
}

interface RepositoryShellProps extends CustomColumnProps {
  sessions: Session[];
  /** So the table can name the campaigns a post has been sent to. */
  campaigns?: Campaign[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
  onOpenSend: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onUnlockSession: (id: string) => void;
  onDuplicateSession: (id: string) => void;
  onNewContent: () => void;
  /** Repository only: multi-select in the table, and what to do with a batch. */
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Called with the posts in the batch that are actually sendable. */
  onBulkSend?: (ids: string[]) => void;
  /** Dev-controls override: show the table's skeleton instead of its rows. */
  tableLoading?: boolean;
  tableStyle: ComposerLayout;
}

type SortKey = "edited" | "created" | "name";

const SORT_MENU: SortKey[] = ["edited", "created", "name"];

/**
 * Cycle order for clicking the Status column header: off, then each status in
 * workflow order.
 */
const STATUS_CYCLE: (Session["status"] | null)[] = [null, "approved", "wip", "draft"];

/** Filterable statuses, in workflow order. */
const STATUSES: { id: Session["status"]; label: string }[] = [
  { id: "approved", label: "Approved" },
  { id: "wip", label: "WIP" },
  { id: "draft", label: "Draft" },
];

/**
 * Status is a filter, not a sort. "Sort by status" only answers which bucket
 * is on top, where what people want is the approved ones and nothing else.
 */
const SORTS: Record<SortKey, { label: string; compare: (a: Session, b: Session) => number }> = {
  edited: {
    label: "Recently edited",
    compare: (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  },
  created: {
    label: "Recently created",
    compare: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  },
  name: {
    label: "Name A\u2013Z",
    compare: (a, b) => a.title.localeCompare(b.title),
  },
};

export function RepositoryShell({
  sessions,
  campaigns,
  selectedSessionId,
  onSelectSession,
  onOpenSend,
  onDeleteSession,
  onUnlockSession,
  onDuplicateSession,
  onNewContent,
  selectedIds,
  onSelectionChange,
  onBulkSend,
  tableLoading = false,
  tableStyle,
  ...columnProps
}: RepositoryShellProps) {
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("edited");
  // Each SORTS compare defines its own natural order; `reversed` flips it, which
  // is what a second click on an already-active column header means.
  const [reversed, setReversed] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Session["status"][]>([]);

  /** What the Status control currently reads as. */
  const statusLabel =
    statusFilter.length === 0
      ? "Status"
      : statusFilter.length === 1
      ? STATUSES.find((s) => s.id === statusFilter[0])!.label
      : `${statusFilter.length} statuses`;

  /** Clicking the Status column header steps through the cycle above. */
  function cycleStatus() {
    const current = statusFilter.length === 1 ? statusFilter[0] : null;
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
    setStatusFilter(next ? [next] : []);
  }

  function toggleStatus(status: Session["status"]) {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  }

  function requestSort(key: SortKey) {
    if (key === sort) setReversed((r) => !r);
    else {
      setSort(key);
      setReversed(false);
    }
  }

  const allTags = Array.from(new Set(sessions.flatMap((s) => s.tags))).sort();

  // Canvas shows only the first few tags inline, so which few matters: rank by
  // how much content carries the tag, and break ties alphabetically so the row
  // does not reshuffle as content is edited.
  const rankedTags = allTags
    .map((name) => ({
      name,
      count: sessions.filter((s) => s.tags.includes(name)).length,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const taggedSessions =
    activeTags.length === 0
      ? sessions
      : sessions.filter((s) => s.tags.some((t) => activeTags.includes(t)));

  const visibleSessions =
    statusFilter.length === 0
      ? taggedSessions
      : taggedSessions.filter((s) => statusFilter.includes(s.status));

  const q = search.trim().toLowerCase();
  const searched = q
    ? visibleSessions.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.copy.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)),
      )
    : visibleSessions;

  const sorted = [...searched].sort(
    reversed ? (a, b) => SORTS[sort].compare(b, a) : SORTS[sort].compare,
  );
  /**
   * A batch is only as sendable as its members: approved, and not already sent
   * and untouched since.
   */
  const picked = (selectedIds ?? []).length;
  const sendable = useMemo(
    () =>
      sessions.filter(
        (s) =>
          (selectedIds ?? []).includes(s.id) &&
          s.status === "approved" &&
          !isSessionLocked(s),
      ),
    [sessions, selectedIds],
  );

  const isFiltered = q.length > 0 || activeTags.length > 0 || statusFilter.length > 0;

  /** One way out of every filter at once, from the line that reports them. */
  function clearFilters() {
    setSearch("");
    setActiveTags([]);
    setStatusFilter([]);
  }

  const isCanvas = tableStyle === "canvas";

  const title = "Repository";
  const subtitle = "Every piece of content, across every campaign.";

  const modals = (
    <InviteModal
      open={showInvite}
      onOpenChange={setShowInvite}
      contextName="Repository"
    />
  );

  // ---- Canvas layout ----
  // One quiet toolbar; the large title, filters and table all share the
  // content column's left edge.
  if (isCanvas) {
    return (
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col">
          <div className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col px-6 pb-6">
            <div className="shrink-0 pb-6 pt-6">
              <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em]">
                {title}
              </h1>
              {/* The sync signal used to sit under the table, where the pager
                  now reports the counts. */}
              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                {subtitle}
                <span className="text-muted-foreground/30">&middot;</span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-(--r-round) bg-emerald-500" />
                  Synced to Wozku
                </span>
              </p>
            </div>

            {/* Two halves, not one run: everything that NARROWS the table on
                the left, everything that ACTS on the right. */}
            <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2.5">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-2.5">
                {/* Grows into whatever the filters leave, between a floor
                    that still fits a phrase and a ceiling past which a search
                    field stops looking like one. */}
                <div className="relative min-w-[240px] max-w-[260px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search content…"
                    aria-label="Search content"
                    // A shade lighter at rest than the control pills beside it.
                    // It is the one thing in this row you type into, and a field
                    // should look like a recess you can put something in rather
                    // than another button.
                    className="h-8 w-full rounded-(--r-pill) bg-(--ink)/[0.06] pl-8 pr-8 text-[13px] caret-violet-400 inset-ring-1 inset-ring-(--ink)/[0.10] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted-foreground/75 focus:bg-(--ink)/[0.085] focus:inset-ring-violet-400/50"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-colors hover:bg-(--ink)/[0.08] hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                {/* Status filter: multi-select, so "Approved + WIP" is one
                    step. */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        title="Filter by status"
                        // Fixed width, sized to "2 statuses": the trigger must not
                        // resize as you pick, and the menu is anchored to its width,
                        // so a narrow trigger and a wider menu are one bug seen from
                        // two ends.
                        className={cn(
                          "flex h-8 w-[148px] items-center gap-1.5 rounded-(--r-pill) px-3 text-[13px] font-medium inset-ring-1 transition-[background-color,box-shadow,color,scale] duration-150 active:scale-(--press)",
                          statusFilter.length > 0
                            ? "bg-violet-500/[0.16] text-violet-100 inset-ring-violet-400/45"
                            : "bg-(--ink)/[0.035] text-muted-foreground inset-ring-(--ink)/[0.08] hover:text-foreground",
                        )}
                      />
                    }
                  >
                    <CircleDot className="size-3.5 shrink-0" />
                    <span className="flex-1 truncate text-left">{statusLabel}</span>
                    <ChevronDown className="size-3.5 shrink-0 opacity-60" />
                  </DropdownMenuTrigger>
                  {/* These triggers now sit at the left of the row, so the
                      menu drops from their left edge rather than reaching
                      back. */}
                  <DropdownMenuContent align="start" className="min-w-[148px]">
                    {/* "All" is the no-filter state stated out loud. Without
                        it the only way back was unticking whatever you had
                        ticked, which is not something you should have to
                        reason about. */}
                    <DropdownMenuItem onClick={() => setStatusFilter([])}>
                      <span className="flex-1 whitespace-nowrap">All</span>
                      {statusFilter.length === 0 && (
                        <Check className="size-3.5 text-violet-300" />
                      )}
                    </DropdownMenuItem>
                    {STATUSES.map(({ id, label }) => (
                      <DropdownMenuItem
                        key={id}
                        // keep the menu open: picking statuses is usually plural
                        closeOnClick={false}
                        onClick={() => toggleStatus(id)}
                      >
                        <span className="flex-1 whitespace-nowrap">{label}</span>
                        {statusFilter.includes(id) && (
                          <Check className="size-3.5 text-violet-300" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        title="Sort content"
                        // Fixed width, sized to the longest option. The control must
                        // not resize as you pick, since it would shove the tag filter
                        // sideways, and the menu inherits the trigger's width, so a
                        // shrunken trigger wraps its own options.
                        className="flex h-8 w-[184px] items-center gap-1.5 rounded-(--r-pill) bg-(--ink)/[0.035] px-3 text-[13px] font-medium text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.08] transition-[background-color,box-shadow,color,scale] duration-150 hover:text-foreground active:scale-(--press)"
                      />
                    }
                  >
                    <ArrowUpDown className="size-3.5 shrink-0" />
                    <span className="flex-1 truncate text-left">{SORTS[sort].label}</span>
                    <ChevronDown className="size-3.5 shrink-0 opacity-60" />
                  </DropdownMenuTrigger>
                  {/* These triggers now sit at the left of the row, so the
                      menu drops from their left edge rather than reaching
                      back. */}
                  {/* Belt and braces: the trigger is already wide enough, but
                      a sort option is a fixed phrase and must never wrap. */}
                  <DropdownMenuContent align="start" className="min-w-[184px]">
                    {SORT_MENU.map((key) => (
                      <DropdownMenuItem key={key} onClick={() => requestSort(key)}>
                        <span className="flex-1 whitespace-nowrap">{SORTS[key].label}</span>
                        {sort === key && <Check className="size-3.5 text-violet-300" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Tags last, so the three controls read left to right in the
                    order you reach for them: what state, what order, what
                    topic. */}
                <TagFilterBar
                  tags={rankedTags}
                  active={activeTags}
                  onToggle={(tag) =>
                    setActiveTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                    )
                  }
                  onClear={() => setActiveTags([])}
                />
              </div>

              {/* Actions: outlined rather than filled. A white fill here
                  would carry more luminance weight than the violet primary
                  and the row would have two CTAs fighting. */}
              <div className="flex shrink-0 items-center gap-1.5">
                <button onClick={() => setShowInvite(true)} className={SECONDARY_ACTION}>
                  <UserPlus className="size-4" />
                  Invite
                </button>
                <button
                  onClick={onNewContent}
                  className="ml-0.5 flex h-8 items-center gap-1.5 rounded-(--r-pill) bg-violet-600 px-3.5 text-[13px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-(--press)"
                >
                  <PlusCircle className="size-4" />
                  New content
                </button>
              </div>
            </div>

            {/* Says out loud that you are looking at a subset. The controls
                each know their own state, but nothing told you the TABLE was
                short because of them, which is the moment people start
                doubting the data rather than checking the filters. */}
            {/* One strip, two jobs, never both at once: while rows are ticked
                it reports the batch, because "3 of 450 items, filtered" is
                not what you are thinking about with three rows ticked. */}
            {picked > 0 ? (
              <div className="mb-2.5 flex min-h-8 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 pl-0.5">
                <span className="text-[12px] text-foreground/85">
                  <span className="font-medium tabular-nums">{picked}</span> selected
                  {sendable.length !== picked && (
                    <span className="text-muted-foreground">
                      {" · "}
                      <span className="tabular-nums">{sendable.length}</span> ready to
                      send
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onBulkSend?.(sendable.map((s) => s.id))}
                    disabled={sendable.length === 0}
                    title={
                      sendable.length === 0
                        ? "Approve these posts to send them"
                        : "Send the ready posts to campaigns"
                    }
                    className="flex h-7 items-center gap-1.5 rounded-(--r-pill) bg-violet-600 px-3 text-[12px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,box-shadow,scale] duration-150 hover:bg-violet-500 active:scale-(--press) disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
                  >
                    <Send className="size-3" />
                    Send to campaigns
                  </button>
                  <button
                    onClick={() => onSelectionChange?.([])}
                    className="h-7 rounded-(--r-pill) px-2 text-[12px] text-muted-foreground transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : isFiltered ? (
              <div className="mb-2.5 flex shrink-0 items-center gap-2 pl-0.5 text-[12px] text-muted-foreground">
                <span className="flex size-1.5 shrink-0 rounded-(--r-round) bg-violet-400" />
                <span>
                  <span className="tabular-nums text-foreground/85">{sorted.length}</span>{" "}
                  of{" "}
                  <span className="tabular-nums">{visibleSessions.length}</span>{" "}
                  {visibleSessions.length === 1 ? "item" : "items"}, filtered
                </span>
                <button
                  onClick={clearFilters}
                  className="h-6 rounded-(--r-pill) px-2 text-[12px] text-muted-foreground transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground"
                >
                  Clear all
                </button>
              </div>
            ) : null}

            <SessionsTable
              // remount on filter change so the row window restarts at page 1
              key={`${q}|${activeTags.join(",")}|${statusFilter.join(",")}|${sort}|${reversed}`}
              variant="canvas"
              pageSize={15}
              sortKey={sort}
              sortReversed={reversed}
              onSort={(key) => requestSort(key as SortKey)}
              statusLabel={statusLabel}
              statusFiltered={statusFilter.length > 0}
              onCycleStatus={cycleStatus}
              sessions={sorted}
              campaigns={campaigns}
              loading={tableLoading}
              selectedSessionId={selectedSessionId}
              onSelectSession={onSelectSession}
              onOpenSend={onOpenSend}
              onDeleteSession={onDeleteSession}
              onUnlockSession={onUnlockSession}
              onDuplicateSession={onDuplicateSession}
              selectedIds={selectedIds}
              onSelectionChange={onSelectionChange}
              {...columnProps}
              emptyState={
                isFiltered
                  ? {
                      title: "No matches",
                      description: q
                        ? `Nothing matches “${search.trim()}”. Try a different term or clear the filters.`
                        : "No content carries these tags. Try clearing the filters.",
                      filtered: true,
                      action: { label: "Clear all filters", onClick: clearFilters },
                    }
                  : {
                      title: "Repository is empty",
                      description:
                        "Every piece of content you make lands here. Create the first one to get started.",
                      action: onNewContent
                        ? { label: "New content", onClick: onNewContent }
                        : undefined,
                    }
              }
            />

          </div>
        </div>

        {modals}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Database className="size-4 text-violet-400" />
              {title}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-sm text-foreground hover:bg-accent"
              onClick={() => setShowInvite(true)}
            >
              <UserPlus className="size-4" />
              Invite
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-sm"
              onClick={onNewContent}
            >
              <PlusCircle className="size-4" />
              New Content
            </Button>
          </div>
        </header>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 px-4 py-2.5">
            <Tag className="size-3.5 text-muted-foreground/60" />
            {allTags.map((tag) => {
              const active = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() =>
                    setActiveTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                    )
                  }
                  aria-pressed={active}
                  className={cn(
                    "rounded-(--r-pill) px-2.5 py-1 text-xs font-medium transition-colors",
                    active
                      ? "bg-violet-600 text-white"
                      : "bg-accent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tag}
                </button>
              );
            })}
            {activeTags.length > 0 && (
              <button
                onClick={() => setActiveTags([])}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1">
          <SessionsTable
            // remount on filter change so the row window restarts at page 1
            key={`${q}|${activeTags.join(",")}|${statusFilter.join(",")}`}
            sessions={sorted}
            campaigns={campaigns}
            loading={tableLoading}
            selectedSessionId={selectedSessionId}
            onSelectSession={onSelectSession}
            onOpenSend={onOpenSend}
            onDeleteSession={onDeleteSession}
            onUnlockSession={onUnlockSession}
            onDuplicateSession={onDuplicateSession}
            {...columnProps}
            emptyState={
              isFiltered
                ? {
                    title: "No matches",
                    description: q
                      ? `Nothing matches “${search.trim()}”. Try a different term or clear the filters.`
                      : "No content carries these tags. Try clearing the filters.",
                    filtered: true,
                    action: { label: "Clear all filters", onClick: clearFilters },
                  }
                : {
                    title: "Repository is empty",
                    description:
                      "Every piece of content you make lands here. Create the first one to get started.",
                    action: onNewContent
                      ? { label: "New content", onClick: onNewContent }
                      : undefined,
                  }
            }
          />
        </div>

        <footer className="flex h-8 shrink-0 items-center justify-between border-t border-border px-4 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {sorted.length} items in repository
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-(--r-round) bg-emerald-500" />
            Synced to Wozku
          </span>
        </footer>

      {modals}
    </div>
  );
}
