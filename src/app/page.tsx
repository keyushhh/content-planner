"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, PlusCircle, Settings2, LayoutGrid, UserPlus } from "lucide-react";
import { CampaignSidebar } from "@/components/content-planner/campaign-sidebar";
import { SessionsTable } from "@/components/content-planner/sessions-table";
import { SessionDetailPane } from "@/components/content-planner/session-detail-pane";
import { DiscussionPanel } from "@/components/content-planner/discussion-panel";
import { SendToCampaignSheet } from "@/components/content-planner/send-to-campaign-sheet";
import { InviteModal } from "@/components/content-planner/invite-modal";
import { Sheet, SheetContent, SheetOverlay, SheetPortal } from "@/components/ui/sheet";
import { RepositoryShell } from "@/components/repository/repository-shell";
import { cn } from "@/lib/utils";
import {
  campaigns as initialCampaigns,
  currentUser,
  mediaAssets,
  mediaFolders,
  sessions as initialSessions,
} from "@/lib/mock-data";
import type { Session } from "@/lib/types";

function createBlankSession(id: string): Session {
  const now = new Date().toISOString();
  return {
    id,
    title: "Untitled Session",
    createdAt: now,
    updatedAt: now,
    lastEditedBy: null,
    status: "draft",
    postType: "Image",
    platforms: ["linkedin"],
    visualAssetIds: [],
    copy: "",
    variations: [],
    hashtags: "",
    sentToCampaignId: null,
    sentAt: null,
    tags: [],
    comments: [],
    history: [],
  };
}

export default function Home() {
  const [mode, setMode] = useState<"current" | "new">("current");
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [sessions, setSessions] = useState(initialSessions);
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0].id);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [sendSheetSessionId, setSendSheetSessionId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const nextId = useRef(1000);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (selectedSessionId) setSelectedSessionId(null);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleNewContent();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSessionId]);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId)!;
  const campaignSessions = sessions
    .filter((s) => selectedCampaign.sessionIds.includes(s.id))
    .sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null;

  function updateSession(id: string, patch: Partial<Session>) {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        // Any edit while still a untouched Draft immediately promotes it to
        // WIP — unless this very patch is itself an explicit status change.
        const status = patch.status ?? (s.status === "draft" ? "wip" : s.status);
        return {
          ...s,
          ...patch,
          status,
          lastEditedBy: currentUser,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }

  function addComment(id: string, text: string) {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              comments: [
                ...s.comments,
                {
                  id: `comment-${Date.now()}`,
                  author: currentUser,
                  text,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : s,
      ),
    );
  }

  function shareSessionToCampaign(sessionId: string, campaignId: string) {
    updateSession(sessionId, {
      sentToCampaignId: campaignId,
      sentAt: new Date().toISOString(),
    });
  }

  function unlockSession(id: string) {
    updateSession(id, { status: "wip" });
  }

  // New Model only: create a campaign inline, without leaving the send flow.
  function createCampaign(name: string): string {
    const id = `camp-${Date.now()}`;
    setCampaigns((prev) => [
      ...prev,
      { id, name, tag: "NEW", inWozku: false, endDate: "TBD", sessionIds: [] },
    ]);
    return id;
  }

  // New Model only: pull existing repository content into a campaign. Per
  // the meeting notes, imported content lands as WIP pending this
  // campaign's own platform/scheduling settings, not straight to Approved.
  function importSessionsToCampaign(sessionIds: string[], campaignId: string) {
    sessionIds.forEach((id) => {
      updateSession(id, {
        sentToCampaignId: campaignId,
        sentAt: null,
        status: "wip",
      });
    });
  }

  function deleteSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setCampaigns((prev) =>
      prev.map((c) => ({
        ...c,
        sessionIds: c.sessionIds.filter((sid) => sid !== id),
      })),
    );
    if (selectedSessionId === id) setSelectedSessionId(null);
  }

  function duplicateSession(id: string) {
    const source = sessions.find((s) => s.id === id);
    if (!source) return;
    const newId = `session-${nextId.current++}`;
    const copyItem: Session = {
      ...source,
      id: newId,
      title: `${source.title} (Copy)`,
      status: "draft",
      sentToCampaignId: null,
      sentAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEditedBy: currentUser,
    };
    setSessions((prev) => [copyItem, ...prev]);
    setSelectedSessionId(newId);
  }

  function handleNewSession() {
    const id = `session-${nextId.current++}`;
    setSessions((prev) => [...prev, createBlankSession(id)]);
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === selectedCampaignId
          ? { ...c, sessionIds: [...c.sessionIds, id] }
          : c,
      ),
    );
    setSelectedSessionId(id);
  }

  // New Model: content is created standalone, campaign-agnostic — no
  // campaign.sessionIds membership at all, unlike the legacy handleNewSession.
  function handleNewContent() {
    const id = `session-${nextId.current++}`;
    setSessions((prev) => [...prev, createBlankSession(id)]);
    setSelectedSessionId(id);
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-card/40 px-4">
        <span className="text-xs font-medium text-muted-foreground">Content Planner</span>
        <div className="flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5 text-xs font-medium">
          <button
            onClick={() => setMode("current")}
            className={cn(
              "rounded-full px-3 py-1 transition-colors",
              mode === "current"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Current
          </button>
          <button
            onClick={() => setMode("new")}
            className={cn(
              "rounded-full px-3 py-1 transition-colors",
              mode === "new"
                ? "bg-violet-600 text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            New Model
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {mode === "current" ? (
          <>
            <CampaignSidebar
              campaigns={campaigns}
              selectedCampaignId={selectedCampaignId}
              onSelectCampaign={(id) => {
                setSelectedCampaignId(id);
                setSelectedSessionId(null);
              }}
              collapsed={sidebarCollapsed}
              onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
            />

            <div className="flex min-w-0 flex-1 flex-col">
              <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-md bg-violet-600">
                    <CalendarDays className="size-4 text-white" />
                  </div>
                  <span className="font-semibold text-sm">{selectedCampaign.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-sm text-foreground hover:bg-accent"
                    onClick={() => setShowInviteModal(true)}
                  >
                    <UserPlus className="size-4" />
                    Invite
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-sm"
                    onClick={handleNewSession}
                  >
                    <PlusCircle className="size-4" />
                    New Session
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
                    <LayoutGrid className="size-4" />
                    Screen Setup
                  </Button>
                </div>
              </header>

              <div className="min-h-0 flex-1">
                <SessionsTable
                  sessions={campaignSessions}
                  selectedSessionId={selectedSessionId}
                  onSelectSession={setSelectedSessionId}
                  onOpenSend={setSendSheetSessionId}
                  onDeleteSession={deleteSession}
                  onUnlockSession={unlockSession}
                />
              </div>

              <footer className="flex h-8 shrink-0 items-center justify-between border-t border-border px-4 text-xs text-muted-foreground">
                <span>{campaignSessions.length} sessions</span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Synced to Wozku
                </span>
              </footer>
            </div>
          </>
        ) : (
          <RepositoryShell
            sessions={sessions}
            campaigns={campaigns}
            selectedSessionId={selectedSessionId}
            onSelectSession={setSelectedSessionId}
            onOpenSend={setSendSheetSessionId}
            onDeleteSession={deleteSession}
            onUnlockSession={unlockSession}
            onDuplicateSession={duplicateSession}
            onNewContent={handleNewContent}
            onImportToCampaign={importSessionsToCampaign}
          />
        )}
      </div>

      <Sheet
        open={selectedSession !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSessionId(null);
        }}
      >
        <SheetPortal>
          <SheetOverlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <SheetContent
            showCloseButton={false}
            side="right"
            className="session-pane-surface fixed inset-y-0 right-0 left-auto z-50 flex h-full !w-[70%] !max-w-none min-w-[720px] rounded-none border-l border-border bg-background p-0 text-foreground shadow-2xl ring-1 ring-black/10 transition-transform duration-250 ease-out data-ending-style:translate-x-full data-starting-style:translate-x-full"
          >
            {selectedSession && (
              <div className="flex size-full min-h-0 min-w-0">
                <div className="min-h-0 min-w-0 flex-1">
                  <SessionDetailPane
                    session={selectedSession}
                    mediaFolders={mediaFolders}
                    mediaAssets={mediaAssets}
                    onUpdate={(patch) => updateSession(selectedSession.id, patch)}
                    onClose={() => setSelectedSessionId(null)}
                    isDiscussionOpen={discussionOpen}
                    onToggleDiscussion={() => setDiscussionOpen((v) => !v)}
                    onOpenDiscussion={() => setDiscussionOpen(true)}
                    onOpenSend={() => setSendSheetSessionId(selectedSession.id)}
                    hidePlatforms={mode === "new"}
                  />
                </div>
                <DiscussionPanel
                  session={selectedSession}
                  isOpen={discussionOpen}
                  onClose={() => setDiscussionOpen(false)}
                  onAddComment={(text) => addComment(selectedSession.id, text)}
                />
              </div>
            )}
          </SheetContent>
        </SheetPortal>
      </Sheet>

      <SendToCampaignSheet
        open={sendSheetSessionId !== null}
        onOpenChange={(open) => {
          if (!open) setSendSheetSessionId(null);
        }}
        campaigns={campaigns}
        onShare={(campaignId) => {
          if (sendSheetSessionId) {
            shareSessionToCampaign(sendSheetSessionId, campaignId);
          }
        }}
        allowCreateCampaign={mode === "new"}
        onCreateCampaign={mode === "new" ? createCampaign : undefined}
      />

      <InviteModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        contextName={selectedCampaign.name}
      />
    </div>
  );
}
