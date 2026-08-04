"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SessionsTable } from "@/components/content-planner/sessions-table";
import { InviteModal } from "@/components/content-planner/invite-modal";
import { TagFilterBar } from "@/components/content-planner/tag-filter-bar";
import { Stagger } from "@/components/content-planner/session-composer";
import { Hint } from "@/components/ui/tooltip";
import type { ComposerLayout } from "@/components/content-planner/session-detail-pane";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, isSessionLocked } from "@/lib/utils";
import {
  PRIMARY_ACTION,
  PRIMARY_ACTION_SM,
  SECONDARY_ACTION,
} from "@/lib/button-styles";
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
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/content-planner/confirm-dialog";
import type { Campaign, CustomCellValues, CustomColumn, Session } from "@/lib/types";

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
  campaigns?: Campaign[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
  onOpenSend: (id: string) => void;
  onOpenCampaign?: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onUnlockSession: (id: string) => void;
  onDuplicateSession: (id: string) => void;
  onNewContent: () => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onBulkSend?: (ids: string[]) => void;
  tableLoading?: boolean;
  tableStyle: ComposerLayout;
  onStartTour?: () => void;
}

type SortKey = "edited" | "created" | "name";

const SORT_MENU: SortKey[] = ["edited", "created", "name"];

const STATUS_CYCLE: (Session["status"] | null)[] = [null, "approved", "wip", "draft"];

const STATUSES: { id: Session["status"]; label: string }[] = [
  { id: "approved", label: "Approved" },
  { id: "wip", label: "WIP" },
  { id: "draft", label: "Draft" },
];

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
  onOpenCampaign,
  onDeleteSession,
  onUnlockSession,
  onDuplicateSession,
  onNewContent,
  selectedIds,
  onSelectionChange,
  onBulkSend,
  tableLoading = false,
  tableStyle,
  onStartTour,
  ...columnProps
}: RepositoryShellProps) {
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("edited");
  const [reversed, setReversed] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Session["status"][]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const statusLabel =
    statusFilter.length === 0
      ? "Status"
      : statusFilter.length === 1
      ? STATUSES.find((s) => s.id === statusFilter[0])!.label
      : `${statusFilter.length} statuses`;

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

  /* The app knows exactly why each selected row is out; say so. */
  const excluded = useMemo(() => {
    const chosen = sessions.filter((s) => (selectedIds ?? []).includes(s.id));
    return {
      needApproval: chosen.filter((s) => s.status !== "approved").length,
      locked: chosen.filter((s) => s.status === "approved" && isSessionLocked(s)).length,
    };
  }, [sessions, selectedIds]);

  const blockedNote = [
    excluded.needApproval > 0 ? `${excluded.needApproval} need approval` : "",
    excluded.locked > 0 ? `${excluded.locked} already up to date` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const isFiltered = q.length > 0 || activeTags.length > 0 || statusFilter.length > 0;

  function clearFilters() {
    setSearch("");
    setActiveTags([]);
    setStatusFilter([]);
  }

  const isCanvas = tableStyle === "canvas";

  const title = "Repository";
  const subtitle = "Manage, refine, and organize content for your campaigns.";

  const modals = (
    <>
      <InviteModal
        open={showInvite}
        onOpenChange={setShowInvite}
        contextName="Repository"
      />
      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        tone="destructive"
        title={`Delete ${picked} ${picked === 1 ? "item" : "items"}?`}
        description="Their copy, assets, and comments will go with them. They will be deleted permanently. This action cannot be undone."
        actions={[
          {
            label: "Cancel",
            tone: "outline",
            onClick: () => setConfirmBulkDelete(false),
          },
          {
            label: `Delete ${picked} ${picked === 1 ? "item" : "items"}`,
            tone: "destructive",
            icon: Trash2,
            onClick: () => {
              (selectedIds ?? []).forEach((id) => onDeleteSession(id));
              onSelectionChange?.([]);
              setConfirmBulkDelete(false);
            },
          },
        ]}
      />
    </>
  );

  if (isCanvas) {
    return (
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col">
          <div className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col px-6 pb-6">
            <Stagger index={0} className="shrink-0">
              <div className="pb-6 pt-6">
                {/* Text only, not the pb-6 — else the tour cut-out clips the toolbar. */}
                <div data-tour="repo-header">
                  <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em] text-balance">
                    {title}
                  </h1>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">
                    {subtitle}
                  </p>
                </div>
              </div>
            </Stagger>

            <Stagger
              index={1}
              className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-x-10 gap-y-2.5"
            >
              <div
                data-tour="repo-filters"
                className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-2.5"
              >
                <div className="relative min-w-[240px] max-w-[260px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search content…"
                    aria-label="Search content"
                    className="h-8 w-full rounded-(--r-pill) bg-(--ink)/[0.035] pl-8 pr-8 text-[13px] caret-violet-400 inset-ring-1 inset-ring-(--ink)/[0.08] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted-foreground/75 hover:bg-(--ink)/[0.06] focus:bg-(--ink)/[0.085] focus:inset-ring-violet-400/50"
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

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        title="Filter by status"
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
                  <DropdownMenuContent align="start" className="min-w-[148px]">
                    <DropdownMenuItem onClick={() => setStatusFilter([])}>
                      <span className="flex-1 whitespace-nowrap">All</span>
                      {statusFilter.length === 0 && (
                        <Check className="size-3.5 text-violet-300" />
                      )}
                    </DropdownMenuItem>
                    {STATUSES.map(({ id, label }) => (
                      <DropdownMenuItem
                        key={id}
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
                        className="flex h-8 w-[168px] items-center gap-1.5 rounded-(--r-pill) bg-(--ink)/[0.035] px-3 text-[13px] font-medium text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.08] transition-[background-color,box-shadow,color,scale] duration-150 hover:text-foreground active:scale-(--press)"
                      />
                    }
                  >
                    <ArrowUpDown className="size-3.5 shrink-0" />
                    <span className="flex-1 truncate text-left">{SORTS[sort].label}</span>
                    <ChevronDown className="size-3.5 shrink-0 opacity-60" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[184px]">
                    {SORT_MENU.map((key) => (
                      <DropdownMenuItem key={key} onClick={() => requestSort(key)}>
                        <span className="flex-1 whitespace-nowrap">{SORTS[key].label}</span>
                        {sort === key && <Check className="size-3.5 text-violet-300" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

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

              <div className="flex shrink-0 items-center gap-1.5">
                <button onClick={() => setShowInvite(true)} className={SECONDARY_ACTION}>
                  <UserPlus className="size-4" />
                  Invite
                </button>
                <button
                  onClick={onNewContent}
                  data-tour="repo-new-post"
                  className={cn(PRIMARY_ACTION, "ml-0.5")}
                >
                  <PlusCircle className="size-4" />
                  New post
                </button>
              </div>
            </Stagger>

            {picked > 0 ? (
              <div className="mb-2.5 flex min-h-8 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 pl-0.5">
                <span className="text-[12px] text-foreground/85">
                  <span className="font-medium tabular-nums">{picked}</span> selected
                  <span className="text-muted-foreground">
                    {" · "}
                    <span className="tabular-nums">{sendable.length}</span> ready to send
                    {blockedNote && ` · ${blockedNote}`}
                  </span>
                </span>

                <div className="flex items-center gap-1.5">
                  {/* On the wrapper: the button is disabled when it matters. */}
                  <Hint
                    label={
                      sendable.length === 0
                        ? excluded.locked === picked
                          ? "These are already live and unchanged. Edit one to send an update."
                          : "Only approved posts can go to a campaign. Approve these to send them."
                        : `Send the ${sendable.length} ready ${
                            sendable.length === 1 ? "post" : "posts"
                          } to campaigns`
                    }
                  >
                    <span className="flex">
                      <button
                        onClick={() => onBulkSend?.(sendable.map((s) => s.id))}
                        disabled={sendable.length === 0}
                        className={PRIMARY_ACTION_SM}
                      >
                        <Send className="size-3" />
                        Send to campaigns
                      </button>
                    </span>
                  </Hint>
                  {/* Bulk Delete option */}
                  <button
                    onClick={() => setConfirmBulkDelete(true)}
                    className="flex h-7 items-center gap-1.5 rounded-(--r-pill) bg-red-500/10 px-2.5 text-[12px] font-medium text-red-400 inset-ring-1 inset-ring-red-500/20 transition-all duration-150 hover:bg-red-500/20 hover:text-red-300 active:scale-95"
                  >
                    <Trash2 className="size-3.5" />
                    Delete {picked} {picked === 1 ? "item" : "items"}
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

            <Stagger index={2} className="flex min-h-0 flex-1 flex-col">
            <SessionsTable
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
              onOpenCampaign={onOpenCampaign}
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
                        : activeTags.length > 0 && statusFilter.length > 0
                          ? "No post carries these tags at this status. Try clearing the filters."
                          : statusFilter.length === 1
                            ? `No post is ${statusLabel} right now. Try clearing the filters.`
                            : statusFilter.length > 0
                              ? "No post is at any of these statuses. Try clearing the filters."
                              : "No content carries these tags. Try clearing the filters.",
                      filtered: true,
                      action: { label: "Clear all filters", onClick: clearFilters },
                    }
                  : {
                      title: "No posts yet",
                      description:
                        "Posts are the building blocks of your campaigns. Create one, write your copy, add visuals, and send it to a campaign when it's ready.",
                      journey: true,
                      action: onNewContent
                        ? { label: "Create your first post", onClick: onNewContent }
                        : undefined,
                      secondaryAction: onStartTour
                        ? { label: "Show me around", onClick: onStartTour }
                        : undefined,
                    }
              }
            />
            </Stagger>

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
            key={`${q}|${activeTags.join(",")}|${statusFilter.join(",")}`}
            sessions={sorted}
            campaigns={campaigns}
            loading={tableLoading}
            selectedSessionId={selectedSessionId}
            onSelectSession={onSelectSession}
            onOpenSend={onOpenSend}
            onOpenCampaign={onOpenCampaign}
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
                      ? { label: "New post", onClick: onNewContent }
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
            <span className="size-1.5 rounded-(--r-round) bg-live-400" />
            Synced to Wozku
          </span>
        </footer>

      {modals}
    </div>
  );
}
