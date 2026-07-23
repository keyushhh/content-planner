"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  UserPlus,
  UploadCloud,
  FolderOpen,
  Sparkles,
  AtSign,
  X,
  Check,
  Loader2,
  Save,
  ImageIcon,
  Frame,
  Repeat2,
  MessageCircle,
  Plus,
  Send,
  RefreshCw,
  ChevronsRight,
  AlertCircle,
  Lock,
  LockOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "./confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, isSessionLocked, sessionNeedsResend } from "@/lib/utils";
import { MediaLibraryView } from "./media-library-view";
import { MediaThumb } from "./media-thumb";
import type {
  Comment,
  MediaAsset,
  MediaFolder,
  Platform,
  PostType,
  Session,
  SessionStatus,
} from "@/lib/types";

const POST_TYPE_META: Record<PostType, { icon: typeof ImageIcon; label: string }> = {
  Image: { icon: ImageIcon, label: "Image" },
  Reshare: { icon: Repeat2, label: "Reshare" },
  Frames: { icon: Frame, label: "Frames" },
};
const POST_TYPES = Object.keys(POST_TYPE_META) as PostType[];

const PLATFORM_META: Record<
  Platform,
  { mark: string; label: string; color: string; locked?: boolean }
> = {
  linkedin: { mark: "in", label: "LinkedIn", color: "bg-[#0A66C2]", locked: true },
  instagram: { mark: "ig", label: "Instagram", color: "bg-pink-600" },
  facebook: { mark: "f", label: "Facebook", color: "bg-blue-600" },
  x: { mark: "x", label: "X", color: "bg-neutral-700" },
};
const PLATFORMS: Platform[] = ["linkedin"];

import { VariationsView } from "./variations-view";

interface SessionDetailPaneProps {
  session: Session;
  mediaFolders: MediaFolder[];
  mediaAssets: MediaAsset[];
  onUpdate: (patch: Partial<Session>) => void;
  onClose: () => void;
  onOpenDiscussion: (fieldLabel?: string) => void;
  isDiscussionOpen: boolean;
  onToggleDiscussion: () => void;
  onOpenSend: () => void;
  hidePlatforms?: boolean;
}

export function SessionDetailPane({
  session,
  mediaFolders,
  mediaAssets,
  onUpdate,
  onClose,
  onOpenDiscussion,
  isDiscussionOpen,
  onToggleDiscussion,
  onOpenSend,
  hidePlatforms = false,
}: SessionDetailPaneProps) {
  const [view, setView] = useState<"form" | "media-library" | "variations">("form");
  const [variationDraft, setVariationDraft] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaveStatus("saved");
    }, 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.updatedAt]);

  useEffect(() => {
    skipNextSave.current = true;
    setSaveStatus("idle");
  }, [session.id]);

  if (view === "variations") {
    return (
      <div className="h-full w-full animate-in fade-in-50 slide-in-from-right-4 duration-200">
        <VariationsView
          variations={session.variations}
          onChange={(variations) => onUpdate({ variations })}
          mediaAssets={mediaAssets}
          mediaFolders={mediaFolders}
          onOpenMediaLibrary={() => setView("media-library")}
          onClose={() => setView("form")}
          disabled={isSessionLocked(session)}
        />
      </div>
    );
  }

  if (view === "media-library") {
    return (
      <div className="h-full w-full animate-in fade-in-50 slide-in-from-right-4 duration-200">
        <MediaLibraryView
          folders={mediaFolders}
          assets={mediaAssets}
          selectedAssetIds={session.visualAssetIds}
          onClose={() => setView("form")}
          onSelectAsset={(assetId) => {
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

  const commentsFor = (fieldLabel: string) =>
    session.comments.filter((c) => c.fieldLabel === fieldLabel);

  const sendReadinessIssues: string[] = [];
  if (!session.copy.trim()) sendReadinessIssues.push("copy");
  if (session.visualAssetIds.length === 0) sendReadinessIssues.push("at least one image");
  const canApprove = sendReadinessIssues.length === 0;

  const isCampaignLocked = isSessionLocked(session);
  const readyToSend = session.status === "approved" && sendReadinessIssues.length === 0;
  const needsResend = sessionNeedsResend(session);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={() => {
          onUpdate({
            visualAssetIds: [...session.visualAssetIds, `device-upload-${Date.now()}`],
          });
        }}
      />

      <div className="flex shrink-0 items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <StatusMenu
            status={session.status}
            onChange={(status) => onUpdate({ status })}
            disabled={isCampaignLocked}
            canApprove={canApprove}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {readyToSend && (
            <Button
              size="sm"
              className="gap-1.5 bg-violet-600 text-sm text-white hover:bg-violet-500"
              onClick={onOpenSend}
            >
              {needsResend ? (
                <RefreshCw className="size-3.5" />
              ) : (
                <Send className="size-3.5" />
              )}
              {needsResend ? "Send Update" : "Send to Campaign"}
            </Button>
          )}
          <button
            onClick={() => setSaveStatus("saved")}
            title="Click to force manual save"
            className="flex items-center gap-1.5 rounded-full border border-border/60 bg-accent/30 px-3 py-1.5 text-xs transition-colors hover:bg-accent hover:border-border"
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="size-3 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Saving…</span>
              </>
            ) : (
              <>
                <Check className="size-3 text-emerald-400" />
                <span className="text-muted-foreground">Autosaved</span>
              </>
            )}
          </button>
          <Button
            size="sm"
            variant={isDiscussionOpen ? "secondary" : "ghost"}
            className="relative gap-1.5 text-sm text-muted-foreground data-[active=true]:text-foreground"
            data-active={isDiscussionOpen}
            onClick={onToggleDiscussion}
          >
            <MessageCircle className="size-3.5" />
            {session.comments.length > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {session.comments.length}
              </span>
            )}
          </Button>
          <div className="mx-1 h-6 w-px bg-border" />
          <button
            onClick={onClose}
            aria-label="Save and collapse session"
            title="Save and collapse"
            className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <ChevronsRight className="size-4" />
          </button>
        </div>
      </div>

      {isCampaignLocked && (
        <div className="flex items-center justify-between gap-3 border-b border-violet-500/20 bg-violet-500/10 px-6 py-2.5 text-sm text-violet-300">
          <span className="flex items-center gap-2">
            <Lock className="size-4 shrink-0" />
            This post is live on Wozku, so it&rsquo;s locked from editing.
          </span>
          <button
            onClick={() => setShowUnlockDialog(true)}
            className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-violet-300 underline-offset-2 hover:underline"
          >
            Unlock to Edit
          </button>
        </div>
      )}

      {!isCampaignLocked && session.status === "approved" && sendReadinessIssues.length > 0 && (
        <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-6 py-2.5 text-sm text-amber-400">
          <AlertCircle className="size-4 shrink-0" />
          <span>
            Add {sendReadinessIssues.join(" and ")} before this post can be sent.
          </span>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-6">
          <input
            value={session.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            disabled={isCampaignLocked}
            className="w-full bg-transparent text-3xl font-bold tracking-tight outline-none disabled:cursor-not-allowed disabled:opacity-70"
          />
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="size-5">
              <AvatarFallback className="text-[9px]">
                {session.lastEditedBy?.name?.[0] ?? "?"}
              </AvatarFallback>
            </Avatar>
            <span>{session.lastEditedBy?.name ?? "Unknown"}</span>
            <span>·</span>
            <span>
              Edited{" "}
              {new Date(session.updatedAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <Field
            label="Post Type"
            comments={commentsFor("Post Type")}
            onComment={() => onOpenDiscussion("Post Type")}
          >
            <div className="grid grid-cols-3 gap-2.5">
              {POST_TYPES.map((t) => {
                const meta = POST_TYPE_META[t];
                const Icon = meta.icon;
                const active = session.postType === t;
                return (
                  <button
                    key={t}
                    disabled={isCampaignLocked}
                    onClick={() => onUpdate({ postType: t })}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border px-3 py-3.5 transition-all disabled:cursor-not-allowed disabled:opacity-50",
                      active
                        ? "border-violet-500/70 bg-violet-500/[0.08] shadow-[0_0_0_1px_#8b5cf6_inset]"
                        : "border-border text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("size-5", active && "text-violet-400")} />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        active && "text-foreground",
                      )}
                    >
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

        {!hidePlatforms && (
          <Field
            label="Platforms"
            comments={commentsFor("Platforms")}
            onComment={() => onOpenDiscussion("Platforms")}
          >
            <div className="overflow-hidden rounded-xl border border-border">
              {PLATFORMS.map((id, i) => {
                const meta = PLATFORM_META[id];
                const active = session.platforms.includes(id);
                return (
                  <div
                    key={id}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3.5 py-3",
                      i > 0 && "border-t border-border",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white",
                          meta.color,
                        )}
                      >
                        {meta.mark}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{meta.label}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          Share this post to {meta.label}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (meta.locked || isCampaignLocked) return;
                        onUpdate({
                          platforms: active
                            ? session.platforms.filter((x) => x !== id)
                            : [...session.platforms, id],
                        });
                      }}
                      disabled={meta.locked || isCampaignLocked}
                      title={meta.locked ? `${meta.label} is required and can't be turned off` : undefined}
                      className={cn(
                        "flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors",
                        active ? "bg-emerald-500/90" : "bg-muted",
                        meta.locked || isCampaignLocked ? "cursor-not-allowed opacity-40" : "cursor-pointer",
                      )}
                      aria-pressed={active}
                      aria-label={`Toggle ${meta.label}`}
                    >
                      <span
                        className={cn(
                          "size-5 rounded-full bg-white shadow transition-transform",
                          active ? "translate-x-4" : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              More platforms can be connected here as they become available.
            </p>
          </Field>
        )}

        <Field
            label="Visual Assets"
            required
            comments={commentsFor("Visual Assets")}
            onComment={() => onOpenDiscussion("Visual Assets")}
          >
            {session.visualAssetIds.length === 0 ? (
              <Popover>
                <PopoverTrigger
                  disabled={isCampaignLocked}
                  className="flex w-full items-center gap-3 rounded-xl border border-dashed border-violet-500/50 px-4 py-3.5 text-left transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-400">
                    <UploadCloud className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      Add an image or video
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Upload from your device or pick from Media Library
                    </span>
                  </span>
                </PopoverTrigger>
                <PopoverContent align="center" className="w-64 p-1.5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-accent"
                  >
                    <UploadCloud className="size-4" />
                    Upload from Device
                  </button>
                  <button
                    onClick={() => setView("media-library")}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-accent"
                  >
                    <FolderOpen className="size-4" />
                    Choose from Media Library
                  </button>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="flex flex-wrap gap-3">
                {session.visualAssetIds.map((assetId) => (
                  <div
                    key={assetId}
                    className="group relative size-24 shrink-0 rounded-xl ring-1 ring-border/80 shadow-xs"
                  >
                    <MediaThumb
                      assetId={assetId}
                      type={mediaAssets.find((a) => a.id === assetId)?.type}
                      className="size-full"
                    />
                    {!isCampaignLocked && (
                      <button
                        onClick={() =>
                          onUpdate({
                            visualAssetIds: session.visualAssetIds.filter(
                              (id) => id !== assetId,
                            ),
                          })
                        }
                        aria-label="Remove asset"
                        className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
                {!isCampaignLocked && (
                <Popover>
                  <PopoverTrigger className="flex size-24 shrink-0 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-violet-500/50 hover:bg-accent/20 hover:text-violet-400">
                    <UploadCloud className="size-5" />
                  </PopoverTrigger>
                  <PopoverContent align="center" className="w-64 p-1.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-accent"
                    >
                      <UploadCloud className="size-4" />
                      Upload from Device
                    </button>
                    <button
                      onClick={() => setView("media-library")}
                      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-accent"
                    >
                      <FolderOpen className="size-4" />
                      Choose from Media Library
                    </button>
                  </PopoverContent>
                </Popover>
                )}
              </div>
            )}
          </Field>

        <Field
            label="Copy"
            comments={commentsFor("Copy")}
            onComment={() => onOpenDiscussion("Copy")}
            action={
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:underline">
                  <AtSign className="size-3.5" />
                  Add Mentions
                </button>
                <button className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white">
                  <Sparkles className="size-3.5" />
                  AI Assist
                </button>
              </div>
            }
          >
            <Textarea
              value={session.copy}
              onChange={(e) => onUpdate({ copy: e.target.value })}
              placeholder="Post content..."
              disabled={isCampaignLocked}
              className="min-h-32 resize-y"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-accent/20 px-3 py-2 text-xs">
              <span className="font-mono text-muted-foreground">
                {session.copy.length} characters
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border",
                    session.copy.length > 280
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                      : "border-border/60 text-muted-foreground"
                  )}
                >
                  X: {session.copy.length}/280
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border",
                    session.copy.length > 3000
                      ? "border-red-500/50 bg-red-500/10 text-red-400"
                      : "border-border/60 text-muted-foreground"
                  )}
                >
                  LinkedIn: {session.copy.length}/3000
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border",
                    session.copy.length > 2200
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                      : "border-border/60 text-muted-foreground"
                  )}
                >
                  IG: {session.copy.length}/2200
                </span>
              </div>
            </div>
          </Field>

        <Field
            label="Post Variations"
            comments={commentsFor("Post Variations")}
            onComment={() => onOpenDiscussion("Post Variations")}
            action={
              session.variations.length > 0 ? (
                <button
                  onClick={() => setView("variations")}
                  className="text-xs font-semibold text-violet-400 hover:text-violet-300 hover:underline"
                >
                  Manage
                </button>
              ) : undefined
            }
          >
            {session.variations.length === 0 ? (
              <div className="relative">
                <Input
                  value={variationDraft}
                  onChange={(e) => setVariationDraft(e.target.value)}
                  disabled={isCampaignLocked}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && variationDraft.trim()) {
                      e.preventDefault();
                      onUpdate({
                        variations: [
                          ...session.variations,
                          {
                            id: `var-${Date.now()}`,
                            label: `Variation ${session.variations.length + 1}`,
                            copy: variationDraft.trim(),
                            assetIds: [],
                          },
                        ],
                      });
                      setVariationDraft("");
                    }
                  }}
                  placeholder="Add alternate post content..."
                  className="h-10 w-full rounded-lg border-border bg-transparent pr-16 pl-3.5 text-sm"
                />
                <button
                  disabled={!variationDraft.trim() || isCampaignLocked}
                  onClick={() => {
                    if (!variationDraft.trim()) return;
                    onUpdate({
                      variations: [
                        ...session.variations,
                        {
                          id: `var-${Date.now()}`,
                          label: `Variation ${session.variations.length + 1}`,
                          copy: variationDraft.trim(),
                          assetIds: [],
                        },
                      ],
                    });
                    setVariationDraft("");
                  }}
                  className={cn(
                    "absolute top-1.5 right-1.5 flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors disabled:opacity-40",
                    variationDraft.trim()
                      ? "bg-violet-600 text-white hover:bg-violet-500"
                      : "bg-accent text-foreground"
                  )}
                >
                  <Plus className="size-3.5" />
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setView("variations")}
                className="group w-full rounded-xl border border-border/80 bg-accent/15 p-4 text-left transition-all hover:border-violet-500/50 hover:bg-accent/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {session.variations.length} variation{session.variations.length === 1 ? "" : "s"}
                  </span>
                  <span className="text-xs text-muted-foreground group-hover:text-violet-300">
                    Click to manage
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">#1</span>
                  <span className="truncate">
                    {session.variations[0]?.copy || "Empty variation copy"}
                  </span>
                </div>
              </button>
            )}
          </Field>

        <Field label="Hashtags" comments={commentsFor("Hashtags")} onComment={() => onOpenDiscussion("Hashtags")}>
          <div className="space-y-2">
            <Input
              value={session.hashtags}
              onChange={(e) => onUpdate({ hashtags: e.target.value })}
              placeholder="#product #launch"
              disabled={isCampaignLocked}
              className="h-10 w-full rounded-lg px-3.5 text-sm"
            />
            {!isCampaignLocked && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span className="text-[11px] font-medium text-muted-foreground/60">Suggested:</span>
                {["#product", "#launch", "#giveaway", "#contest", "#announcement", "#marketing", "#branding"]
                  .filter((ht) => !session.hashtags.includes(ht))
                  .slice(0, 5)
                  .map((ht) => (
                    <button
                      key={ht}
                      type="button"
                      onClick={() => {
                        const trimmed = session.hashtags.trim();
                        const next = trimmed ? `${trimmed} ${ht}` : ht;
                        onUpdate({ hashtags: next });
                      }}
                      className="rounded-md border border-border/60 bg-accent/20 px-2 py-0.5 text-[11px] font-medium transition-colors hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-300"
                    >
                      +{ht}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </Field>

        <Field label="Tags">
          <div className="space-y-2">
            <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-border bg-transparent p-1.5 focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/20">
              {session.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex h-6.5 items-center gap-1.5 rounded-md bg-accent/80 px-2.5 py-0 text-xs font-medium"
                >
                  {tag}
                  {!isCampaignLocked && (
                    <button
                      onClick={() =>
                        onUpdate({ tags: session.tags.filter((t) => t !== tag) })
                      }
                      aria-label={`Remove tag ${tag}`}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </span>
              ))}
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                disabled={isCampaignLocked}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === ",") && tagDraft.trim()) {
                    e.preventDefault();
                    const next = tagDraft.trim().toLowerCase();
                    if (!session.tags.includes(next)) {
                      onUpdate({ tags: [...session.tags, next] });
                    }
                    setTagDraft("");
                  } else if (e.key === "Backspace" && !tagDraft && session.tags.length > 0) {
                    onUpdate({ tags: session.tags.slice(0, -1) });
                  }
                }}
                placeholder={session.tags.length === 0 ? "Add tags (location, topic…)" : ""}
                className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
              />
            </div>
            {!isCampaignLocked && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span className="text-[11px] font-medium text-muted-foreground/60">Suggested:</span>
                {["social", "product", "launch", "giveaway", "contest", "email", "announcement"]
                  .filter((t) => !session.tags.includes(t))
                  .slice(0, 5)
                  .map((tag) => (
                    <button
                      key={tag}
                      onClick={() => onUpdate({ tags: [...session.tags, tag] })}
                      className="rounded-md border border-border/60 bg-accent/20 px-2 py-0.5 text-[11px] font-medium transition-colors hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-300"
                    >
                      +{tag}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </Field>
      </div>

      <ConfirmDialog
        open={showUnlockDialog}
        onOpenChange={setShowUnlockDialog}
        icon={LockOpen}
        tone="violet"
        title="Unlock this post?"
        description="This moves it back to WIP so you can edit it. It stays sent to Wozku as-is until you re-approve and send the update — nothing changes there until then."
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
    </div>
  );
}

function SaveIndicator({ status }: { status: "idle" | "saving" | "saved" }) {
  if (status === "idle") {
    return (
      <span className="text-xs text-muted-foreground">Autosave on</span>
    );
  }
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Saving…
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
      <Check className="size-3" />
      Saved
    </span>
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

function Field({
  label,
  required,
  action,
  comments,
  onComment,
  children,
}: {
  label: string;
  required?: boolean;
  action?: React.ReactNode;
  comments?: Comment[];
  onComment?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="group/field mb-7">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          {required && (
            <span className="text-xs font-medium text-violet-400">required</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {action}
          {onComment && (
            <FieldCommentIndicator comments={comments ?? []} onClick={onComment} />
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function FieldCommentIndicator({
  comments,
  onClick,
}: {
  comments: Comment[];
  onClick: () => void;
}) {
  if (comments.length === 0) {
    return (
      <button
        onClick={onClick}
        aria-label="Add comment"
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/40 transition-colors hover:bg-accent/60 hover:text-muted-foreground"
      >
        <MessageCircle className="size-3.5" />
      </button>
    );
  }
  const lastAuthor = comments[comments.length - 1].author;
  return (
    <button
      onClick={onClick}
      aria-label={`${comments.length} comments`}
      className="relative flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
    >
      <Avatar className="size-5">
        <AvatarFallback className="text-[9px]">
          {lastAuthor.name[0]}
        </AvatarFallback>
      </Avatar>
      <span className="absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full bg-violet-500 text-[8px] font-semibold text-white ring-2 ring-background">
        {comments.length}
      </span>
    </button>
  );
}
