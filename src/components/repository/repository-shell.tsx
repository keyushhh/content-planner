"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SessionsTable } from "@/components/content-planner/sessions-table";
import { ImportFromRepositorySheet } from "./import-from-repository-sheet";
import { InviteModal } from "@/components/content-planner/invite-modal";
import { TagFilterBar } from "@/components/content-planner/tag-filter-bar";
import type { ComposerLayout } from "@/components/content-planner/session-detail-pane";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { currentUser } from "@/lib/mock-data";
import {
  Database,
  Megaphone,
  PlusCircle,
  FolderInput,
  ChevronRight,
  Tag,
  PanelLeftClose,
  PanelLeftOpen,
  UserPlus,
  Plus,
  Search,
  X,
  ArrowUpDown,
  ChevronDown,
  Check,
} from "lucide-react";
import type { Campaign, Session } from "@/lib/types";

interface RepositoryShellProps {
  sessions: Session[];
  campaigns: Campaign[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
  onOpenSend: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onUnlockSession: (id: string) => void;
  onDuplicateSession: (id: string) => void;
  onNewContent: () => void;
  onImportToCampaign: (sessionIds: string[], campaignId: string) => void;
  onCreateCampaign?: (name: string) => string;
  tableStyle: ComposerLayout;
}

type View = "repository" | { campaignId: string };

type SortKey = "edited" | "created" | "name" | "status";

// approved first — most actionable at the top
const STATUS_RANK: Record<Session["status"], number> = { approved: 0, wip: 1, draft: 2 };

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
  status: {
    label: "Status",
    compare: (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
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
  onImportToCampaign,
  onCreateCampaign,
  tableStyle,
}: RepositoryShellProps) {
  const [view, setView] = useState<View>("repository");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("edited");

  const activeCampaign =
    typeof view === "object" ? campaigns.find((c) => c.id === view.campaignId) ?? null : null;

  const scopedSessions =
    view === "repository"
      ? sessions
      : sessions.filter((s) => s.sentToCampaignId === activeCampaign?.id);

  const allTags = Array.from(new Set(sessions.flatMap((s) => s.tags))).sort();

  // Canvas shows only the first few tags inline, so which few matters: rank by
  // how much content carries the tag, and break ties alphabetically so the row
  // does not reshuffle as content is edited.
  const rankedTags = allTags
    .map((name) => ({
      name,
      count: scopedSessions.filter((s) => s.tags.includes(name)).length,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const visibleSessions =
    activeTags.length === 0
      ? scopedSessions
      : scopedSessions.filter((s) => s.tags.some((t) => activeTags.includes(t)));

  const q = search.trim().toLowerCase();
  const searched = q
    ? visibleSessions.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.copy.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)),
      )
    : visibleSessions;

  const sorted = [...searched].sort(SORTS[sort].compare);
  const isFiltered = q.length > 0 || activeTags.length > 0;

  const importCandidates = sessions.filter((s) => s.sentToCampaignId === null);
  const isCanvas = tableStyle === "canvas";

  const title = view === "repository" ? "Repository" : activeCampaign?.name ?? "";
  const subtitle =
    view === "repository"
      ? "Every piece of content, across every campaign."
      : "Only content sent to this campaign shows here.";

  const modals = (
    <>
      {activeCampaign && (
        <ImportFromRepositorySheet
          open={showImport}
          onOpenChange={setShowImport}
          campaignName={activeCampaign.name}
          availableSessions={importCandidates}
          onImport={(sessionIds) => onImportToCampaign(sessionIds, activeCampaign.id)}
        />
      )}
      <InviteModal
        open={showInvite}
        onOpenChange={setShowInvite}
        contextName={activeCampaign ? activeCampaign.name : "Repository"}
      />
    </>
  );

  // ---- Canvas layout -------------------------------------------------------
  // One quiet toolbar; the large title, filters and table all share the content
  // column's left edge. The PAGE does not scroll — the title and filters are
  // fixed furniture and the table scrolls inside its own sheet, so the column
  // headers and the pager are always on screen.
  if (isCanvas) {
    return (
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col">
          <div className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col px-6 pb-6">
            <div className="shrink-0 pb-6 pt-6">
              <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em]">
                {title}
              </h1>
              {/* The sync signal used to sit under the table, where the pager now
                  reports the counts. It belongs with the title: it describes the
                  whole repository, not the page you happen to be looking at. */}
              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                {subtitle}
                <span className="text-muted-foreground/30">&middot;</span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Synced to Wozku
                </span>
              </p>
            </div>

            {/* Actions sit with the filters, directly above the table they act on */}
            <div className="mb-4 flex shrink-0 flex-wrap items-center gap-x-2 gap-y-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search content…"
                  aria-label="Search content"
                  className="h-8 w-[220px] rounded-full bg-white/[0.035] pl-8 pr-8 text-[13px] caret-violet-400 inset-ring-1 inset-ring-white/[0.08] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted-foreground/75 focus:bg-white/[0.06] focus:inset-ring-violet-400/50"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              <TagFilterBar
                tags={rankedTags}
                active={activeTags}
                visibleCount={3}
                onToggle={(tag) =>
                  setActiveTags((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                  )
                }
                onClear={() => setActiveTags([])}
              />

              <div className="ml-auto flex items-center gap-1.5">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        title="Sort content"
                        className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.035] px-3 text-[13px] font-medium text-muted-foreground inset-ring-1 inset-ring-white/[0.08] transition-[background-color,box-shadow,color,scale] duration-150 hover:text-foreground active:scale-[0.97]"
                      />
                    }
                  >
                    <ArrowUpDown className="size-3.5" />
                    {SORTS[sort].label}
                    <ChevronDown className="size-3.5 opacity-60" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(Object.keys(SORTS) as SortKey[]).map((key) => (
                      <DropdownMenuItem key={key} onClick={() => setSort(key)}>
                        <span className="flex-1">{SORTS[key].label}</span>
                        {sort === key && <Check className="size-3.5 text-violet-300" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {view !== "repository" && (
                  <button
                    title="Bring content that already exists in the Repository into this campaign"
                    onClick={() => setShowImport(true)}
                    className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-white/[0.06] hover:text-foreground active:scale-[0.97]"
                  >
                    <FolderInput className="size-4" />
                    Import
                  </button>
                )}
                <button
                  onClick={() => setShowInvite(true)}
                  className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-white/[0.06] hover:text-foreground active:scale-[0.97]"
                >
                  <UserPlus className="size-4" />
                  Invite
                </button>
                {view === "repository" && (
                  <button
                    onClick={onNewContent}
                    className="flex h-8 items-center gap-1.5 rounded-full bg-violet-600 px-3.5 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_16px_-8px_rgba(139,92,246,0.7)] inset-ring-1 inset-ring-white/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-[0.97]"
                  >
                    <PlusCircle className="size-4" />
                    New content
                  </button>
                )}
              </div>
            </div>

            <SessionsTable
              // remount on filter change so the row window restarts at page 1
              key={`${q}|${activeTags.join(",")}|${sort}`}
              variant="canvas"
              pageSize={15}
              sessions={sorted}
              selectedSessionId={selectedSessionId}
              onSelectSession={onSelectSession}
              onOpenSend={onOpenSend}
              onDeleteSession={onDeleteSession}
              onUnlockSession={onUnlockSession}
              onDuplicateSession={onDuplicateSession}
              emptyState={
                isFiltered
                  ? {
                      title: "No matches",
                      description: q
                        ? `Nothing matches “${search.trim()}”. Try a different term or clear the filters.`
                        : "No content carries these tags. Try clearing the filters.",
                    }
                  : view === "repository"
                  ? {
                      title: "Repository is empty",
                      description: 'Click "New content" to create your first piece of content.',
                    }
                  : {
                      title: "Nothing sent to this campaign yet",
                      description:
                        "Import something that already exists, or send it here from the Repository.",
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
              {view === "repository" ? (
                <>
                  <Database className="size-4 text-violet-400" />
                  Repository
                </>
              ) : (
                <>
                  <Megaphone className="size-4 text-violet-400" />
                  {activeCampaign?.name}
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Sent content</span>
                </>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {view === "repository"
                ? "Every piece of content, across every campaign."
                : "Only content sent to this campaign shows here."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {view !== "repository" && (
              <Button
                variant="outline"
                size="sm"
                title="Bring content that already exists in the Repository into this campaign"
                className="gap-1.5 border-violet-500/50 text-sm text-violet-400 hover:bg-violet-500/10"
                onClick={() => setShowImport(true)}
              >
                <FolderInput className="size-4" />
                Import Content from Repository
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-sm text-foreground hover:bg-accent"
              onClick={() => setShowInvite(true)}
            >
              <UserPlus className="size-4" />
              Invite
            </Button>
            {view === "repository" && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-sm"
                onClick={onNewContent}
              >
                <PlusCircle className="size-4" />
                New Content
              </Button>
            )}
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
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
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
            key={`${q}|${activeTags.join(",")}`}
            sessions={sorted}
            selectedSessionId={selectedSessionId}
            onSelectSession={onSelectSession}
            onOpenSend={onOpenSend}
            onDeleteSession={onDeleteSession}
            onUnlockSession={onUnlockSession}
            onDuplicateSession={onDuplicateSession}
            emptyState={
              view === "repository"
                ? {
                    title: "Repository is empty",
                    description: 'Click "New Content" to create your first piece of content.',
                  }
                : {
                    title: "Nothing sent to this campaign yet",
                    description:
                      'Use "Import Content from Repository" to bring in something that already exists, or send it here from the Repository.',
                  }
            }
          />
        </div>

        <footer className="flex h-8 shrink-0 items-center justify-between border-t border-border px-4 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {sorted.length} {view === "repository" ? "items in repository" : "sent to this campaign"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Synced to Wozku
          </span>
        </footer>

      {modals}
    </div>
  );
}
