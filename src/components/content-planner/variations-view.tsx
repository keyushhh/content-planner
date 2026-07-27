"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Plus,
  Trash2,
  Search,
  ImageIcon,
  ImagePlus,
  ArrowLeft,
  Check,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PostVariation, MediaAsset, MediaFolder } from "@/lib/types";
import { MediaThumb } from "./media-thumb";
import { Stagger } from "./session-composer";

const MAX_ASSETS = 3;

interface VariationsViewProps {
  variations: PostVariation[];
  onChange: (variations: PostVariation[]) => void;
  mediaAssets: MediaAsset[];
  mediaFolders: MediaFolder[];
  onOpenMediaLibrary?: () => void;
  onClose: () => void;
  disabled?: boolean;
}

export function VariationsView({
  variations,
  onChange,
  mediaAssets,
  onOpenMediaLibrary,
  onClose,
  disabled,
}: VariationsViewProps) {
  const [selectedId, setSelectedId] = useState<string>(variations[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");

  const currentVariation =
    variations.find((v) => v.id === selectedId) || variations[0];
  const activeId = currentVariation?.id;

  const [copyDraft, setCopyDraft] = useState(currentVariation?.copy || "");
  const [labelDraft, setLabelDraft] = useState(currentVariation?.label || "");

  useEffect(() => {
    setCopyDraft(currentVariation?.copy || "");
    setLabelDraft(currentVariation?.label || "");
  }, [currentVariation?.id, currentVariation?.copy, currentVariation?.label]);

  const saveCopyIfDirty = useCallback(() => {
    if (!currentVariation || !activeId) return;
    const copyChanged = copyDraft !== currentVariation.copy;
    const labelChanged = labelDraft !== currentVariation.label;
    if (!copyChanged && !labelChanged) return;
    onChange(
      variations.map((v) =>
        v.id === activeId
          ? { ...v, copy: copyDraft, label: labelDraft.trim() || v.label }
          : v,
      ),
    );
  }, [currentVariation, copyDraft, labelDraft, activeId, variations, onChange]);

  useEffect(() => {
    const interval = setInterval(saveCopyIfDirty, 30000);
    return () => clearInterval(interval);
  }, [saveCopyIfDirty]);

  const leave = useCallback(() => {
    saveCopyIfDirty();
    onClose();
  }, [saveCopyIfDirty, onClose]);

  // Escape returns to the composer rather than closing the whole pane.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      leave();
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [leave]);

  const filteredVariations = variations.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return v.label.toLowerCase().includes(q) || v.copy.toLowerCase().includes(q);
  });

  const handleAddVariation = () => {
    saveCopyIfDirty();
    const newId = `var-${Date.now()}`;
    onChange([
      ...variations,
      {
        id: newId,
        label: `Variation ${variations.length + 1}`,
        copy: "",
        assetIds: [],
      },
    ]);
    setSelectedId(newId);
    setSearchQuery("");
  };

  const handleRemoveVariation = (id: string) => {
    const next = variations.filter((v) => v.id !== id);
    onChange(next);
    if (activeId === id) {
      const removedIndex = variations.findIndex((v) => v.id === id);
      const nextActive = next[Math.max(0, removedIndex - 1)];
      setSelectedId(nextActive ? nextActive.id : "");
    }
  };

  const handleRemoveAssetFromCurrent = (assetId: string) => {
    if (!activeId) return;
    onChange(
      variations.map((v) =>
        v.id === activeId
          ? { ...v, assetIds: v.assetIds.filter((id) => id !== assetId) }
          : v,
      ),
    );
  };

  const wordCount = copyDraft.trim() ? copyDraft.trim().split(/\s+/).length : 0;
  const isEmpty = variations.length === 0;
  const hasAssets = (currentVariation?.assetIds.length ?? 0) > 0;
  const canAddAsset = (currentVariation?.assetIds.length ?? 0) < MAX_ASSETS;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={leave}
            aria-label="Back to post"
            title="Back to post (Esc)"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-white/[0.06] hover:text-foreground active:scale-[0.96]"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold tracking-tight">Post Variations</h2>
              <span className="rounded-full bg-violet-500/12 px-2 py-0.5 text-[11px] font-medium tabular-nums text-violet-200 inset-ring-1 inset-ring-violet-400/25">
                {variations.length} alternate{variations.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              Primary copy stays on the post · up to {MAX_ASSETS} images per variation
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={leave}
          className="h-8 shrink-0 gap-1.5 rounded-full bg-violet-600 px-3.5 text-sm text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_16px_-8px_rgba(139,92,246,0.7)] inset-ring-1 inset-ring-white/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-[0.96]"
        >
          <Check className="size-3.5" />
          Done
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[264px] shrink-0 flex-col gap-2.5 border-r border-white/[0.07] bg-black/[0.14] p-4">
          {variations.length > 2 && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search variations…"
                aria-label="Search variations"
                className="h-9 w-full rounded-[10px] bg-white/[0.04] pl-8 pr-3 text-xs caret-violet-400 inset-ring-1 inset-ring-white/[0.08] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted-foreground/75 focus:bg-white/[0.06] focus:inset-ring-violet-400/50"
              />
            </div>
          )}

          <button
            onClick={handleAddVariation}
            disabled={disabled}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] bg-white/[0.04] text-[13px] font-medium inset-ring-1 inset-ring-white/[0.08] transition-[background-color,box-shadow,scale] duration-150 hover:bg-violet-500/12 hover:text-violet-200 hover:inset-ring-violet-400/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-4" />
            Add variation
          </button>

          <div className="-mr-1 mt-0.5 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
            {filteredVariations.map((v, index) => {
              const isSelected = v.id === activeId;
              const preview = (isSelected ? copyDraft : v.copy).trim();
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    saveCopyIfDirty();
                    setSelectedId(v.id);
                  }}
                  aria-current={isSelected}
                  className={cn(
                    "group w-full rounded-xl px-3 py-2.5 text-left transition-[background-color,box-shadow,scale] duration-150 inset-ring-1 active:scale-[0.99]",
                    isSelected
                      ? "bg-violet-500/[0.12] inset-ring-violet-400/45"
                      : "bg-white/[0.025] inset-ring-white/[0.06] hover:bg-white/[0.05]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-xs font-medium",
                        isSelected ? "text-violet-200" : "text-foreground/90",
                      )}
                    >
                      {(isSelected ? labelDraft : v.label) || `Variation ${index + 1}`}
                    </span>
                    {v.assetIds.length > 0 && (
                      <span className="flex shrink-0 items-center gap-1 text-[10px] tabular-nums text-muted-foreground">
                        <ImageIcon className="size-3" />
                        {v.assetIds.length}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                    {preview || <span className="italic">No copy yet</span>}
                  </p>
                </button>
              );
            })}

            {variations.length > 0 && filteredVariations.length === 0 && (
              <p className="px-1 py-6 text-center text-xs text-muted-foreground text-pretty">
                Nothing matches &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </div>
        </aside>

        <main className="@container min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(120%_80%_at_50%_0%,rgba(139,92,246,0.055),transparent_60%)]">
          {currentVariation ? (
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
                <div className="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-white/[0.09] to-transparent" />

                <div className="flex flex-wrap items-start justify-between gap-3 px-9 pb-7 pt-8">
                  <div className="min-w-0 flex-1">
                    <input
                      value={labelDraft}
                      onChange={(e) => setLabelDraft(e.target.value)}
                      onBlur={saveCopyIfDirty}
                      disabled={disabled}
                      aria-label="Variation name"
                      placeholder="Untitled variation"
                      className="-mx-2 w-[calc(100%+1rem)] rounded-lg bg-transparent px-2 py-1 text-[22px] font-semibold leading-tight tracking-[-0.02em] caret-violet-400 outline-none transition-colors duration-150 hover:bg-white/[0.03] focus:bg-white/[0.045] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-transparent"
                    />
                    <p className="mt-2 text-[13px] text-muted-foreground">
                      Alternate {variations.findIndex((v) => v.id === activeId) + 1} of{" "}
                      <span className="tabular-nums">{variations.length}</span>
                    </p>
                  </div>

                  {!disabled && (
                    <button
                      onClick={() => handleRemoveVariation(currentVariation.id)}
                      className="flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-destructive/15 hover:text-destructive active:scale-[0.96]"
                    >
                      <Trash2 className="size-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="flex flex-col border-t border-white/[0.06] transition-[background-color,border-color] duration-300 focus-within:border-violet-400/45 focus-within:bg-violet-500/[0.022]">
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
                    onBlur={saveCopyIfDirty}
                    disabled={disabled}
                    placeholder="Write the alternate version…"
                    className="block min-h-[200px] w-full resize-y bg-transparent px-9 pb-6 pt-1 text-[15px] leading-[1.7] caret-violet-400 outline-none placeholder:text-muted-foreground/75 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                  <div className="px-9 pb-4 text-[11px] tabular-nums text-muted-foreground">
                    {wordCount} {wordCount === 1 ? "word" : "words"}
                    <span className="mx-1.5 text-muted-foreground/40">·</span>
                    {copyDraft.length} characters
                  </div>
                </div>

                {/* Mirrors the Assets section on the post: label left, one affordance
                    that opens the media library directly. */}
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
                        {currentVariation.assetIds.length}/{MAX_ASSETS}
                      </span>
                    )}
                  </span>

                  <div
                    className={cn(
                      "flex min-w-0 flex-wrap gap-2.5",
                      hasAssets ? "justify-start" : "@[560px]:justify-end",
                    )}
                  >
                    {currentVariation.assetIds.map((assetId) => {
                      const asset = mediaAssets.find((a) => a.id === assetId);
                      return (
                        <div
                          key={assetId}
                          className="group relative size-20 shrink-0 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.3)] outline outline-1 -outline-offset-1 outline-white/10"
                        >
                          <MediaThumb
                            assetId={assetId}
                            type={asset?.type}
                            className="size-full !rounded-[10px]"
                          />
                          {!disabled && (
                            <button
                              onClick={() => handleRemoveAssetFromCurrent(assetId)}
                              aria-label="Remove image"
                              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur-sm transition-[opacity,background-color,scale] duration-150 before:absolute before:-inset-1.5 before:content-[''] hover:bg-destructive focus-visible:opacity-100 active:scale-[0.96] group-hover:opacity-100"
                            >
                              <X className="size-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {!disabled && canAddAsset && onOpenMediaLibrary && (
                      hasAssets ? (
                        <button
                          onClick={onOpenMediaLibrary}
                          title="Pick from Media Library"
                          aria-label="Add another image"
                          className="flex size-20 shrink-0 items-center justify-center rounded-[10px] border border-dashed border-white/15 text-muted-foreground transition-[background-color,border-color,color,scale] duration-200 hover:border-violet-400/50 hover:bg-violet-500/[0.06] hover:text-violet-300 active:scale-[0.97]"
                        >
                          <ImagePlus className="size-5" />
                        </button>
                      ) : (
                        <button
                          onClick={onOpenMediaLibrary}
                          className="group flex items-center gap-2.5 rounded-full bg-white/[0.04] py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium inset-ring-1 inset-ring-white/[0.08] transition-[background-color,box-shadow,scale] duration-150 hover:bg-violet-500/10 hover:inset-ring-violet-400/40 active:scale-[0.97]"
                        >
                          <span className="flex size-6 items-center justify-center rounded-full bg-violet-500/15 text-violet-300 transition-transform duration-200 group-hover:scale-[1.08]">
                            <ImagePlus className="size-3.5" />
                          </span>
                          Add an image from the library
                        </button>
                      )
                    )}
                  </div>
                </div>

              </Stagger>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-300 inset-ring-1 inset-ring-violet-400/25">
                <Layers className="size-5" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold">
                {isEmpty ? "No variations yet" : "No variation selected"}
              </h3>
              <p className="mt-1.5 max-w-[340px] text-[13px] text-muted-foreground text-pretty">
                {isEmpty
                  ? "Variations let you test alternate copy and images without touching the primary post."
                  : "Pick one from the list to start editing."}
              </p>
              {isEmpty && !disabled && (
                <button
                  onClick={handleAddVariation}
                  className="mt-5 flex h-9 items-center gap-1.5 rounded-full bg-violet-600 px-4 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_16px_-8px_rgba(139,92,246,0.7)] inset-ring-1 inset-ring-white/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-[0.96]"
                >
                  <Plus className="size-4" />
                  Add your first variation
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
