"use client";

import { useState } from "react";
import { Check, UploadCloud, X, Layers, Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MediaThumb } from "./media-thumb";
import type { MediaAsset, MediaAssetType, MediaFolder } from "@/lib/types";

interface MediaLibraryViewProps {
  folders: MediaFolder[];
  assets: MediaAsset[];
  selectedAssetIds?: string[];
  onSelectAsset: (assetId: string) => void;
  onClose: () => void;
  /**
   * Locks the library to one asset type. A PDF post cannot take an image, so
   * the other formats are not shown as options that will be rejected later —
   * they are simply not offered.
   */
  restrictType?: MediaAssetType;
  /** What the restriction is for, so the notice explains itself. */
  restrictReason?: string;
  /**
   * Puts picked files into the library and hands back their ids. Without it the
   * upload tile is decoration — which is what it used to be: its onChange threw
   * the file away and closed the dialog.
   */
  onUpload?: (files: File[], folderId: string) => string[];
}

const ALL_MEDIA = "__all__";

const TYPE_FILTERS: { value: MediaAssetType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "image", label: "Images" },
  { value: "embed", label: "Embeds" },
  { value: "pdf", label: "PDFs" },
];

export function MediaLibraryView({
  folders,
  assets,
  selectedAssetIds = [],
  onSelectAsset,
  onClose,
  restrictType,
  restrictReason,
  onUpload,
}: MediaLibraryViewProps) {
  // Default to the cross-folder view so embeds/PDFs are visible immediately,
  // instead of being hidden inside whichever single folder they were filed under.
  const [activeFolderId, setActiveFolderId] = useState<string>(ALL_MEDIA);
  const [activeType, setActiveType] = useState<MediaAssetType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Narrowed before anything else, so the folder counts and the "All Media"
  // total describe what you can actually pick — a collection listing 12 assets
  // that opens onto 2 usable ones is a lie the sidebar told you.
  const pool = restrictType ? assets.filter((a) => a.type === restrictType) : assets;

  const activeFolder = folders.find((f) => f.id === activeFolderId);
  const scopedAssets =
    activeFolderId === ALL_MEDIA
      ? pool
      : pool.filter((a) => a.folderId === activeFolderId);
  const visibleAssets = scopedAssets.filter((a) => {
    const matchesType = activeType === "all" || a.type === activeType;
    const matchesSearch = searchQuery.trim() === "" || a.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesType && matchesSearch;
  });

  return (
    <div className="flex h-full min-h-0">
      <div className="flex w-56 shrink-0 flex-col border-r border-border">
        <div className="px-4 py-3.5 border-b border-border">
          <span className="text-sm font-semibold">Media Library</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => setActiveFolderId(ALL_MEDIA)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm mb-1.5 transition-colors",
              activeFolderId === ALL_MEDIA
                ? "border border-violet-500/50 bg-violet-500/10 text-violet-300 font-medium"
                : "text-muted-foreground hover:bg-accent/50",
            )}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Layers className="size-3.5" />
              All Media
            </span>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px]",
                activeFolderId === ALL_MEDIA ? "bg-violet-500/20 text-violet-300" : "bg-accent",
              )}
            >
              {pool.length}
            </span>
          </button>

          <div className="px-2 pb-1.5 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Collections
          </div>
          {folders.map((folder) => {
            const count = pool.filter((a) => a.folderId === folder.id).length;
            const isActive = folder.id === activeFolderId;
            return (
              <button
                key={folder.id}
                onClick={() => setActiveFolderId(folder.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm mb-0.5 transition-colors",
                  isActive
                    ? "border border-violet-500/50 bg-violet-500/10 text-violet-300 font-medium"
                    : "text-muted-foreground hover:bg-accent/50",
                )}
              >
                <span className="truncate">{folder.name}</span>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px]",
                    isActive ? "bg-violet-500/20 text-violet-300" : "bg-accent",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-border">
          <span className="font-semibold text-sm shrink-0">
            {activeFolderId === ALL_MEDIA ? "All Media" : activeFolder?.name}
          </span>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="h-8 pl-8 text-xs bg-accent/30 border-border/60 focus:border-violet-500/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent/50 shrink-0 text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </button>
        </div>

        {/* When the type is fixed, the filter row would offer three choices that
            all lead nowhere. It states the constraint instead. */}
        {restrictType ? (
          <div className="flex items-center gap-2 border-b border-border/60 px-5 py-2.5 text-xs text-muted-foreground">
            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 font-medium uppercase tracking-wide text-amber-300">
              {restrictType}
            </span>
            {restrictReason ?? `Only ${restrictType.toUpperCase()}s can be picked here`}
          </div>
        ) : (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 px-5 py-2.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveType(f.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                activeType === f.value
                  ? "bg-violet-600 text-white"
                  : "bg-accent text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-center hover:border-primary/50 hover:bg-accent/20">
              <input
                type="file"
                multiple={restrictType !== "pdf"}
                accept={restrictType === "pdf" ? "application/pdf" : "image/*,application/pdf"}
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  // Same input twice in a row fires nothing unless it is cleared
                  e.target.value = "";
                  if (files.length === 0) return;
                  if (!onUpload) {
                    onClose();
                    return;
                  }
                  // Filed into the folder you are looking at, not a default one:
                  // the upload lands where you were already working. "All Media"
                  // is a view, not a folder, so it falls back to the first real one.
                  const targetFolder =
                    activeFolderId === ALL_MEDIA ? folders[0]?.id ?? "" : activeFolderId;
                  // Attaching the first one closes the picker, which is the
                  // behaviour of picking any asset — an upload is a pick that
                  // brought its own file.
                  const [firstId] = onUpload(files, targetFolder);
                  if (firstId) onSelectAsset(firstId);
                }}
              />
              <UploadCloud className="size-6 text-muted-foreground" />
              <span className="text-xs font-medium">Upload Media</span>
              <span className="px-4 text-[11px] text-muted-foreground">
                {restrictType === "pdf"
                  ? "Click or drag and drop a PDF"
                  : "Click or drag and drop images, embeds, or PDFs"}
              </span>
            </label>

            {visibleAssets.map((asset) => {
              const isSelected = selectedAssetIds.includes(asset.id);
              return (
                <button
                  key={asset.id}
                  onClick={() => onSelectAsset(asset.id)}
                  className="group flex flex-col gap-1.5 text-left"
                >
                  <div className="relative">
                    <MediaThumb
                      assetId={asset.id}
                      type={asset.type}
                      url={asset.url}
                      name={asset.name}
                      className={cn(
                        "aspect-square w-full ring-1 transition-all group-hover:ring-primary",
                        isSelected ? "ring-primary" : "ring-border",
                      )}
                    />
                    {asset.type !== "image" && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                        {asset.type}
                      </span>
                    )}
                    {isSelected && (
                      <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                  </div>
                  <span className="truncate text-xs text-muted-foreground">
                    {asset.name}
                    {isSelected && " · Added"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
