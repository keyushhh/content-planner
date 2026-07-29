"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  PlusCircle,
  Settings2,
  LayoutGrid,
  Search,
  UserPlus,
  FlaskConical,
} from "lucide-react";
import { CampaignSidebar } from "@/components/content-planner/campaign-sidebar";
import { SessionsTable } from "@/components/content-planner/sessions-table";
import {
  SessionDetailPane,
  type ComposerLayout,
} from "@/components/content-planner/session-detail-pane";
import { FeedbackPanel } from "@/components/content-planner/feedback-panel";
import { SendToCampaignSheet } from "@/components/content-planner/send-to-campaign-sheet";
import { SendSuccessModal } from "@/components/content-planner/send-success-modal";
import { InviteModal } from "@/components/content-planner/invite-modal";
import { Sheet, SheetContent, SheetOverlay, SheetPortal } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { PostTypeModal } from "@/components/content-planner/post-type-modal";
import {
  CommandPalette,
  useCommandPalette,
} from "@/components/content-planner/command-palette";
import { RepositoryShell } from "@/components/repository/repository-shell";
import { cn } from "@/lib/utils";
import { flyTitleWhenReady } from "@/lib/title-flight";
import {
  campaigns as initialCampaigns,
  currentUser,
  mediaAssets as initialMediaAssets,
  mediaFolders,
  sessions as initialSessions,
} from "@/lib/mock-data";
import type {
  CustomCellValues,
  CustomColumn,
  Feedback,
  FeedbackStatus,
  MediaAsset,
  PostType,
  Session,
} from "@/lib/types";
import { feedbackStatusMeta } from "@/lib/feedback";

const COLUMNS_STORAGE_KEY = "cp_custom_columns";
const CELLS_STORAGE_KEY = "cp_custom_cells";

/** Dev-only table state overrides, for demoing states real data will not show. */
type DemoState = "live" | "empty" | "loading";
const DEMO_STATES: { id: DemoState; label: string }[] = [
  { id: "live", label: "Live" },
  { id: "empty", label: "Empty" },
  { id: "loading", label: "Loading" },
];

/**
 * Sessions saved by earlier builds carry a single `sentToCampaignId`. Reading
 * them back without this leaves `sentToCampaignIds` undefined, and every call
 * that asks "is this sent?" throws on the missing array.
 */
type LegacyComment = {
  id: string;
  author: Session["lastEditedBy"];
  fieldLabel?: string;
  text: string;
  createdAt: string;
  replies?: LegacyComment[];
};

function migrateSession(
  s: Session & { sentToCampaignId?: string | null; comments?: LegacyComment[] },
): Session {
  const next = { ...s };

  if (!Array.isArray(next.sentToCampaignIds)) {
    const legacy = s.sentToCampaignId;
    next.sentToCampaignIds = legacy ? [legacy] : [];
  }

  // Comments became feedback, and threads went away with them: a reply carries
  // the same weight as the note it answered, so it is flattened into its own
  // item rather than silently dropped.
  if (!Array.isArray(next.feedback)) {
    const flat: Feedback[] = [];
    const visit = (c: LegacyComment, section?: string) => {
      flat.push({
        id: c.id,
        author: c.author ?? currentUser,
        sectionLabel: c.fieldLabel ?? section,
        text: c.text,
        createdAt: c.createdAt,
        status: "open",
      });
      c.replies?.forEach((r) => visit(r, c.fieldLabel));
    };
    (s.comments ?? []).forEach((c) => visit(c));
    next.feedback = flat;
  }

  return next;
}

function createBlankSession(id: string, postType: PostType = "Image"): Session {
  const now = new Date().toISOString();
  return {
    id,
    title: "Untitled Session",
    createdAt: now,
    updatedAt: now,
    lastEditedBy: null,
    status: "draft",
    postType,
    platforms: ["linkedin"],
    visualAssetIds: [],
    copy: "",
    variations: [],
    hashtags: "",
    sentToCampaignIds: [],
    sentAt: null,
    tags: [],
    feedback: [],
    history: [],
  };
}

export default function Home() {
  const toast = useToast();
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();
  const [mode, setMode] = useState<"classic" | "repository">("classic");
  const [campaigns, setCampaigns] = useState<typeof initialCampaigns>(initialCampaigns);
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [mounted, setMounted] = useState(false);

  const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0].id);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [showPostType, setShowPostType] = useState(false);
  const [feedbackSection, setFeedbackSection] = useState<string | undefined>(undefined);
  const [sendSheetSessionId, setSendSheetSessionId] = useState<string | null>(null);
  /** What the last send actually did, for the confirmation that follows it. */
  const [sendResult, setSendResult] = useState<
    { title: string; campaignIds: string[] } | null
  >(null);
  // Assets have to be state, not the imported constant: an upload that cannot
  // add to the library is not an upload, and the old file input threw the file
  // away and closed the dialog.
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(initialMediaAssets);
  const [demoState, setDemoState] = useState<DemoState>("live");
  const [showInviteModal, setShowInviteModal] = useState(false);
  /**
   * The layout is not a separate choice any more — each model owns one. The
   * repository model was designed around Canvas, the classic model around
   * Classic (internally "split"), so deriving it from `mode` makes the
   * unsupported pairings unreachable instead of merely unlikely.
   */
  const composerLayout: ComposerLayout = mode === "repository" ? "canvas" : "split";

  // Custom table columns live here, above the table, so adding a column, naming
  // it and filling cells all survive filtering, sorting, paging and reloads.
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [customCellValues, setCustomCellValues] = useState<CustomCellValues>({});

  function addColumn() {
    const id = `col-${Date.now()}`;
    setCustomColumns((prev) => [
      ...prev,
      { id, name: `Column ${prev.length + 1}` },
    ]);
    return id;
  }

  function renameColumn(colId: string, name: string) {
    setCustomColumns((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, name: name || "Column" } : c)),
    );
  }

  /** Deleting a column takes its cell values with it — leaving them behind
      would silently resurrect old text under a new column of the same id. */
  function deleteColumn(colId: string) {
    setCustomColumns((prev) => prev.filter((c) => c.id !== colId));
    setCustomCellValues((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([sessionId, cells]) => {
          const { [colId]: _removed, ...rest } = cells;
          return [sessionId, rest];
        }),
      ),
    );
  }

  function setCellValue(sessionId: string, colId: string, value: string) {
    setCustomCellValues((prev) => ({
      ...prev,
      [sessionId]: { ...(prev[sessionId] ?? {}), [colId]: value },
    }));
  }

  const customColumnProps = {
    customColumns,
    customCellValues,
    onAddColumn: addColumn,
    onRenameColumn: renameColumn,
    onDeleteColumn: deleteColumn,
    onSetCellValue: setCellValue,
  };

  const nextId = useRef(1000);

  // Load persisted state safely after initial client mount to prevent SSR hydration mismatch
  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem("cp_mode");
    // Both models have been renamed since this key was first written: "new"
    // became "repository" and "current" became "classic". Old values are still
    // honoured, or an existing session gets silently moved to the other model.
    if (savedMode === "new" || savedMode === "repository") {
      setMode("repository");
    } else if (savedMode === "current" || savedMode === "classic") {
      setMode("classic");
    }
    const savedCampaigns = localStorage.getItem("cp_campaigns");
    if (savedCampaigns) {
      try {
        setCampaigns(JSON.parse(savedCampaigns));
      } catch (e) {}
    }
    const savedSessions = localStorage.getItem("cp_sessions");
    if (savedSessions) {
      try {
        // Dedupe on the way in: earlier builds restarted the id counter at 1000
        // on every reload, so saved state can already hold two `session-1000`
        // entries. The generator no longer creates them, but it cannot undo the
        // ones already written to localStorage.
        const parsed: Session[] = JSON.parse(savedSessions);
        const seen = new Set<string>();
        setSessions(
          parsed
            .filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)))
            .map(migrateSession),
        );
      } catch (e) {}
    }
    const savedColumns = localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (savedColumns) {
      try {
        setCustomColumns(JSON.parse(savedColumns));
      } catch (e) {}
    }
    const savedCells = localStorage.getItem(CELLS_STORAGE_KEY);
    if (savedCells) {
      try {
        setCustomCellValues(JSON.parse(savedCells));
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
    if (mounted) {
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(customColumns));
    }
  }, [customColumns, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(CELLS_STORAGE_KEY, JSON.stringify(customCellValues));
    }
  }, [customCellValues, mounted]);

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

  function addFeedback(id: string, text: string, sectionLabel?: string) {
    const item: Feedback = {
      id: `fb-${Date.now()}`,
      author: currentUser,
      text,
      // Which section the affordance was clicked on, so it lands attached
      // instead of floating against the whole post.
      ...(sectionLabel ? { sectionLabel } : {}),
      createdAt: new Date().toISOString(),
      status: "open",
    };
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, feedback: [...s.feedback, item] } : s)),
    );
  }

  /**
   * Moving a piece of feedback is a real event in the life of the post, so it is
   * logged — otherwise "who closed this, and when" is unanswerable, which is
   * exactly the question a status invites.
   */
  function setFeedbackStatus(
    sessionId: string,
    feedbackId: string,
    status: FeedbackStatus,
  ) {
    const now = new Date().toISOString();
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const target = s.feedback.find((f) => f.id === feedbackId);
        if (!target || target.status === status) return s;
        const resolved = !feedbackStatusMeta(status).active;
        return {
          ...s,
          feedback: s.feedback.map((f) =>
            f.id === feedbackId
              ? {
                  ...f,
                  status,
                  resolvedBy: resolved ? currentUser : null,
                  resolvedAt: resolved ? now : null,
                }
              : f,
          ),
          history: [
            ...s.history,
            {
              id: `hist-${Date.now()}-feedback`,
              actor: currentUser,
              action: `marked feedback “${
                target.text.length > 40 ? `${target.text.slice(0, 40)}…` : target.text
              }” as ${feedbackStatusMeta(status).label}`,
              createdAt: now,
            },
          ],
        };
      }),
    );
  }

  /**
   * Sending is additive: a post already live in one campaign stays there when it
   * is also sent to another, so the ids are merged rather than replaced.
   */
  function shareSessionToCampaigns(sessionId: string, campaignIds: string[]) {
    if (campaignIds.length === 0) return;
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const merged = Array.from(
      new Set([...session.sentToCampaignIds, ...campaignIds]),
    );
    updateSession(sessionId, {
      sentToCampaignIds: merged,
      sentAt: new Date().toISOString(),
    });
  }

  /**
   * Send means different things in the two models, so it forks here rather than
   * inside the sheet.
   *
   * The classic model has exactly one destination — the campaign selected in the
   * sidebar — so a picker would be asking a question with a single possible
   * answer. Send commits straight away and the confirmation reports where it
   * went. Choosing destinations is the repository model's job, and only it opens
   * the sheet.
   */
  function requestSend(sessionId: string) {
    if (mode === "repository") {
      setSendSheetSessionId(sessionId);
      return;
    }
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    shareSessionToCampaigns(sessionId, [selectedCampaignId]);
    setSendResult({ title: session.title, campaignIds: [selectedCampaignId] });
  }

  function unlockSession(id: string) {
    updateSession(id, { status: "wip" });
  }

  // Repository model only: create a campaign inline, without leaving the send flow.
  function createCampaign(name: string): string {
    const id = `camp-${Date.now()}`;
    setCampaigns((prev) => [
      ...prev,
      { id, name, tag: "NEW", inWozku: false, endDate: "TBD", sessionIds: [] },
    ]);
    return id;
  }

  /**
   * Takes files off a file input and into the library, returning the new ids so
   * the picker can attach them straight to whatever asked for them.
   *
   * Object URLs, so a picked image actually renders — there is no upload
   * endpoint here. They live as long as the tab does, which is the same lifetime
   * as the rest of this prototype's state, and are revoked when an asset is
   * dropped from the library rather than on unmount, or a thumbnail still on
   * screen would go blank.
   */
  function uploadAssets(files: File[], folderId: string): string[] {
    const created: MediaAsset[] = files.map((file, i) => ({
      id: `asset-${Date.now()}-${i}`,
      folderId,
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type === "application/pdf" ? "pdf" : "image",
    }));
    setMediaAssets((prev) => [...created, ...prev]);
    toast({
      title: created.length === 1 ? "Asset uploaded" : `${created.length} assets uploaded`,
      description:
        created.length === 1 ? created[0].name : "They are now in your media library.",
      tone: "success",
    });
    return created.map((a) => a.id);
  }

  /**
   * Opens a post in the detail pane, and hands its title across.
   *
   * The row and the pane show the same words at two sizes, so the title flies
   * from one to the other and the pane reads as that row opening rather than as
   * a second screen sliding over the first. Every entry point goes through here
   * — clicks, Enter from the keyboard cursor, ⌘K — and when there is no row on
   * screen to fly from (a palette jump from another campaign) the flight simply
   * does not happen. The pane opens either way.
   */
  function openSession(id: string) {
    const rowTitle = document.querySelector<HTMLElement>(
      `[data-row-id="${id}"] [data-row-title]`,
    );
    setSelectedSessionId(id);
    if (rowTitle) flyTitleWhenReady(rowTitle, "[data-pane-title]");
  }

  function deleteSession(id: string) {
    const removed = sessions.find((s) => s.id === id);
    if (!removed) return;

    setSessions((prev) => prev.filter((s) => s.id !== id));
    setCustomCellValues((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
    setCampaigns((prev) =>
      prev.map((c) => ({
        ...c,
        sessionIds: c.sessionIds.filter((sid) => sid !== id),
      })),
    );
    if (selectedSessionId === id) setSelectedSessionId(null);

    // No undo offered: the confirm dialog promises the deletion is permanent,
    // and a toast that then hands back an Undo makes one of the two a lie.
    toast({
      title: "Content deleted",
      description: removed.title
        ? `“${removed.title}” has been deleted.`
        : "The content has been deleted.",
      tone: "danger",
    });
  }

  /**
   * Sessions persist to localStorage but this counter does not, so after a reload
   * it restarted at 1000 while `session-1000` was still in the saved list — two
   * children with the same key. Skipping ids that are already taken makes the
   * generator safe no matter what state was restored.
   */
  function makeSessionId() {
    const taken = new Set(sessions.map((s) => s.id));
    let n = nextId.current;
    while (taken.has(`session-${n}`)) n++;
    nextId.current = n + 1;
    return `session-${n}`;
  }

  function duplicateSession(id: string) {
    const source = sessions.find((s) => s.id === id);
    if (!source) return;
    const newId = makeSessionId();
    const copyItem: Session = {
      ...source,
      id: newId,
      title: `${source.title} (Copy)`,
      status: "draft",
      sentToCampaignIds: [],
      sentAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEditedBy: currentUser,
    };
    setSessions((prev) => [copyItem, ...prev]);
    setSelectedSessionId(newId);
  }

  function handleNewSession() {
    const id = makeSessionId();
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

  // Repository model: content is created standalone, campaign-agnostic — no
  // campaign.sessionIds membership at all, unlike the legacy handleNewSession.
  /**
   * The repository model asks for the post type first: the type decides which fields the
   * composer shows, so choosing it inside the composer would mean the composer
   * rearranging itself under you. The classic model keeps its old behaviour —
   * it has always carried Post Type as a field in the pane.
   */
  function handleNewContent() {
    if (mode === "repository") {
      setShowPostType(true);
      return;
    }
    createContent("Image");
  }

  function createContent(postType: PostType) {
    const id = makeSessionId();
    setSessions((prev) => [...prev, createBlankSession(id, postType)]);
    setSelectedSessionId(id);
    setShowPostType(false);
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
        sentToCampaignIds: [],
        sentAt: null,
        tags: [TAGS[i % TAGS.length], TAGS[(i + 3) % TAGS.length]],
        feedback: [],
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
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">Content Planner</span>
          {/* The palette needs a door. A shortcut nobody can see is a shortcut
              only the person who built it uses. */}
          <button
            onClick={() => setPaletteOpen(true)}
            title="Search everything (⌘K)"
            className={cn(
              "group flex h-7 items-center gap-2 rounded-full pl-2 pr-1.5 text-[11px] font-medium text-muted-foreground transition-[background-color,color,box-shadow] duration-150 hover:text-foreground",
              isCanvas
                ? "bg-white/[0.03] inset-ring-1 inset-ring-white/[0.08] hover:bg-white/[0.06]"
                : "border border-border hover:bg-accent/40",
            )}
          >
            <Search className="size-3" />
            Search
            <kbd className="rounded bg-white/[0.07] px-1 py-px text-[10px] text-muted-foreground/80 inset-ring-1 inset-ring-white/[0.07] transition-colors duration-150 group-hover:text-foreground/80">
              ⌘K
            </kbd>
          </button>
        </div>
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
            onClick={() => setMode("classic")}
            className={cn(
              "rounded-full px-3 py-1 transition-[background-color,color,box-shadow,scale] duration-150 active:scale-[0.96]",
              mode === "classic"
                ? isCanvas
                  ? "bg-white/[0.11] text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                  : "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Classic
          </button>
          <button
            onClick={() => setMode("repository")}
            className={cn(
              "rounded-full px-3 py-1 transition-[background-color,color,box-shadow,scale] duration-150 active:scale-[0.96]",
              mode === "repository"
                ? isCanvas
                  ? "bg-violet-600 text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_5px_14px_-8px_rgba(139,92,246,0.8)] inset-ring-1 inset-ring-white/15"
                  : "bg-violet-600 text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Repository
          </button>
        </div>

        <div className="mx-1 h-5 w-px bg-white/10" />

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

        {/* Dev only: force the table's empty and loading states, so a demo can
            show them without deleting anyone's content or faking a slow network.
            Nothing is destroyed — the data is still there behind the override. */}
        <div
          title="Dev: preview the table's empty and loading states"
          className={cn(
            "ml-1 flex items-center gap-0.5 rounded-full p-0.5 text-[11px] font-medium",
            isCanvas
              ? "bg-white/[0.03] inset-ring-1 inset-ring-white/[0.08]"
              : "border border-border bg-background",
          )}
        >
          {DEMO_STATES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setDemoState(id)}
              className={cn(
                "rounded-full px-2 py-1 transition-[background-color,color,scale] duration-150 active:scale-[0.96]",
                demoState === id
                  ? "bg-white/[0.11] text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {mode === "classic" ? (
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
                      sessions={demoState === "empty" ? [] : campaignSessions}
                      loading={demoState === "loading"}
                      selectedSessionId={selectedSessionId}
                      onSelectSession={openSession}
                      onOpenSend={requestSend}
                      onDeleteSession={deleteSession}
                      onUnlockSession={unlockSession}
                      {...customColumnProps}
                    />
                  </div>
                ) : (
                <SessionsTable
                  sessions={demoState === "empty" ? [] : campaignSessions}
                  loading={demoState === "loading"}
                  selectedSessionId={selectedSessionId}
                  onSelectSession={openSession}
                  onOpenSend={requestSend}
                  onDeleteSession={deleteSession}
                  onUnlockSession={unlockSession}
                  {...customColumnProps}
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
            // Dev states win over the real data, so the demo can show an empty
            // repository without anyone having to delete their content first.
            sessions={demoState === "empty" ? [] : sessions}
            tableLoading={demoState === "loading"}
            selectedSessionId={selectedSessionId}
            onSelectSession={openSession}
            onOpenSend={requestSend}
            onDeleteSession={deleteSession}
            onUnlockSession={unlockSession}
            onDuplicateSession={duplicateSession}
            onNewContent={handleNewContent}
            tableStyle={composerLayout}
            {...customColumnProps}
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
              mode === "repository" && composerLayout === "canvas" ? "!w-[62%]" : "!w-[70%]",
            )}
          >
            {selectedSession && (
              <div className="flex size-full min-h-0 min-w-0">
                <div className="min-h-0 min-w-0 flex-1">
                  <SessionDetailPane
                    session={selectedSession}
                    mediaFolders={mediaFolders}
                    mediaAssets={mediaAssets}
                    onUploadAssets={uploadAssets}
                    onUpdate={(patch) => updateSession(selectedSession.id, patch)}
                    onClose={() => setSelectedSessionId(null)}
                    isFeedbackOpen={feedbackOpen}
                    onToggleFeedback={() => {
                      setFeedbackOpen((v) => !v);
                      setFeedbackSection(undefined);
                    }}
                    onOpenFeedback={(sectionLabel) => {
                      setFeedbackOpen(true);
                      setFeedbackSection(sectionLabel);
                    }}
                    onOpenSend={() => requestSend(selectedSession.id)}
                    hidePlatforms={true}
                    hidePostType={mode === "repository"}
                    postTypeAsSegmented={mode === "classic"}
                    isRepositoryModel={mode === "repository"}
                    composerLayout={composerLayout}
                  />
                </div>
                <FeedbackPanel
                  session={selectedSession}
                  isOpen={feedbackOpen}
                  onClose={() => {
                    setFeedbackOpen(false);
                    setFeedbackSection(undefined);
                  }}
                  onAddFeedback={(text, sectionLabel) =>
                    addFeedback(selectedSession.id, text, sectionLabel)
                  }
                  onSetStatus={(feedbackId, status) =>
                    setFeedbackStatus(selectedSession.id, feedbackId, status)
                  }
                  onClearHistory={() => clearHistory(selectedSession.id)}
                  pendingSectionLabel={feedbackSection}
                  onClearPendingSection={() => setFeedbackSection(undefined)}
                />
              </div>
            )}
          </SheetContent>
        </SheetPortal>
      </Sheet>

      {/* The destination picker belongs to the repository model alone — only
          `requestSend` opens it, and only in that mode. */}
      <SendToCampaignSheet
        open={sendSheetSessionId !== null}
        onOpenChange={(open) => {
          if (!open) setSendSheetSessionId(null);
        }}
        campaigns={campaigns}
        session={sessions.find((s) => s.id === sendSheetSessionId) ?? null}
        // Which campaigns it is already in, so the sheet can mark them as sent
        // rather than offering them again as a fresh destination.
        alreadySentTo={
          sessions.find((s) => s.id === sendSheetSessionId)?.sentToCampaignIds ?? []
        }
        onShare={(campaignIds) => {
          if (!sendSheetSessionId) return;
          const shared = sessions.find((s) => s.id === sendSheetSessionId);
          shareSessionToCampaigns(sendSheetSessionId, campaignIds);
          // Held in local state rather than read back off the session: the
          // summary must describe THIS send, not everywhere the post has ever
          // been sent.
          setSendResult({
            title: shared?.title ?? "",
            campaignIds,
          });
        }}
        allowCreateCampaign
        onCreateCampaign={createCampaign}
      />

      {/* ⌘K. Lives at the page, because it needs everything the page owns:
          the sessions, the campaigns, and the actions that open them. */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        sessions={sessions}
        campaigns={campaigns}
        actions={{
          onOpenSession: openSession,
          onNewContent: handleNewContent,
          onInvite: () => setShowInviteModal(true),
          // Jumping to a campaign closes whatever post was open, or you land on
          // a campaign with last campaign's post still covering it.
          onOpenCampaign: (id) => {
            setSelectedSessionId(null);
            setSelectedCampaignId(id);
          },
        }}
      />

      <SendSuccessModal
        open={sendResult !== null}
        onOpenChange={(next) => {
          if (!next) setSendResult(null);
        }}
        sessionTitle={sendResult?.title ?? ""}
        campaigns={campaigns.filter((c) => sendResult?.campaignIds.includes(c.id))}
        onViewCampaign={(campaignId) => {
          setSendResult(null);
          setSelectedCampaignId(campaignId);
        }}
      />

      <InviteModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        contextName={selectedCampaign.name}
      />

      <PostTypeModal
        open={showPostType}
        onOpenChange={setShowPostType}
        onSelect={createContent}
      />
    </div>
  );
}
