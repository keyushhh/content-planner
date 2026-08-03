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
import {
  blockedReason,
  canApprove as isApprovable,
  missingRequired,
  postReadiness,
} from "@/lib/readiness";
import { STATUS_TONE } from "./status-badge";
import { Hint } from "@/components/ui/tooltip";
import { mentionsIn } from "@/lib/mentions";
import { MediaLibraryView } from "./media-library-view";
import { SessionComposer } from "./session-composer";
import { SessionCanvas } from "./session-canvas";

export type ComposerLayout = "split" | "canvas";
export const LAYOUT_STORAGE_KEY = "content-planner:composer-layout";

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
  const [mediaTarget, setMediaTarget] = useState<
    { kind: "post" } | { kind: "variation"; id: string }
  >({ kind: "post" });
  const [tagDraft, setTagDraft] = useState("");
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const layout = composerLayout ?? readStoredLayout();

  const [titleDraft, setTitleDraft] = useState(session.title);
  const [copyDraft, setCopyDraft] = useState(session.copy);
  const [hashtagsDraft, setHashtagsDraft] = useState(session.hashtags);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [saveSource, setSaveSource] = useState<"blur" | "timer" | "instant" | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitleDraft(session.title);
    setCopyDraft(session.copy);
    setHashtagsDraft(session.hashtags);
    setSaveStatus("idle");
    setSaveSource(null);
  }, [session.id]);

  const savePendingChanges = useCallback(
    (source: "blur" | "timer" | "instant" = "blur") => {
      const patch: Partial<Session> = {};
      if (titleDraft !== session.title) patch.title = titleDraft;
      if (copyDraft !== session.copy) {
        patch.copy = copyDraft;
        // Keep the stored list matching what's actually written, however it got there.
        patch.mentionedAccountIds = mentionsIn(copyDraft).map((a) => a.id);
      }
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

  useEffect(() => {
    const interval = setInterval(() => {
      savePendingChanges("timer");
    }, 30000);
    return () => clearInterval(interval);
  }, [savePendingChanges]);

  const handleUpdateWithPendingSave = (patch: Partial<Session>) => {
    const draftPatch: Partial<Session> = {};
    if (titleDraft !== session.title) draftPatch.title = titleDraft;
    if (copyDraft !== session.copy) {
      draftPatch.copy = copyDraft;
      draftPatch.mentionedAccountIds = mentionsIn(copyDraft).map((a) => a.id);
    }
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

  const readiness = postReadiness(session, copyDraft);
  const sendReadinessIssues = missingRequired(readiness).map((item) => item.label);
  const canApprove = isApprovable(readiness);

  const isDirty =
    titleDraft !== session.title ||
    copyDraft !== session.copy ||
    hashtagsDraft !== session.hashtags;

  const isCampaignLocked = isSessionLocked(session);
  /* Approval is the gate; posts approved before the asset rule stay sendable. */
  const readyToSend = session.status === "approved";
  const needsResend = sessionNeedsResend(session);

  const statusMenu = (
    <StatusMenu
      status={session.status}
      onChange={(status) => handleUpdateWithPendingSave({ status })}
      disabled={isCampaignLocked}
      canApprove={canApprove}
      blockedReason={blockedReason(readiness)}
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

  const layoutToggle = null;

  const LayoutComponent = layout === "canvas" ? SessionCanvas : SessionComposer;
  return (
    <LayoutComponent
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
  blockedReason,
}: {
  status: SessionStatus;
  onChange: (status: SessionStatus) => void;
  disabled?: boolean;
  canApprove: boolean;
  blockedReason: string;
}) {
  const trigger = (
    <DropdownMenuTrigger
      disabled={disabled}
      render={
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1.5 text-xs font-(family-name:--font-label) uppercase tracking-wide disabled:opacity-70"
        />
      }
    >
      {disabled ? (
        <Lock className="size-3" />
      ) : (
        <span className={cn("size-1.5 rounded-(--r-round)", STATUS_TONE[status].dot)} />
      )}
      {STATUS_TONE[status].label}
      {!disabled && <ChevronDown className="size-3.5" />}
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      <Hint
        side="bottom"
        label={
          disabled
            ? "Live on Wozku and locked from editing. Unlock to edit."
            : STATUS_TONE[status].meaning
        }
      >
        <span className="inline-flex">{trigger}</span>
      </Hint>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onChange("draft")}>
          Draft
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange("wip")}>
          WIP
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!canApprove}
          onClick={() => canApprove && onChange("approved")}
          className={cn(!canApprove && "flex-col items-start gap-0.5")}
        >
          Approved
          {!canApprove && (
            <span className="text-[11px] text-muted-foreground">{blockedReason}</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
