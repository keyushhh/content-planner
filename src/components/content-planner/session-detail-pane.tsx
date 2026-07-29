"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronDown,
  Lock,
  LockOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, isSessionLocked, sessionNeedsResend } from "@/lib/utils";
import { MediaLibraryView } from "./media-library-view";
import { SessionComposer } from "./session-composer";
import { SessionCanvas } from "./session-canvas";

export type ComposerLayout = "split" | "canvas";
export const LAYOUT_STORAGE_KEY = "content-planner:composer-layout";

/** Lazy initialiser shared with the page, which owns the pane's width. */
export function readStoredLayout(): ComposerLayout {
  if (typeof window === "undefined") return "split";
  const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
  return stored === "canvas" || stored === "split" ? stored : "split";
}
import type {
  MediaAsset,
  MediaFolder,
  Session,
  SessionStatus,
} from "@/lib/types";

import { VariationsView } from "./variations-view";

interface SessionDetailPaneProps {
  session: Session;
  mediaFolders: MediaFolder[];
  mediaAssets: MediaAsset[];
  /** Adds files to the library and returns the ids they landed under. */
  onUploadAssets?: (files: File[], folderId: string) => string[];
  onUpdate: (patch: Partial<Session>) => void;
  onClose: () => void;
  onOpenFeedback: (sectionLabel?: string) => void;
  isFeedbackOpen: boolean;
  onToggleFeedback: () => void;
  onOpenSend: () => void;
  composerLayout?: ComposerLayout;
}

export function SessionDetailPane({
  session,
  mediaFolders,
  mediaAssets,
  onUploadAssets,
  onUpdate,
  onClose,
  onOpenFeedback,
  isFeedbackOpen,
  onToggleFeedback,
  onOpenSend,
  composerLayout,
}: SessionDetailPaneProps) {
  const [view, setView] = useState<"form" | "media-library" | "variations">("form");
  /**
   * Who asked for the media library, and therefore where the chosen asset goes.
   * It used to always land on the post, so picking an image for a variation
   * silently attached it to the primary and dropped you back on the form — the
   * one flow in the pane that did something other than what it said.
   */
  const [mediaTarget, setMediaTarget] = useState<
    { kind: "post" } | { kind: "variation"; id: string }
  >({ kind: "post" });
  const [tagDraft, setTagDraft] = useState("");
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  // The table owns this now; fall back to the stored value if the pane is ever
  // rendered uncontrolled.
  const layout = composerLayout ?? readStoredLayout();

  // Local draft states for blur & 30-second timer autosave
  const [titleDraft, setTitleDraft] = useState(session.title);
  const [copyDraft, setCopyDraft] = useState(session.copy);
  const [hashtagsDraft, setHashtagsDraft] = useState(session.hashtags);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [saveSource, setSaveSource] = useState<"blur" | "timer" | "instant" | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync draft states when session changes or is re-loaded
  useEffect(() => {
    setTitleDraft(session.title);
    setCopyDraft(session.copy);
    setHashtagsDraft(session.hashtags);
    setSaveStatus("idle");
    setSaveSource(null);
  }, [session.id]);

  // Flush pending local draft changes to onUpdate
  const savePendingChanges = useCallback(
    (source: "blur" | "timer" | "instant" = "blur") => {
      const patch: Partial<Session> = {};
      if (titleDraft !== session.title) patch.title = titleDraft;
      if (copyDraft !== session.copy) patch.copy = copyDraft;
      if (hashtagsDraft !== session.hashtags) patch.hashtags = hashtagsDraft;

      if (Object.keys(patch).length > 0) {
        onUpdate(patch);
        setSaveStatus("saving");
        setSaveSource(source);
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          setSaveStatus("saved");
        }, 1200);
      }
    },
    [titleDraft, copyDraft, hashtagsDraft, session.title, session.copy, session.hashtags, onUpdate]
  );

  // 30-second periodic timer autosave
  useEffect(() => {
    const interval = setInterval(() => {
      savePendingChanges("timer");
    }, 30000);
    return () => clearInterval(interval);
  }, [savePendingChanges]);

  // Helper for instant actions (e.g. status, dropdowns, asset add/remove)
  const handleUpdateWithPendingSave = (patch: Partial<Session>) => {
    const draftPatch: Partial<Session> = {};
    if (titleDraft !== session.title) draftPatch.title = titleDraft;
    if (copyDraft !== session.copy) draftPatch.copy = copyDraft;
    if (hashtagsDraft !== session.hashtags) draftPatch.hashtags = hashtagsDraft;

    onUpdate({ ...draftPatch, ...patch });
    setSaveStatus("saving");
    setSaveSource("instant");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaveStatus("saved");
    }, 1200);
  };

  if (view === "variations") {
    return (
      <div className="h-full w-full animate-in fade-in-50 slide-in-from-right-4 duration-200">
        <VariationsView
          variations={session.variations}
          onChange={(variations) => onUpdate({ variations })}
          mediaAssets={mediaAssets}
          mediaFolders={mediaFolders}
          primaryCopy={copyDraft}
          primaryAssetIds={session.visualAssetIds}
          // Reopens on the variation you were editing when you left for the library
          initialVariationId={
            mediaTarget.kind === "variation" ? mediaTarget.id : null
          }
          onOpenMediaLibrary={(variationId) => {
            setMediaTarget({ kind: "variation", id: variationId });
            setView("media-library");
          }}
          onClose={() => {
            setMediaTarget({ kind: "post" });
            setView("form");
          }}
          disabled={isSessionLocked(session)}
        />
      </div>
    );
  }

  if (view === "media-library") {
    const forVariation = mediaTarget.kind === "variation";
    return (
      <div className="h-full w-full animate-in fade-in-50 slide-in-from-right-4 duration-200">
        <MediaLibraryView
          folders={mediaFolders}
          assets={mediaAssets}
          selectedAssetIds={
            forVariation
              ? (session.variations.find((v) => v.id === mediaTarget.id)?.assetIds ?? [])
              : session.visualAssetIds
          }
          // A variation carries images whatever the post type is; only the post
          // itself is bound by the PDF-means-one-PDF rule.
          restrictType={!forVariation && session.postType === "PDF" ? "pdf" : undefined}
          restrictReason="A PDF post carries one PDF, rendered as swipeable pages"
          onUpload={onUploadAssets}
          onClose={() => setView(forVariation ? "variations" : "form")}
          onSelectAsset={(assetId) => {
            if (forVariation) {
              onUpdate({
                variations: session.variations.map((v) =>
                  v.id === mediaTarget.id && !v.assetIds.includes(assetId)
                    ? { ...v, assetIds: [...v.assetIds, assetId] }
                    : v,
                ),
              });
              setView("variations");
              return;
            }
            if (!session.visualAssetIds.includes(assetId)) {
              onUpdate({
                visualAssetIds: [...session.visualAssetIds, assetId],
              });
            }
            setView("form");
          }}
        />
      </div>
    );
  }

  const sendReadinessIssues: string[] = [];
  if (!copyDraft.trim()) sendReadinessIssues.push("copy");
  const canApprove = sendReadinessIssues.length === 0;

  // Drafts that have not reached onUpdate yet — the save chip must not claim
  // "Autosaved" while these differ.
  const isDirty =
    titleDraft !== session.title ||
    copyDraft !== session.copy ||
    hashtagsDraft !== session.hashtags;

  const isCampaignLocked = isSessionLocked(session);
  const readyToSend = session.status === "approved" && sendReadinessIssues.length === 0;
  const needsResend = sessionNeedsResend(session);

  const statusMenu = (
    <StatusMenu
      status={session.status}
      onChange={(status) => handleUpdateWithPendingSave({ status })}
      disabled={isCampaignLocked}
      canApprove={canApprove}
    />
  );

  const unlockDialog = (
    <ConfirmDialog
      open={showUnlockDialog}
      onOpenChange={setShowUnlockDialog}
      icon={LockOpen}
      tone="violet"
      title="Unlock this post?"
      description="This moves it back to WIP so you can edit it. It stays sent to Wozku as-is until you re-approve and send the update. Nothing changes there until then."
      actions={[
        {
          label: "Cancel",
          tone: "outline",
          onClick: () => setShowUnlockDialog(false),
        },
        {
          label: "Unlock",
          icon: LockOpen,
          tone: "primary",
          onClick: () => {
            setShowUnlockDialog(false);
            onUpdate({ status: "wip" });
          },
        },
      ]}
    />
  );

  // The design style is chosen at the table level now, so the pane shows no
  // layout switcher of its own.
  const layoutToggle = null;

  // Both models get a composer layout now — the model decides WHICH, because
  // each was designed around one: Classic the split pane, Repository the canvas.
  const LayoutComponent = layout === "canvas" ? SessionCanvas : SessionComposer;
  return (
    <LayoutComponent
      // Keyed on the session too, not just the layout: the stagger is what
      // makes the sheet feel authored, and without a remount it only ever
      // played on the first open. Clicking row after row swapped the text in
      // place and the whole choreography went missing. Drafts live in THIS
      // component, so remounting the layout costs nothing but the animation.
      key={`${layout}:${session.id}`}
      session={session}
      mediaAssets={mediaAssets}
      isCampaignLocked={isCampaignLocked}
      titleDraft={titleDraft}
      onTitleChange={setTitleDraft}
      copyDraft={copyDraft}
      onCopyChange={setCopyDraft}
      hashtagsDraft={hashtagsDraft}
      onHashtagsChange={setHashtagsDraft}
      tagDraft={tagDraft}
      onTagDraftChange={setTagDraft}
      saveStatus={saveStatus}
      saveSource={saveSource}
      isDirty={isDirty}
      savePendingChanges={savePendingChanges}
      onUpdate={onUpdate}
      onUpdateWithPendingSave={handleUpdateWithPendingSave}
      onClose={onClose}
      onOpenFeedback={onOpenFeedback}
      isFeedbackOpen={isFeedbackOpen}
      onToggleFeedback={onToggleFeedback}
      onOpenSend={onOpenSend}
      onOpenMediaLibrary={() => setView("media-library")}
      onOpenVariations={() => {
        // Entering from the composer starts at the table, never inside
        // whichever variation last borrowed the media library.
        setMediaTarget({ kind: "post" });
        setView("variations");
      }}
      onRequestUnlock={() => setShowUnlockDialog(true)}
      sendReadinessIssues={sendReadinessIssues}
      readyToSend={readyToSend}
      needsResend={needsResend}
      statusMenu={statusMenu}
      layoutToggle={layoutToggle}
      unlockDialog={unlockDialog}
    />
  );
}

function StatusMenu({
  status,
  onChange,
  disabled,
  canApprove,
}: {
  status: SessionStatus;
  onChange: (status: SessionStatus) => void;
  disabled?: boolean;
  canApprove: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="gap-1.5 text-xs uppercase tracking-wide disabled:opacity-70"
          />
        }
      >
        {disabled ? (
          <Lock className="size-3" />
        ) : (
          <span
            className={cn(
              "size-1.5 rounded-full",
              status === "approved"
                ? "bg-emerald-500"
                : status === "wip"
                  ? "bg-violet-500"
                  : "bg-muted-foreground",
            )}
          />
        )}
        {status}
        {!disabled && <ChevronDown className="size-3.5" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onChange("draft")}>
          Draft
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange("wip")}>
          WIP
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!canApprove}
          title={!canApprove ? "Add copy and at least one image first" : undefined}
          onClick={() => canApprove && onChange("approved")}
        >
          Approved
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
