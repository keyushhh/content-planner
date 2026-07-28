"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy as CopyIcon,
  FileText,
  ImagePlus,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaAsset, MediaFolder, PostVariation } from "@/lib/types";
import { MediaThumb } from "./media-thumb";
import {
  COPY_LIMITS,
  LIMIT_ZONE,
  limitZone,
  SaveChip,
  Stagger,
} from "./session-composer";

const MAX_ASSETS = 3;

/** The budget the length column is measured against — the tightest one that matters. */
const PRIMARY_LIMIT = COPY_LIMITS[0];

interface VariationsViewProps {
  variations: PostVariation[];
  onChange: (variations: PostVariation[]) => void;
  mediaAssets: MediaAsset[];
  mediaFolders: MediaFolder[];
  /** Opens the media library, targeted at one variation. */
  onOpenMediaLibrary?: (variationId: string) => void;
  onClose: () => void;
  disabled?: boolean;
  /** The post's own copy and assets, shown as the first row for comparison. */
  primaryCopy?: string;
  primaryAssetIds?: string[];
  /** Set when returning from the media library, so the editor reopens where you left it. */
  initialVariationId?: string | null;
}

/**
 * Post variations, as a table.
 *
 * The old screen was a sidebar of cards next to one editor — which meant the
 * only way to compare two alternates was to click between them and remember.
 * Variations exist to be compared, so the list is now a real table: one row per
 * alternate, with the copy, the images and the length side by side, and the
 * post's own copy pinned at the top as the thing they are alternates OF.
 *
 * Long-form copy still cannot be written in a cell — a 3000-character LinkedIn
 * post inside a 200px column is a joke — so the table hands off to a full editor
 * for the writing, and keeps for itself what a table is good at: names, numbers
 * and comparison. Names are editable in place, because that is a cell-sized job.
 */
export function VariationsView({
  variations,
  onChange,
  mediaAssets,
  onOpenMediaLibrary,
  onClose,
  disabled,
  primaryCopy = "",
  primaryAssetIds = [],
  initialVariationId = null,
}: VariationsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(initialVariationId);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const current = variations.find((v) => v.id === editingId) ?? null;

  // Escape steps back one level — editor to table, table to the post — rather
  // than closing the whole pane and losing the post being edited.
  const leave = useCallback(() => {
    if (editingId) setEditingId(null);
    else onClose();
  }, [editingId, onClose]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      leave();
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [leave]);

  const q = searchQuery.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q
        ? variations.filter(
            (v) =>
              v.label.toLowerCase().includes(q) || v.copy.toLowerCase().includes(q),
          )
        : variations,
    [variations, q],
  );

  function patch(id: string, next: Partial<PostVariation>) {
    onChange(variations.map((v) => (v.id === id ? { ...v, ...next } : v)));
  }

  function addVariation(seedCopy = "") {
    const id = `var-${Date.now()}`;
    onChange([
      ...variations,
      {
        id,
        label: `Variation ${variations.length + 1}`,
        copy: seedCopy,
        assetIds: [],
      },
    ]);
    setSearchQuery("");
    setEditingId(id);
    return id;
  }

  function duplicate(v: PostVariation) {
    const id = `var-${Date.now()}`;
    onChange([
      ...variations,
      { ...v, id, label: `${v.label} (copy)` },
    ]);
  }

  function remove(id: string) {
    onChange(variations.filter((v) => v.id !== id));
    if (editingId === id) setEditingId(null);
  }

  // ---- Editor ---------------------------------------------------------------
  if (current) {
    return (
      <VariationEditor
        variation={current}
        index={variations.findIndex((v) => v.id === current.id)}
        total={variations.length}
        mediaAssets={mediaAssets}
        disabled={disabled}
        onBack={() => setEditingId(null)}
        onPatch={(next) => patch(current.id, next)}
        onRemove={() => remove(current.id)}
        onOpenMediaLibrary={
          onOpenMediaLibrary ? () => onOpenMediaLibrary(current.id) : undefined
        }
      />
    );
  }

  // ---- Table ----------------------------------------------------------------
  // Length gets 132px, not 104: the bar was 32px wide, which is too short to
  // compare two fills at a glance, and the number needs a column of its own so
  // the digits line up down the table instead of drifting with the bar.
  const grid = {
    "--cols-sm": "minmax(0,1.1fr) minmax(0,2fr) 76px",
    "--cols-lg": "minmax(0,1.1fr) minmax(0,2fr) 96px 132px 76px",
  } as React.CSSProperties;
  const gridClass = "grid-cols-[var(--cols-sm)] @[720px]:grid-cols-[var(--cols-lg)]";
  const wideOnly = "hidden @[720px]:block";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onClose}
            aria-label="Back to post"
            title="Back to post (Esc)"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-white/[0.06] hover:text-foreground active:scale-[0.96]"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-tight">Post variations</h2>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              Alternates of the primary copy · up to {MAX_ASSETS} images each
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {variations.length > 3 && (
            <div className="relative hidden @[560px]:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search…"
                aria-label="Search variations"
                className="h-8 w-[168px] rounded-full bg-white/[0.035] pl-8 pr-3 text-[12.5px] caret-violet-400 inset-ring-1 inset-ring-white/[0.08] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted-foreground/75 focus:bg-white/[0.06] focus:inset-ring-violet-400/50"
              />
            </div>
          )}
          {!disabled && (
            <button
              onClick={() => addVariation()}
              className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.04] px-3 text-[12.5px] font-medium inset-ring-1 inset-ring-white/[0.09] transition-[background-color,box-shadow,scale] duration-150 hover:bg-violet-500/12 hover:text-violet-100 hover:inset-ring-violet-400/40 active:scale-[0.97]"
            >
              <Plus className="size-3.5" />
              Add variation
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-8 items-center gap-1.5 rounded-full bg-violet-600 px-3.5 text-[12.5px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_16px_-8px_rgba(139,92,246,0.7)] inset-ring-1 inset-ring-white/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-[0.96]"
          >
            <Check className="size-3.5" />
            Done
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[radial-gradient(120%_80%_at_50%_0%,rgba(139,92,246,0.055),transparent_60%)] px-6 py-6 @container">
        {/* The card takes the whole height rather than floating in the top third:
            a table that stops halfway down a dark pane reads as a loading state. */}
        <Stagger
          index={0}
          className="mx-auto flex w-full max-w-[900px] flex-1 flex-col overflow-hidden rounded-[20px] bg-[oklch(0.185_0_0)] shadow-[0_2px_4px_rgba(0,0,0,0.3),0_28px_64px_-32px_rgba(0,0,0,1)] inset-ring-1 inset-ring-white/[0.08] @container"
        >
          <div
            aria-hidden
            className="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-white/[0.09] to-transparent"
          />

          <div
            style={grid}
            className={cn(
              "grid shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[oklch(0.205_0_0)] px-5 py-2.5 text-[11px] font-medium text-muted-foreground",
              gridClass,
            )}
          >
            {/* "Name", not "Variation" — the column also heads the post row. */}
            <span className="min-w-0">Name</span>
            <span className="min-w-0">Copy</span>
            <span className={cn("min-w-0", wideOnly)}>Images</span>
            <span className={cn("min-w-0", wideOnly)}>Length</span>
            <span aria-hidden />
          </div>

          {/* The primary post, pinned — kept in the same columns because the
              whole point is comparing against it. But it is NOT one of the
              alternates, so it gets its own section band rather than being the
              first row of the list: a row that behaves differently to every row
              under it has to LOOK like it belongs to something else first. */}
          <GroupBand>
            The post
            <span className="ml-auto font-normal normal-case tracking-normal text-muted-foreground/55">
              Edited on the post itself
            </span>
          </GroupBand>

          <div
            style={grid}
            className={cn(
              "grid cursor-default items-center gap-3 bg-violet-500/[0.055] px-5 py-3",
              gridClass,
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <FileText className="size-3.5 shrink-0 text-violet-300/80" />
              <span className="truncate text-[13px] font-semibold text-violet-50">
                Primary
              </span>
            </span>
            <span className="min-w-0 truncate text-[12.5px] text-foreground/70">
              {primaryCopy.trim() || (
                <span className="italic text-muted-foreground/60">No copy yet</span>
              )}
            </span>
            <span className={cn("min-w-0", wideOnly)}>
              <ThumbStack assetIds={primaryAssetIds} mediaAssets={mediaAssets} />
            </span>
            <span className={cn("min-w-0", wideOnly)}>
              <LengthCell count={primaryCopy.length} />
            </span>
            {/* The missing affordance: the reason this row does not open an
                editor is that its editor is the post, one step back. Say so. */}
            <span className="flex justify-end">
              <button
                onClick={onClose}
                title="Edit the primary copy on the post"
                className="flex h-7 items-center gap-1 rounded-full px-2.5 text-[11.5px] font-medium text-violet-200/80 transition-[background-color,color,scale] duration-150 hover:bg-violet-500/15 hover:text-violet-100 active:scale-[0.96]"
              >
                Edit
                <ArrowUpRight className="size-3.5" />
              </button>
            </span>
          </div>

          <GroupBand className="border-t border-white/[0.06]">
            Alternates
            {variations.length > 0 && (
              <span className="tabular-nums text-muted-foreground/55">
                {variations.length}
              </span>
            )}
          </GroupBand>

          <div className="flex min-h-0 flex-1 flex-col">
          {filtered.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 py-14 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-violet-500/10 text-violet-300 inset-ring-1 inset-ring-violet-400/25">
                <Layers className="size-4" />
              </span>
              <span className="mt-1 text-sm font-medium">
                {variations.length === 0 ? "No variations yet" : "No matches"}
              </span>
              <span className="max-w-[420px] text-xs text-muted-foreground text-pretty">
                {variations.length === 0
                  ? "A variation is an alternate take on the same post: different copy, different images, without touching the primary."
                  : `Nothing matches “${searchQuery.trim()}”.`}
              </span>
              {variations.length === 0 && !disabled && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => addVariation()}
                    className="flex h-9 items-center gap-1.5 rounded-full bg-violet-600 px-4 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_16px_-8px_rgba(139,92,246,0.7)] inset-ring-1 inset-ring-white/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-[0.96]"
                  >
                    <Plus className="size-4" />
                    Add a variation
                  </button>
                  {primaryCopy.trim() && (
                    // The commonest first move is "the primary, but shorter" —
                    // starting from a blank sheet makes you paste it in by hand.
                    <button
                      onClick={() => addVariation(primaryCopy)}
                      className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.04] px-3.5 text-[13px] font-medium inset-ring-1 inset-ring-white/[0.09] transition-[background-color,box-shadow,scale] duration-150 hover:bg-white/[0.07] active:scale-[0.97]"
                    >
                      <CopyIcon className="size-3.5" />
                      Start from the primary
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            filtered.map((v, i) => (
              <div
                key={v.id}
                style={grid}
                onClick={() => setEditingId(v.id)}
                className={cn(
                  "group grid cursor-pointer items-center gap-3 border-b border-white/[0.05] px-5 py-3 transition-colors duration-150 last:border-b-0 hover:bg-white/[0.035]",
                  gridClass,
                )}
              >
                <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
                  {renamingId === v.id ? (
                    <VariationNameEdit
                      initial={v.label}
                      onCommit={(label) => patch(v.id, { label: label || v.label })}
                      onDone={() => setRenamingId(null)}
                    />
                  ) : (
                    <button
                      onClick={() => !disabled && setRenamingId(v.id)}
                      title={disabled ? undefined : "Rename"}
                      className="group/name flex min-w-0 max-w-full items-center gap-1.5 text-left"
                    >
                      <span className="truncate text-[13px] font-medium">
                        {v.label || `Variation ${i + 1}`}
                      </span>
                      {!disabled && (
                        <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover/name:opacity-100" />
                      )}
                    </button>
                  )}
                </div>

                <div className="min-w-0 text-[12.5px] leading-snug text-muted-foreground">
                  {v.copy.trim() ? (
                    // Two lines at rest, four under the cursor. A 300-character
                    // alternate clamped to two lines shows you the hook and hides
                    // the thing you are actually comparing.
                    <span className="line-clamp-2 group-hover:line-clamp-4">{v.copy}</span>
                  ) : (
                    <span className="italic text-muted-foreground/60">
                      No copy yet
                    </span>
                  )}
                </div>

                <div className={cn("min-w-0", wideOnly)}>
                  <ThumbStack assetIds={v.assetIds} mediaAssets={mediaAssets} />
                </div>

                <div className={cn("min-w-0", wideOnly)}>
                  <LengthCell count={v.copy.length} />
                </div>

                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-end gap-0.5"
                >
                  {!disabled && (
                    <>
                      <RowAction
                        label="Duplicate"
                        onClick={() => duplicate(v)}
                        icon={CopyIcon}
                      />
                      <RowAction
                        label="Delete"
                        destructive
                        onClick={() => remove(v.id)}
                        icon={Trash2}
                      />
                    </>
                  )}
                </div>
              </div>
            ))
          )}

          {/* A quiet last row instead of a hard edge — the table ends where you
              would add the next thing to it. */}
          {filtered.length > 0 && !disabled && !q && (
            <button
              onClick={() => addVariation()}
              className="group flex items-center gap-2 px-5 py-3 text-left text-[12.5px] text-muted-foreground transition-colors duration-150 hover:bg-white/[0.03] hover:text-foreground"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-white/[0.05] transition-[background-color,color] duration-150 group-hover:bg-violet-500/20 group-hover:text-violet-200">
                <Plus className="size-3" />
              </span>
              Add variation
            </button>
          )}
          </div>

          {/* Anchors the bottom edge so the card reads as finished at any height. */}
          <div className="mt-auto flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.06] bg-[oklch(0.205_0_0)] px-5 py-2.5 text-[11px] text-muted-foreground">
            <span className="tabular-nums">
              {variations.length === 0
                ? "The post · no alternates yet"
                : `The post · ${variations.length} ${
                    variations.length === 1 ? "alternate" : "alternates"
                  }`}
              {q && filtered.length !== variations.length && (
                <span className="text-muted-foreground/60">
                  {" "}
                  · {filtered.length} shown
                </span>
              )}
            </span>
            <span className="hidden text-muted-foreground/60 @[560px]:block">
              Click an alternate to edit · Esc to go back
            </span>
          </div>
        </Stagger>
      </div>
    </div>
  );
}

/**
 * A section band inside the table. Two kinds of thing live in these columns —
 * the post, and alternates of it — and the band is what stops the reader
 * treating them as one list where the first item happens to be styled oddly.
 */
function GroupBand({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 bg-white/[0.012] px-5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground/75",
        className,
      )}
    >
      {children}
    </div>
  );
}

function RowAction({
  label,
  icon: Icon,
  destructive,
  onClick,
}: {
  label: string;
  icon: typeof CopyIcon;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{ transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
      className={cn(
        "flex size-8 translate-x-1.5 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-[opacity,translate,background-color,color,scale] duration-200 focus-visible:translate-x-0 focus-visible:opacity-100 active:scale-[0.94] group-hover:translate-x-0 group-hover:opacity-100",
        destructive
          ? "hover:bg-destructive/15 hover:text-destructive"
          : "hover:bg-white/[0.08] hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

/** Up to three overlapping thumbs, then a count. Reads as "how much art is here". */
function ThumbStack({
  assetIds,
  mediaAssets,
}: {
  assetIds: string[];
  mediaAssets: MediaAsset[];
}) {
  if (assetIds.length === 0) {
    return <span className="text-[11px] text-muted-foreground/50">None</span>;
  }
  return (
    <span className="flex items-center">
      {assetIds.slice(0, 3).map((id, i) => (
        <span
          key={id}
          className="size-7 shrink-0 overflow-hidden rounded-[7px] shadow-[0_1px_2px_rgba(0,0,0,0.35)] outline outline-1 -outline-offset-1 outline-white/10 ring-2 ring-[oklch(0.185_0_0)]"
          style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 3 - i }}
        >
          <MediaThumb
            compact
            assetId={id}
            type={mediaAssets.find((a) => a.id === id)?.type}
            url={mediaAssets.find((a) => a.id === id)?.url}
            name={mediaAssets.find((a) => a.id === id)?.name}
            className="size-full !rounded-[7px]"
          />
        </span>
      ))}
      {assetIds.length > 3 && (
        <span className="ml-1.5 text-[11px] tabular-nums text-muted-foreground">
          +{assetIds.length - 3}
        </span>
      )}
    </span>
  );
}

/**
 * Characters against the tightest platform budget, in the app's traffic light.
 *
 * The bar leads and the number sits in a fixed 34px well at the right, so the
 * digits form a straight column: comparing 346 against 1,204 is the entire
 * reason this column exists, and ragged numbers make you read instead of scan.
 */
function LengthCell({ count }: { count: number }) {
  const zone = limitZone(count, PRIMARY_LIMIT.limit);
  const pct = Math.min(100, (count / PRIMARY_LIMIT.limit) * 100);
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.09]">
        <span
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width] duration-300",
            LIMIT_ZONE[zone].bar,
          )}
          style={{ width: `${pct}%`, transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
        />
      </span>
      <span
        className={cn(
          "w-[34px] shrink-0 text-right text-[11.5px] tabular-nums",
          LIMIT_ZONE[zone].text,
        )}
      >
        {count}
      </span>
    </span>
  );
}

function VariationNameEdit({
  initial,
  onCommit,
  onDone,
}: {
  initial: string;
  onCommit: (value: string) => void;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => {
        onCommit(draft.trim());
        onDone();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onCommit(draft.trim());
          onDone();
        } else if (e.key === "Escape") {
          e.stopPropagation();
          onDone();
        }
      }}
      aria-label="Variation name"
      className="h-7 w-full rounded-md bg-white/[0.06] px-2 text-[13px] font-medium caret-violet-400 inset-ring-1 inset-ring-violet-400/50 outline-none"
    />
  );
}

/**
 * The writing surface for one variation — the same document sheet as the post
 * itself, so switching between them does not feel like changing application.
 */
function VariationEditor({
  variation,
  index,
  total,
  mediaAssets,
  disabled,
  onBack,
  onPatch,
  onRemove,
  onOpenMediaLibrary,
}: {
  variation: PostVariation;
  index: number;
  total: number;
  mediaAssets: MediaAsset[];
  disabled?: boolean;
  onBack: () => void;
  onPatch: (next: Partial<PostVariation>) => void;
  onRemove: () => void;
  onOpenMediaLibrary?: () => void;
}) {
  const [copyDraft, setCopyDraft] = useState(variation.copy);
  const [labelDraft, setLabelDraft] = useState(variation.label);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const isDirty =
    copyDraft !== variation.copy ||
    (labelDraft.trim().length > 0 && labelDraft.trim() !== variation.label);

  // Drafts belong to THIS variation; remounting on id change is what keeps them
  // from following you into the next row.
  const flush = useCallback(() => {
    const next: Partial<PostVariation> = {};
    if (copyDraft !== variation.copy) next.copy = copyDraft;
    if (labelDraft.trim() && labelDraft !== variation.label) next.label = labelDraft.trim();
    if (Object.keys(next).length === 0) return;
    onPatch(next);
    setSaveStatus("saving");
  }, [copyDraft, labelDraft, variation.copy, variation.label, onPatch]);

  // A "Saving…" that vanishes the same frame it appears reads as a glitch; the
  // beat is for the reader, not for the write, which already happened.
  useEffect(() => {
    if (saveStatus !== "saving") return;
    const t = setTimeout(() => setSaveStatus("saved"), 380);
    return () => clearTimeout(t);
  }, [saveStatus]);

  useEffect(() => {
    const interval = setInterval(flush, 30000);
    return () => clearInterval(interval);
  }, [flush]);

  // Escape unmounts this editor from the parent without going through back(),
  // so without a flush on the way out the last thing typed is simply lost. The
  // ref is what lets the cleanup run the LATEST flush and still fire only on
  // unmount, rather than on every keystroke.
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);
  useEffect(() => () => flushRef.current(), []);

  // ⌘S is the reflex the indicator's tooltip promises. Honour it rather than
  // letting the browser offer to save the page.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.key === "s" && (e.metaKey || e.ctrlKey))) return;
      e.preventDefault();
      flushRef.current();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const wordCount = copyDraft.trim() ? copyDraft.trim().split(/\s+/).length : 0;
  const hasAssets = variation.assetIds.length > 0;
  const canAddAsset = variation.assetIds.length < MAX_ASSETS;

  function back() {
    flush();
    onBack();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={back}
            aria-label="Back to all variations"
            title="Back to all variations (Esc)"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-white/[0.06] hover:text-foreground active:scale-[0.96]"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold tracking-tight">
              {labelDraft || `Variation ${index + 1}`}
            </h2>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              Alternate <span className="tabular-nums">{index + 1}</span> of{" "}
              <span className="tabular-nums">{total}</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {!disabled && (
            <button
              onClick={onRemove}
              className="flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-destructive/15 hover:text-destructive active:scale-[0.96]"
            >
              <Trash2 className="size-3.5" />
              Remove
            </button>
          )}
          {/* Not a Save button: the work is already safe, and a button that
              implies otherwise teaches people to fear closing the pane. The
              same chip as the composer, saying the same thing in the same
              place — one save model across the app, not two. */}
          {!disabled && (
            <SaveChip
              saveStatus={saveStatus}
              isDirty={isDirty}
              onClick={() => flush()}
            />
          )}
          <button
            onClick={back}
            className="flex h-8 items-center gap-1.5 rounded-full bg-violet-600 px-3.5 text-[12.5px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_16px_-8px_rgba(139,92,246,0.7)] inset-ring-1 inset-ring-white/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-[0.96]"
          >
            <Check className="size-3.5" />
            Done
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(120%_80%_at_50%_0%,rgba(139,92,246,0.055),transparent_60%)] @container">
        <div className="flex min-h-full items-start justify-center px-6 pb-12 pt-6">
          <Stagger
            index={0}
            className={cn(
              "flex w-full max-w-[760px] flex-col overflow-hidden rounded-[28px] transition-[filter,box-shadow,background-color] duration-500",
              disabled
                ? "bg-white/[0.018] shadow-[0_1px_3px_rgba(0,0,0,0.45)] saturate-50 inset-ring-1 inset-ring-white/[0.05]"
                : "bg-white/[0.028] shadow-[0_2px_4px_rgba(0,0,0,0.3),0_28px_64px_-32px_rgba(0,0,0,1)] inset-ring-1 inset-ring-white/[0.08]",
            )}
          >
            <div
              aria-hidden
              className="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-white/[0.09] to-transparent"
            />

            <div className="px-9 pb-7 pt-8">
              <input
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onBlur={flush}
                disabled={disabled}
                aria-label="Variation name"
                placeholder="Untitled variation"
                className="-mx-2 w-[calc(100%+1rem)] rounded-lg bg-transparent px-2 py-1 text-[22px] font-semibold leading-tight tracking-[-0.02em] caret-violet-400 outline-none transition-colors duration-150 hover:bg-white/[0.03] focus:bg-white/[0.045] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-transparent"
              />
            </div>

            <div className="flex flex-col border-t border-white/[0.06] transition-[background-color] duration-300 focus-within:bg-violet-500/[0.03]">
              <div className="flex min-h-11 items-center px-9 py-2">
                <label
                  htmlFor="variation-copy"
                  className="w-fit cursor-pointer text-[13px] font-medium text-muted-foreground"
                >
                  Alternate copy
                </label>
              </div>
              <textarea
                id="variation-copy"
                value={copyDraft}
                onChange={(e) => setCopyDraft(e.target.value)}
                onBlur={flush}
                disabled={disabled}
                placeholder="Write the alternate version…"
                className="block min-h-[220px] w-full resize-y bg-transparent px-9 pb-6 pt-1 text-[15px] leading-[1.7] caret-violet-400 outline-none placeholder:text-muted-foreground/75 disabled:cursor-not-allowed disabled:opacity-70"
              />
              <div className="px-9 pb-4 text-[11px] tabular-nums text-muted-foreground">
                {wordCount} {wordCount === 1 ? "word" : "words"}
                <span className="mx-1.5 text-muted-foreground/40">·</span>
                {copyDraft.length} characters
              </div>
            </div>

            <div
              className={cn(
                "grid grid-cols-1 gap-x-4 gap-y-3 border-t border-white/[0.06] px-9 py-4",
                "@[560px]:grid-cols-[132px_minmax(0,1fr)]",
                hasAssets ? "items-start" : "items-center",
              )}
            >
              <span
                className={cn(
                  "text-[13px] font-medium text-muted-foreground",
                  hasAssets && "@[560px]:pt-2",
                )}
              >
                Images
                {hasAssets && (
                  <span className="ml-1.5 tabular-nums text-muted-foreground/70">
                    {variation.assetIds.length}/{MAX_ASSETS}
                  </span>
                )}
              </span>

              <div
                className={cn(
                  "flex min-w-0 flex-wrap gap-2.5",
                  hasAssets ? "justify-start" : "@[560px]:justify-end",
                )}
              >
                {variation.assetIds.map((assetId) => (
                  <div
                    key={assetId}
                    className="group relative size-20 shrink-0 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.3)] outline outline-1 -outline-offset-1 outline-white/10"
                  >
                    <MediaThumb
                      assetId={assetId}
                      type={mediaAssets.find((a) => a.id === assetId)?.type}
                      url={mediaAssets.find((a) => a.id === assetId)?.url}
                      name={mediaAssets.find((a) => a.id === assetId)?.name}
                      className="size-full !rounded-[10px]"
                    />
                    {!disabled && (
                      <button
                        onClick={() =>
                          onPatch({
                            assetIds: variation.assetIds.filter((id) => id !== assetId),
                          })
                        }
                        aria-label="Remove image"
                        className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur-sm transition-[opacity,background-color,scale] duration-150 before:absolute before:-inset-1.5 before:content-[''] hover:bg-destructive focus-visible:opacity-100 active:scale-[0.96] group-hover:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                ))}

                {!disabled &&
                  canAddAsset &&
                  onOpenMediaLibrary &&
                  (hasAssets ? (
                    <button
                      onClick={() => {
                        flush();
                        onOpenMediaLibrary();
                      }}
                      title="Pick from Media Library"
                      aria-label="Add another image"
                      className="flex size-20 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.03] text-muted-foreground inset-ring-1 inset-ring-white/[0.08] transition-[background-color,box-shadow,color,scale] duration-200 hover:bg-violet-500/[0.08] hover:text-violet-300 hover:inset-ring-violet-400/40 active:scale-[0.97]"
                    >
                      <ImagePlus className="size-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        flush();
                        onOpenMediaLibrary();
                      }}
                      className="group flex items-center gap-2.5 rounded-full bg-white/[0.04] py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium inset-ring-1 inset-ring-white/[0.08] transition-[background-color,box-shadow,scale] duration-150 hover:bg-violet-500/10 hover:inset-ring-violet-400/40 active:scale-[0.97]"
                    >
                      <span className="flex size-6 items-center justify-center rounded-full bg-violet-500/15 text-violet-300 transition-transform duration-200 group-hover:scale-[1.08]">
                        <ImagePlus className="size-3.5" />
                      </span>
                      Add an image from the library
                    </button>
                  ))}
              </div>
            </div>
          </Stagger>
        </div>
      </div>
    </div>
  );
}
