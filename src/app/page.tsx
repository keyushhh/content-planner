"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, PlusCircle, Settings2, LayoutGrid, UserPlus, FlaskConical } from "lucide-react";
import { CampaignSidebar } from "@/components/content-planner/campaign-sidebar";
import { SessionsTable } from "@/components/content-planner/sessions-table";
import {
  SessionDetailPane,
  readStoredLayout,
  LAYOUT_STORAGE_KEY,
  type ComposerLayout,
} from "@/components/content-planner/session-detail-pane";
import { DiscussionPanel } from "@/components/content-planner/discussion-panel";
import { TableStyleToggle } from "@/components/content-planner/table-style-toggle";
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
import type { HistoryEntry, Session } from "@/lib/types";

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
  const [campaigns, setCampaigns] = useState<typeof initialCampaigns>(initialCampaigns);
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [mounted, setMounted] = useState(false);

  const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0].id);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [discussionField, setDiscussionField] = useState<string | undefined>(undefined);
  const [sendSheetSessionId, setSendSheetSessionId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [composerLayout, setComposerLayout] = useState<ComposerLayout>("split");

  // One switch drives the table style and the detail-pane layout together.
  function changeTableStyle(next: ComposerLayout) {
    setComposerLayout(next);
    localStorage.setItem(LAYOUT_STORAGE_KEY, next);
  }
  const nextId = useRef(1000);

  // Load persisted state safely after initial client mount to prevent SSR hydration mismatch
  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem("cp_mode");
    if (savedMode === "current" || savedMode === "new") {
      setMode(savedMode);
    }
    setComposerLayout(readStoredLayout());
    const savedCampaigns = localStorage.getItem("cp_campaigns");
    if (savedCampaigns) {
      try {
        setCampaigns(JSON.parse(savedCampaigns));
      } catch (e) {}
    }
    const savedSessions = localStorage.getItem("cp_sessions");
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("cp_mode", mode);
    }
  }, [mode, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("cp_campaigns", JSON.stringify(campaigns));
    }
  }, [campaigns, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("cp_sessions", JSON.stringify(sessions));
    }
  }, [sessions, mounted]);

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

        // Build history entries, coalescing recent edits to the same field (within 10s)
        const updatedHistory = [...s.history];
        const now = new Date();

        const updateOrPushHistory = (key: string, defaultAction: string) => {
          const lastIdx = updatedHistory.length - 1;
          const last = updatedHistory[lastIdx];
          const isRecentSameField =
            last &&
            last.id.includes(key) &&
            now.getTime() - new Date(last.createdAt).getTime() < 10000;

          if (isRecentSameField) {
            updatedHistory[lastIdx] = {
              ...last,
              action: defaultAction,
              createdAt: now.toISOString(),
            };
          } else {
            updatedHistory.push({
              id: `hist-${now.getTime()}-${key}`,
              actor: currentUser,
              action: defaultAction,
              createdAt: now.toISOString(),
            });
          }
        };

        if (patch.title !== undefined && patch.title !== s.title) {
          updateOrPushHistory("title", `updated title to "${patch.title}"`);
        }
        if (patch.status !== undefined && patch.status !== s.status) {
          updateOrPushHistory("status", `changed status to ${patch.status.toUpperCase()}`);
        }
        if (patch.postType !== undefined && patch.postType !== s.postType) {
          updateOrPushHistory("postType", `changed post type to ${patch.postType}`);
        }
        if (patch.copy !== undefined && patch.copy !== s.copy) {
          updateOrPushHistory("copy", `updated content copy`);
        }
        if (patch.hashtags !== undefined && patch.hashtags !== s.hashtags) {
          updateOrPushHistory("tags", `updated hashtags`);
        }
        if (patch.visualAssetIds !== undefined && patch.visualAssetIds.length !== s.visualAssetIds.length) {
          updateOrPushHistory(
            "media",
            `${patch.visualAssetIds.length > s.visualAssetIds.length ? "added" : "removed"} visual assets (${patch.visualAssetIds.length} total)`
          );
        }

        // Any edit while Draft or Approved automatically sets/reverts status to WIP
        let nextStatus = patch.status;
        if (nextStatus === undefined) {
          if (s.status === "draft" || s.status === "approved") {
            nextStatus = "wip";
            if (s.status === "approved") {
              updateOrPushHistory("status", "reverted status to WIP due to edits");
            }
          } else {
            nextStatus = s.status;
          }
        }

        return {
          ...s,
          ...patch,
          status: nextStatus,
          history: updatedHistory,
          lastEditedBy: currentUser,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }

  function clearHistory(id: string) {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, history: [] } : s)),
    );
  }

  function addComment(id: string, text: string, parentId?: string, fieldLabel?: string) {
    const newComment = {
      id: `comment-${Date.now()}`,
      author: currentUser,
      text,
      // Which field the comment anchor was clicked on, so it lands attached
      // instead of floating at the top level.
      ...(fieldLabel ? { fieldLabel } : {}),
      createdAt: new Date().toISOString(),
    };
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (!parentId) {
          return { ...s, comments: [...s.comments, newComment] };
        }
        // Append reply to the parent comment's replies array
        return {
          ...s,
          comments: s.comments.map((c) =>
            c.id === parentId
              ? { ...c, replies: [...(c.replies ?? []), newComment] }
              : c
          ),
        };
      }),
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

  // Dev helper: generate a realistically sized repository so the table can be
  // demoed at scale (sticky header, windowing, search, sort).
  function seedDemoContent() {
    const TOPICS = [
      "Product launch", "Feature spotlight", "Customer story", "Behind the scenes",
      "Hiring update", "Webinar recap", "Case study", "Release notes",
      "Team spotlight", "Industry roundup", "Tips & tricks", "Partner announcement",
      "Milestone", "Event invite", "Founder note", "Changelog",
    ];
    const TAGS = ["social", "product", "launch", "giveaway", "contest", "email", "announcement"];
    const AUTHORS = [currentUser, { id: "u-john", name: "John M." }, { id: "u-priya", name: "Priya R." }, { id: "u-sam", name: "Sam O." }];
    const STATUSES: Session["status"][] = ["draft", "wip", "approved"];

    const now = Date.now();
    const seeded: Session[] = Array.from({ length: 450 }, (_, i) => {
      const topic = TOPICS[i % TOPICS.length];
      const status = STATUSES[i % STATUSES.length];
      // spread edits across ~90 days so "recently edited" sorting is meaningful
      const editedAt = new Date(now - i * 4.8 * 3600 * 1000).toISOString();
      const createdAt = new Date(now - (i + 30) * 6.2 * 3600 * 1000).toISOString();
      const author = AUTHORS[i % AUTHORS.length];
      return {
        id: `seed-${i}`,
        title: `${topic} \u2014 ${String(i + 1).padStart(3, "0")}`,
        createdAt,
        updatedAt: editedAt,
        lastEditedBy: i % 7 === 0 ? null : author,
        status,
        postType: "Image",
        platforms: ["linkedin"],
        visualAssetIds: i % 3 === 0 ? ["asset-1"] : [],
        copy:
          i % 5 === 0
            ? ""
            : `${topic} copy for item ${i + 1}. Sharing what we shipped and why it matters.`,
        variations: [],
        hashtags: i % 4 === 0 ? "#product #launch" : "",
        sentToCampaignId: null,
        sentAt: null,
        tags: [TAGS[i % TAGS.length], TAGS[(i + 3) % TAGS.length]],
        comments: [],
        history: [],
      };
    });

    setSessions((prev) => {
      const withoutSeeds = prev.filter((s) => !s.id.startsWith("seed-"));
      // second click clears instead of stacking another 450
      return prev.some((s) => s.id.startsWith("seed-")) ? withoutSeeds : [...withoutSeeds, ...seeded];
    });
  }

  const isCanvas = composerLayout === "canvas";

  return (
    <div
      className={cn(
        "flex h-screen w-full flex-col overflow-hidden bg-background text-foreground",
        // the whole page picks up the canvas wash, not just the table
        isCanvas &&
          "bg-[radial-gradient(140%_90%_at_50%_0%,rgba(139,92,246,0.055),transparent_55%)]",
      )}
    >
      <div
        className={cn(
          "flex h-10 shrink-0 items-center justify-between px-4",
          isCanvas
            ? "border-b border-white/[0.06] bg-black/[0.14]"
            : "border-b border-border bg-card/40",
        )}
      >
        <span className="text-xs font-medium text-muted-foreground">Content Planner</span>
        <div className="flex items-center gap-1.5">
        <div
          className={cn(
            "flex items-center gap-0.5 rounded-full p-0.5 text-xs font-medium",
            isCanvas
              ? "bg-white/[0.03] inset-ring-1 inset-ring-white/[0.08]"
              : "border border-border bg-background",
          )}
        >
          <button
            onClick={() => setMode("current")}
            className={cn(
              "rounded-full px-3 py-1 transition-[background-color,color,box-shadow,scale] duration-150 active:scale-[0.96]",
              mode === "current"
                ? isCanvas
                  ? "bg-white/[0.11] text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                  : "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Current
          </button>
          <button
            onClick={() => setMode("new")}
            className={cn(
              "rounded-full px-3 py-1 transition-[background-color,color,box-shadow,scale] duration-150 active:scale-[0.96]",
              mode === "new"
                ? isCanvas
                  ? "bg-violet-600 text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_5px_14px_-8px_rgba(139,92,246,0.8)] inset-ring-1 inset-ring-white/15"
                  : "bg-violet-600 text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            New Model
          </button>
        </div>

        <div className="mx-1 h-5 w-px bg-white/10" />
        <TableStyleToggle value={composerLayout} onChange={changeTableStyle} />

        {/* Dev only: stress the table so the demo shows a realistic repository */}
        <button
          onClick={seedDemoContent}
          title="Dev: add 450 sample items"
          className={cn(
            "ml-1 flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium transition-[background-color,color,scale] duration-150 active:scale-[0.96]",
            isCanvas
              ? "bg-white/[0.03] text-muted-foreground inset-ring-1 inset-ring-white/[0.08] hover:text-foreground"
              : "border border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <FlaskConical className="size-3.5" />
          Seed 450
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
              <header
                className={cn(
                  "flex shrink-0 items-center justify-between gap-4 px-5",
                  isCanvas ? "h-16 border-b border-white/[0.06]" : "h-14 border-b border-border px-4",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex items-center justify-center",
                      isCanvas
                        ? "size-9 rounded-full bg-violet-500/12 text-violet-300 inset-ring-1 inset-ring-violet-400/25"
                        : "size-7 rounded-md bg-violet-600 text-white",
                    )}
                  >
                    <CalendarDays className="size-4" />
                  </span>
                  <span className={cn("font-semibold", isCanvas ? "text-[15px] tracking-tight" : "text-sm")}>
                    {selectedCampaign.name}
                  </span>
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

              <div
                className={cn(
                  "min-h-0 flex-1",
                  isCanvas && "overflow-y-auto",
                )}
              >
                {isCanvas ? (
                  <div className="mx-auto w-full max-w-[1280px] px-6 pb-16">
                    <div className="pb-6 pt-7">
                      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em]">
                        {selectedCampaign.name}
                      </h1>
                      <p className="mt-1.5 text-[13px] text-muted-foreground">
                        Content scheduled for this campaign.
                      </p>
                    </div>
                    <SessionsTable
                      variant="canvas"
                      sessions={campaignSessions}
                      selectedSessionId={selectedSessionId}
                      onSelectSession={setSelectedSessionId}
                      onOpenSend={setSendSheetSessionId}
                      onDeleteSession={deleteSession}
                      onUnlockSession={unlockSession}
                    />
                  </div>
                ) : (
                <SessionsTable
                  sessions={campaignSessions}
                  selectedSessionId={selectedSessionId}
                  onSelectSession={setSelectedSessionId}
                  onOpenSend={setSendSheetSessionId}
                  onDeleteSession={deleteSession}
                  onUnlockSession={unlockSession}
                />
                )}
              </div>

              <footer
                className={cn(
                  "flex shrink-0 items-center justify-between text-muted-foreground",
                  isCanvas
                    ? "h-9 border-t border-white/[0.06] px-5 text-[11px]"
                    : "h-8 border-t border-border px-4 text-xs",
                )}
              >
                <span className="tabular-nums">{campaignSessions.length} sessions</span>
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
            onCreateCampaign={createCampaign}
            tableStyle={composerLayout}
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
            aria-label={
              selectedSession ? `Editing ${selectedSession.title}` : "Session details"
            }
            className={cn(
              "session-pane-surface fixed inset-y-0 right-0 left-auto z-50 flex h-full !max-w-none min-w-[720px] rounded-none border-l border-border bg-background p-0 text-foreground shadow-2xl ring-1 ring-black/10 transition-[transform,width] duration-250 ease-out data-ending-style:translate-x-full data-starting-style:translate-x-full",
              // Canvas is a document, not a dashboard — a narrower pane keeps the
              // sessions table visible behind it and suits the reading measure.
              mode === "new" && composerLayout === "canvas" ? "!w-[62%]" : "!w-[70%]",
            )}
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
                    onToggleDiscussion={() => {
                      setDiscussionOpen((v) => !v);
                      setDiscussionField(undefined);
                    }}
                    onOpenDiscussion={(fieldLabel) => {
                      setDiscussionOpen(true);
                      setDiscussionField(fieldLabel);
                    }}
                    onOpenSend={() => setSendSheetSessionId(selectedSession.id)}
                    hidePlatforms={true}
                    hidePostType={mode === "new"}
                    postTypeAsSegmented={mode === "current"}
                    isNewModel={mode === "new"}
                    composerLayout={composerLayout}
                  />
                </div>
                <DiscussionPanel
                  session={selectedSession}
                  isOpen={discussionOpen}
                  onClose={() => {
                    setDiscussionOpen(false);
                    setDiscussionField(undefined);
                  }}
                  onAddComment={(text, parentId, fieldLabel) =>
                    addComment(selectedSession.id, text, parentId, fieldLabel)
                  }
                  onClearHistory={() => clearHistory(selectedSession.id)}
                  pendingFieldLabel={discussionField}
                  onClearPendingField={() => setDiscussionField(undefined)}
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
