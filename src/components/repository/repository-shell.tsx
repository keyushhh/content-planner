"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SessionsTable } from "@/components/content-planner/sessions-table";
import { ImportFromRepositorySheet } from "./import-from-repository-sheet";
import { cn } from "@/lib/utils";
import {
  Database,
  Megaphone,
  PlusCircle,
  FolderInput,
  ChevronRight,
  Tag,
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
  onNewContent: () => void;
  onImportToCampaign: (sessionIds: string[], campaignId: string) => void;
}

type View = "repository" | { campaignId: string };

export function RepositoryShell({
  sessions,
  campaigns,
  selectedSessionId,
  onSelectSession,
  onOpenSend,
  onDeleteSession,
  onUnlockSession,
  onNewContent,
  onImportToCampaign,
}: RepositoryShellProps) {
  const [view, setView] = useState<View>("repository");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);

  const activeCampaign =
    typeof view === "object" ? campaigns.find((c) => c.id === view.campaignId) ?? null : null;

  const scopedSessions =
    view === "repository"
      ? sessions
      : sessions.filter((s) => s.sentToCampaignId === activeCampaign?.id);

  const allTags = Array.from(new Set(sessions.flatMap((s) => s.tags))).sort();

  const visibleSessions =
    activeTags.length === 0
      ? scopedSessions
      : scopedSessions.filter((s) => s.tags.some((t) => activeTags.includes(t)));

  const sorted = [...visibleSessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const importCandidates = sessions.filter((s) => s.sentToCampaignId === null);

  return (
    <div className="flex min-h-0 flex-1">
      <nav className="flex w-56 shrink-0 flex-col border-r border-border px-3 py-4">
        <button
          onClick={() => setView("repository")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors",
            view === "repository"
              ? "bg-violet-500/10 text-violet-300"
              : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
          )}
        >
          <Database className="size-4" />
          Repository
        </button>

        <div className="mt-5 mb-1.5 px-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
          Campaigns
        </div>
        <div className="flex flex-col gap-0.5">
          {campaigns.map((c) => {
            const active = typeof view === "object" && view.campaignId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setView({ campaignId: c.id })}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-violet-500/10 font-medium text-violet-300"
                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                )}
              >
                <Megaphone className="size-3.5 shrink-0" />
                <span className="truncate">{c.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

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
            sessions={sorted}
            selectedSessionId={selectedSessionId}
            onSelectSession={onSelectSession}
            onOpenSend={onOpenSend}
            onDeleteSession={onDeleteSession}
            onUnlockSession={onUnlockSession}
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
          <span>
            {sorted.length} {view === "repository" ? "items in repository" : "sent to this campaign"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Synced to Wozku
          </span>
        </footer>
      </div>

      {activeCampaign && (
        <ImportFromRepositorySheet
          open={showImport}
          onOpenChange={setShowImport}
          campaignName={activeCampaign.name}
          availableSessions={importCandidates}
          onImport={(sessionIds) => onImportToCampaign(sessionIds, activeCampaign.id)}
        />
      )}
    </div>
  );
}
