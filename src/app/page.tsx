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
  ChevronDown,
  Check,
  Send,
  Database,
  Megaphone,
} from "lucide-react";
import { CampaignSidebar } from "@/components/content-planner/campaign-sidebar";
import {
  MAX_CUSTOM_COLUMNS,
  SessionsTable,
} from "@/components/content-planner/sessions-table";
import {
  SessionDetailPane,
  type ComposerLayout,
} from "@/components/content-planner/session-detail-pane";
import { FeedbackPanel } from "@/components/content-planner/feedback-panel";
import { SendToCampaignSheet } from "@/components/content-planner/send-to-campaign-sheet";
import { SendSuccessModal } from "@/components/content-planner/send-success-modal";
import { InviteModal } from "@/components/content-planner/invite-modal";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { PostTypeModal } from "@/components/content-planner/post-type-modal";
import { ClassicPostTypeModal } from "@/components/content-planner/post-type-modal-classic";
import {
  CommandPalette,
  useCommandPalette,
} from "@/components/content-planner/command-palette";
import {
  ChangelogModal,
  useChangelogUnread,
} from "@/components/content-planner/changelog-modal";
import type { ChangeKind } from "@/lib/changelog";
import { RepositoryShell } from "@/components/repository/repository-shell";
import { CampaignPage } from "@/components/repository/campaign-page";
import { CampaignsView } from "@/components/campaigns/campaigns-view";
import { BrandToggle, useBrandLayer } from "@/components/content-planner/brand-toggle";
import {
  VERSIONS,
  type AppVersion,
} from "@/lib/versions";
import { VersionSwitchDialog } from "@/components/content-planner/version-switch-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, sessionNeedsResend } from "@/lib/utils";
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
  NewCampaign,
  PostType,
  Session,
} from "@/lib/types";
import { feedbackStatusMeta } from "@/lib/feedback";
import { campaignDrafts, campaignMembers } from "@/lib/campaigns";

const COLUMNS_STORAGE_KEY = "cp_custom_columns";
const CELLS_STORAGE_KEY = "cp_custom_cells";
const VERSION_STORAGE_KEY = "cp_version";

type AppSection = "repository" | "campaigns";

const SECTIONS: { id: AppSection; label: string; icon: typeof Database }[] = [
  { id: "repository", label: "Repository", icon: Database },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
];

type DemoState = "live" | "empty" | "loading";
const DEMO_STATES: { id: DemoState; label: string }[] = [
  { id: "live", label: "Live" },
  { id: "empty", label: "Empty" },
  { id: "loading", label: "Loading" },
];

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

  if (!Array.isArray(next.draftCampaignIds)) {
    next.draftCampaignIds = [];
  }

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

  next.feedback = next.feedback.map((f) =>
    (f.status as string) === "wont_do" ? { ...f, status: "discarded" as const } : f,
  );

  return next;
}

function createBlankSession(id: string, postType: PostType = "Image"): Session {
  const now = new Date().toISOString();
  return {
    id,
    title: "Untitled post",
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
    draftCampaignIds: [],
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
  const [mode, setMode] = useState<AppVersion>("repository");
  const [pendingVersion, setPendingVersion] = useState<AppVersion | null>(null);
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkSendIds, setBulkSendIds] = useState<string[] | null>(null);
  const [sendPreset, setSendPreset] = useState<string[] | null>(null);
  const [repoCampaignId, setRepoCampaignId] = useState<string | null>(null);
  const [section, setSection] = useState<AppSection>("repository");
  const [sendResult, setSendResult] = useState<
    { title: string; campaignIds: string[]; plural?: boolean } | null
  >(null);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(initialMediaAssets);
  const [demoState, setDemoState] = useState<DemoState>("live");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [changelogFilter, setChangelogFilter] = useState<"all" | ChangeKind>("all");
  const { unread: changelogUnread, markSeen: markChangelogSeen } = useChangelogUnread();
  const composerLayout: ComposerLayout = mode === "repository" ? "canvas" : "split";

  const { mode: brandMode, setMode: setBrandMode } = useBrandLayer(
    mode === "repository",
  );

  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [customCellValues, setCustomCellValues] = useState<CustomCellValues>({});

  function addColumn() {
    const id = `col-${Date.now()}`;
    setCustomColumns((prev) =>
      prev.length >= MAX_CUSTOM_COLUMNS
        ? prev
        : [...prev, { id, name: `Column ${prev.length + 1}` }],
    );
    return id;
  }

  function renameColumn(colId: string, name: string) {
    setCustomColumns((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, name: name || "Column" } : c)),
    );
  }

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

  useEffect(() => {
    document.title = mode
      ? `${mode === "repository" ? "Repository" : "Classic"} · Content Planner (Demo)`
      : "Choose a version · Content Planner (Demo)";
  }, [mode]);

  useEffect(() => {
    setMounted(true);
    const savedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
    if (savedVersion === "classic" || savedVersion === "repository") {
      setMode(savedVersion);
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
      localStorage.setItem(VERSION_STORAGE_KEY, mode);
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

  const sendSheetSession =
    sessions.find((s) => s.id === sendSheetSessionId) ?? null;
  const bulkBatch =
    bulkSendIds && bulkSendIds.length > 0
      ? sessions.filter((s) => bulkSendIds.includes(s.id))
      : null;

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId)!;
  const repoCampaign =
    mode === "repository"
      ? campaigns.find((c) => c.id === repoCampaignId) ?? null
      : null;
  const campaignSessions = campaignMembers(sessions, selectedCampaign).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  const classicDrafts = campaignDrafts(sessions, selectedCampaignId);
  const draftsWaiting = campaigns.reduce(
    (total, c) => total + campaignDrafts(sessions, c.id).length,
    0,
  );
  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null;

  function updateSession(id: string, patch: Partial<Session>) {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;

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
      ...(sectionLabel ? { sectionLabel } : {}),
      createdAt: new Date().toISOString(),
      status: "open",
    };
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, feedback: [...s.feedback, item] } : s)),
    );
  }

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

  function stageDrafts(sessionIds: string[], campaignIds: string[]) {
    if (campaignIds.length === 0 || sessionIds.length === 0) return;
    setSessions((prev) =>
      prev.map((session) => {
        if (!sessionIds.includes(session.id)) return session;
        return {
          ...session,
          draftCampaignIds: Array.from(
            new Set([...session.draftCampaignIds, ...campaignIds]),
          ),
        };
      }),
    );
  }

  function submitDrafts(campaignId: string, sessionIds: string[]) {
    if (sessionIds.length === 0) return;
    const now = new Date().toISOString();
    setSessions((prev) =>
      prev.map((session) => {
        if (!sessionIds.includes(session.id)) return session;
        if (!session.draftCampaignIds.includes(campaignId)) return session;
        return {
          ...session,
          draftCampaignIds: session.draftCampaignIds.filter(
            (id) => id !== campaignId,
          ),
          sentToCampaignIds: Array.from(
            new Set([...session.sentToCampaignIds, campaignId]),
          ),
          sentAt: now,
          history: [
            ...session.history,
            {
              id: `hist-${Date.now()}-${session.id}-submit`,
              actor: currentUser,
              action: `submitted this post to ${
                campaigns.find((c) => c.id === campaignId)?.name ?? "a campaign"
              }`,
              createdAt: now,
            },
          ],
        };
      }),
    );
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              sessionIds: Array.from(new Set([...c.sessionIds, ...sessionIds])),
            }
          : c,
      ),
    );
  }

  function withdrawDraft(campaignId: string, sessionId: string) {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              draftCampaignIds: session.draftCampaignIds.filter(
                (id) => id !== campaignId,
              ),
            }
          : session,
      ),
    );
  }

  function requestSend(sessionId: string) {
    setSendPreset(mode === "repository" ? null : [selectedCampaignId]);
    setSendSheetSessionId(sessionId);
  }

  function changeVersion(next: AppVersion) {
    setMode(next);
    setSelectedIds([]);
  }

  function unlockSession(id: string) {
    updateSession(id, { status: "wip" });
  }

  function createCampaign(draft: NewCampaign): string {
    const id = `camp-${Date.now()}`;
    setCampaigns((prev) => [
      ...prev,
      {
        id,
        name: draft.name,
        tag: draft.tag || "NEW",
        inWozku: false,
        endDate: draft.endDate || "TBD",
        platforms: draft.platforms.length ? draft.platforms : ["linkedin"],
        sessionIds: [],
      },
    ]);
    return id;
  }

  function takeCampaignLive(campaignId: string) {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, inWozku: true } : c)),
    );
  }

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
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
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

    toast({
      title: "Content deleted",
      description: removed.title
        ? `“${removed.title}” has been deleted.`
        : "The content has been deleted.",
      tone: "danger",
    });
  }

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
      draftCampaignIds: [],
      sentToCampaignIds: [],
      sentAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEditedBy: currentUser,
    };
    setSessions((prev) => [copyItem, ...prev]);
    setSelectedSessionId(newId);
  }

  function handleNewContent() {
    setShowPostType(true);
  }

  function createContent(postType: PostType) {
    const id = makeSessionId();
    setSessions((prev) => [...prev, createBlankSession(id, postType)]);
    if (mode === "classic") {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === selectedCampaignId
            ? { ...c, sessionIds: [...c.sessionIds, id] }
            : c,
        ),
      );
    }
    setSelectedSessionId(id);
    setShowPostType(false);
  }

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
      const editedAt = new Date(now - i * 4.8 * 3600 * 1000).toISOString();
      const createdAt = new Date(now - (i + 30) * 6.2 * 3600 * 1000).toISOString();
      const author = AUTHORS[i % AUTHORS.length];
      return {
        id: `seed-${i}`,
        title: `${topic} ${String(i + 1).padStart(3, "0")}`,
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
        draftCampaignIds: [],
        sentToCampaignIds: [],
        sentAt: null,
        tags: [TAGS[i % TAGS.length], TAGS[(i + 3) % TAGS.length]],
        feedback: [],
        history: [],
      };
    });

    const seeding = !sessions.some((s) => s.id.startsWith("seed-"));

    setSessions((prev) => {
      const withoutSeeds = prev.filter((s) => !s.id.startsWith("seed-"));
      return seeding ? [...withoutSeeds, ...seeded] : withoutSeeds;
    });

    setCampaigns((prev) =>
      prev.map((c) => {
        const withoutSeeds = c.sessionIds.filter((id) => !id.startsWith("seed-"));
        if (!seeding || c.id !== selectedCampaignId) return { ...c, sessionIds: withoutSeeds };
        return { ...c, sessionIds: [...withoutSeeds, ...seeded.map((s) => s.id)] };
      }),
    );
  }

  const isCanvas = composerLayout === "canvas";

  return (
    <div
      className={cn(
        "flex h-screen w-full flex-col overflow-hidden bg-background text-foreground",
        isCanvas &&
          "[background-image:var(--wash-page)]",
      )}
    >
      <div
        className={cn(
          "flex h-10 shrink-0 items-center",
          isCanvas
            ? "border-b border-(--ink)/[0.06] bg-(--sink)/[0.14]"
            : "border-b border-border bg-card/40",
        )}
      >
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            Content Planner
          </span>

          {mode === "repository" && (
            <>
              <span
                aria-hidden
                className="h-4 w-px shrink-0 bg-(--ink)/[0.10]"
              />
              <div
                role="tablist"
                aria-label="Section"
                className="flex items-center gap-0.5 rounded-(--r-pill) bg-(--ink)/[0.035] p-0.5 inset-ring-1 inset-ring-(--ink)/[0.07]"
              >
                {SECTIONS.map(({ id, label, icon: Icon }) => {
                  const active = section === id;
                  return (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setSection(id);
                        if (id === "campaigns") setRepoCampaignId(null);
                      }}
                      className={cn(
                        "relative flex h-6 items-center gap-1.5 rounded-(--r-pill) px-2.5 text-[11.5px] font-medium transition-[background-color,color,box-shadow,scale] duration-200 active:scale-(--press) after:absolute after:inset-x-0 after:top-1/2 after:h-10 after:-translate-y-1/2 after:content-['']",
                        active
                          ? "bg-(--ink)/[0.11] text-foreground shadow-(--lift-sm)"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      style={{ transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
                    >
                      <Icon className="size-3 shrink-0" />
                      {label}
                      {id === "campaigns" && draftsWaiting > 0 && (
                        <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-(--r-pill) bg-amber-500/20 px-1 text-[9.5px] font-semibold tabular-nums text-amber-300">
                          {draftsWaiting}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <button
            onClick={() => setPaletteOpen(true)}
            title="Search everything (⌘K)"
            className={cn(
              "group relative flex h-7 w-[240px] items-center gap-2 rounded-(--r-pill) pl-2 pr-1.5 text-[11px] font-medium text-muted-foreground transition-[background-color,color,box-shadow] duration-150 hover:text-foreground after:absolute after:inset-x-0 after:top-1/2 after:h-10 after:-translate-y-1/2 after:content-['']",
              isCanvas
                ? "bg-(--ink)/[0.03] inset-ring-1 inset-ring-(--ink)/[0.08] hover:bg-(--ink)/[0.06]"
                : "border border-border hover:bg-accent/40",
            )}
          >
            <Search className="size-3 shrink-0" />
            <span className="flex-1 text-left">Search</span>
            <kbd className="rounded-sm bg-(--ink)/[0.07] px-1 py-px text-[10px] text-muted-foreground/80 inset-ring-1 inset-ring-(--ink)/[0.07] transition-colors duration-150 group-hover:text-foreground/80">
              ⌘K
            </kbd>
          </button>
        </div>
        <div className="flex items-center gap-1.5">
        <button
          onClick={seedDemoContent}
          title="Dev: add 450 sample items"
          className={cn(
            "ml-1 relative flex h-7 items-center gap-1.5 rounded-(--r-pill) px-2.5 text-[11px] font-medium transition-[background-color,color,scale] duration-150 active:scale-(--press) after:absolute after:inset-x-0 after:top-1/2 after:h-10 after:-translate-y-1/2 after:content-['']",
            isCanvas
              ? "bg-(--ink)/[0.03] text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.08] hover:text-foreground"
              : "border border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <FlaskConical className="size-3.5" />
          Seed 450
        </button>

        <div
          title="Dev: preview the table's empty and loading states"
          className={cn(
            "ml-1 flex items-center gap-0.5 rounded-(--r-pill) p-0.5 text-[11px] font-medium",
            isCanvas
              ? "bg-(--ink)/[0.03] inset-ring-1 inset-ring-(--ink)/[0.08]"
              : "border border-border bg-background",
          )}
        >
          {DEMO_STATES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setDemoState(id)}
              className={cn(
                "rounded-(--r-pill) px-2 py-1 transition-[background-color,color,scale] duration-150 active:scale-(--press) relative after:absolute after:inset-x-0 after:top-1/2 after:h-10 after:-translate-y-1/2 after:content-['']",
                demoState === id
                  ? "bg-(--ink)/[0.11] text-foreground shadow-(--lift-sm)"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "repository" && (
          <BrandToggle mode={brandMode} onChange={setBrandMode} />
        )}

        <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  title="Dev: switch version"
                  aria-label="Switch version"
                  className={cn(
                    "relative flex size-7 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color,scale] duration-150 hover:text-foreground active:scale-(--press) after:absolute after:inset-x-0 after:top-1/2 after:h-10 after:-translate-y-1/2 after:content-['']",
                    isCanvas ? "hover:bg-(--ink)/[0.06]" : "hover:bg-accent/40",
                  )}
                />
              }
            >
              <Settings2 className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[190px]">
              {VERSIONS.map(({ id, label }) => (
                <DropdownMenuItem
                  key={id}
                  onClick={() => {
                    if (id !== mode) setPendingVersion(id);
                  }}
                  className="gap-2"
                >
                  <Check
                    className={cn(
                      "size-3.5 shrink-0",
                      id === mode ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
        </DropdownMenu>
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
                  isCanvas ? "h-16 border-b border-(--ink)/[0.06]" : "h-14 border-b border-border px-4",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex items-center justify-center",
                      isCanvas
                        ? "size-9 rounded-(--r-pill) bg-violet-500/12 text-violet-300 inset-ring-1 inset-ring-violet-400/25"
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
                    onClick={handleNewContent}
                  >
                    <PlusCircle className="size-4" />
                    New post
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
                    <LayoutGrid className="size-4" />
                    Screen Setup
                  </Button>
                  {classicDrafts.length > 0 && (
                    <button
                      onClick={() =>
                        submitDrafts(
                          selectedCampaignId,
                          classicDrafts.map((s) => s.id),
                        )
                      }
                      title="Put these drafts into the campaign"
                      className="ml-1 flex h-8 items-center gap-1.5 rounded-(--r-pill) bg-violet-600 px-3 text-[13px] font-medium text-white transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-[0.96]"
                    >
                      <Send className="size-3.5" />
                      Submit{" "}
                      <span className="tabular-nums">{classicDrafts.length}</span>{" "}
                      {classicDrafts.length === 1 ? "draft" : "drafts"}
                    </button>
                  )}
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
                      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em] text-balance">
                        {selectedCampaign.name}
                      </h1>
                      <p className="mt-1.5 text-[13px] text-muted-foreground">
                        Content scheduled for this campaign.
                      </p>
                    </div>
                    <SessionsTable
                      variant="canvas"
                      sessions={demoState === "empty" ? [] : campaignSessions}
                      campaigns={campaigns}
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
                  campaigns={campaigns}
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
                    ? "h-9 border-t border-(--ink)/[0.06] px-5 text-[11px]"
                    : "h-8 border-t border-border px-4 text-xs",
                )}
              >
                <span className="tabular-nums">
                  {campaignSessions.length}{" "}
                  {campaignSessions.length === 1 ? "post" : "posts"}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-(--r-round) bg-emerald-500" />
                  Synced to Wozku
                </span>
              </footer>
            </div>
          </>
        ) : section === "campaigns" ? (
          repoCampaign ? (
          <CampaignPage
            campaign={repoCampaign}
            campaigns={campaigns}
            sessions={sessions}
            mediaAssets={mediaAssets}
            authorName={currentUser.name}
            selectedSessionId={selectedSessionId}
            onBack={() => setRepoCampaignId(null)}
            onSelectSession={openSession}
            onOpenSend={requestSend}
            onDeleteSession={deleteSession}
            onUnlockSession={unlockSession}
            onDuplicateSession={duplicateSession}
            onSubmit={(ids) => submitDrafts(repoCampaign.id, ids)}
            onWithdraw={(id) => withdrawDraft(repoCampaign.id, id)}
            onGoLive={() => takeCampaignLive(repoCampaign.id)}
            {...customColumnProps}
          />
          ) : (
            <CampaignsView
              campaigns={campaigns}
              sessions={sessions}
              onOpenCampaign={(id) => setRepoCampaignId(id)}
              onCreateCampaign={createCampaign}
            />
          )
        ) : (
          <RepositoryShell
            sessions={demoState === "empty" ? [] : sessions}
            campaigns={campaigns}
            tableLoading={demoState === "loading"}
            selectedSessionId={selectedSessionId}
            onSelectSession={openSession}
            onOpenSend={requestSend}
            onDeleteSession={deleteSession}
            onUnlockSession={unlockSession}
            onDuplicateSession={duplicateSession}
            onNewContent={handleNewContent}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onBulkSend={(ids) => setBulkSendIds(ids)}
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
          <SheetContent
            showCloseButton={false}
            side="right"
            aria-label={
              selectedSession ? `Editing ${selectedSession.title}` : "Session details"
            }
            overlayClassName="z-40 bg-black/40 backdrop-blur-[2px]"
            className={cn(
              "session-pane-surface fixed inset-y-0 right-0 left-auto z-50 flex h-full !max-w-none min-w-[720px] rounded-none border-l border-border bg-background p-0 text-foreground shadow-2xl ring-1 ring-black/10 transition-[width] duration-250 ease-out",
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
      </Sheet>

      <SendToCampaignSheet
        open={sendSheetSessionId !== null || bulkBatch !== null}
        onOpenChange={(open) => {
          if (open) return;
          setSendSheetSessionId(null);
          setBulkSendIds(null);
          setSendPreset(null);
        }}
        campaigns={campaigns}
        mediaAssets={mediaAssets}
        authorName={currentUser.name}
        initialCampaignIds={bulkBatch ? undefined : sendPreset ?? undefined}
        session={sessions.find((s) => s.id === sendSheetSessionId) ?? null}
        sessions={bulkBatch ?? undefined}
        alreadySentTo={
          bulkBatch
            ? campaigns
                .filter((c) =>
                  bulkBatch.every((s) => s.sentToCampaignIds.includes(c.id)),
                )
                .map((c) => c.id)
            : sendSheetSession && !sessionNeedsResend(sendSheetSession)
              ? sendSheetSession.sentToCampaignIds
              : []
        }
        onShare={(campaignIds) => {
          if (bulkBatch) {
            stageDrafts(
              bulkBatch.map((s) => s.id),
              campaignIds,
            );
            setSendResult({
              title: `${bulkBatch.length} posts`,
              plural: true,
              campaignIds,
            });
            setSelectedIds([]);
            setBulkSendIds(null);
            return;
          }
          if (!sendSheetSessionId) return;
          const shared = sessions.find((s) => s.id === sendSheetSessionId);
          stageDrafts([sendSheetSessionId], campaignIds);
          setSendResult({
            title: shared?.title ?? "",
            campaignIds,
          });
        }}
        allowCreateCampaign
        onCreateCampaign={(name) =>
          createCampaign({ name, tag: "NEW", endDate: "", platforms: ["linkedin"] })
        }
      />

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        sessions={sessions}
        campaigns={campaigns}
        actions={{
          onOpenSession: openSession,
          onNewContent: handleNewContent,
          onInvite: () => setShowInviteModal(true),
          onOpenChangelog: () => {
            setShowChangelog(true);
            markChangelogSeen();
          },
          changelogUnread,
          onOpenCampaign: (id) => {
            setSelectedSessionId(null);
            setSelectedCampaignId(id);
            if (mode === "repository") {
              setSection("campaigns");
              setRepoCampaignId(id);
            }
          },
        }}
      />

      <SendSuccessModal
        open={sendResult !== null}
        onOpenChange={(next) => {
          if (!next) setSendResult(null);
        }}
        sessionTitle={sendResult?.title ?? ""}
        plural={sendResult?.plural}
        staged
        campaigns={campaigns.filter((c) => sendResult?.campaignIds.includes(c.id))}
        onViewCampaign={(campaignId) => {
          setSendResult(null);
          setSelectedCampaignId(campaignId);
          if (mode === "repository") {
            setSection("campaigns");
            setRepoCampaignId(campaignId);
          }
        }}
      />

      <InviteModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        contextName={selectedCampaign.name}
      />

      <ChangelogModal
        open={showChangelog}
        onOpenChange={setShowChangelog}
        filter={changelogFilter}
        onFilterChange={setChangelogFilter}
      />

      {mode === "classic" ? (
        <ClassicPostTypeModal
          open={showPostType}
          onOpenChange={setShowPostType}
          onSelect={createContent}
        />
      ) : (
        <PostTypeModal
          open={showPostType}
          onOpenChange={setShowPostType}
          onSelect={createContent}
        />
      )}

      <VersionSwitchDialog
        target={pendingVersion}
        onOpenChange={(next) => {
          if (!next) setPendingVersion(null);
        }}
        onConfirm={() => {
          setSelectedSessionId(null);
          if (pendingVersion) changeVersion(pendingVersion);
          setPendingVersion(null);
        }}
      />
    </div>
  );
}
