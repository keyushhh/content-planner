"use client";

import { useState, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Search,
  ImageIcon,
  FolderOpen,
  Upload,
  ArrowLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PostVariation, MediaAsset, MediaFolder } from "@/lib/types";
import { MediaThumb } from "./media-thumb";

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
  mediaFolders,
  onOpenMediaLibrary,
  onClose,
  disabled,
}: VariationsViewProps) {
  const [selectedId, setSelectedId] = useState<string>(
    variations[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep selectedId valid if variations change
  const currentVariation =
    variations.find((v) => v.id === selectedId) || variations[0];
  const activeId = currentVariation?.id;

  const filteredVariations = variations.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.label.toLowerCase().includes(q) ||
      v.copy.toLowerCase().includes(q)
    );
  });

  const handleAddVariation = () => {
    const newId = `var-${Date.now()}`;
    const newVar: PostVariation = {
      id: newId,
      label: `Variation ${variations.length + 1}`,
      copy: "",
      assetIds: [],
    };
    onChange([...variations, newVar]);
    setSelectedId(newId);
  };

  const handleRemoveVariation = (id: string) => {
    const next = variations.filter((v) => v.id !== id);
    onChange(next);
    if (activeId === id) {
      const remainingIndex = variations.findIndex((v) => v.id === id);
      const nextActive = next[Math.max(0, remainingIndex - 1)];
      if (nextActive) setSelectedId(nextActive.id);
    }
  };

  const handleUpdateCurrentCopy = (copy: string) => {
    if (!activeId) return;
    onChange(
      variations.map((v) => (v.id === activeId ? { ...v, copy } : v))
    );
  };

  const handleRemoveAssetFromCurrent = (assetId: string) => {
    if (!activeId || !currentVariation) return;
    onChange(
      variations.map((v) =>
        v.id === activeId
          ? {
              ...v,
              assetIds: v.assetIds.filter((id) => id !== assetId),
            }
          : v
      )
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !activeId || !currentVariation) return;
    if (currentVariation.assetIds.length >= 3) return;
    const newAssetId = `upload-${Date.now()}`;
    onChange(
      variations.map((v) =>
        v.id === activeId
          ? { ...v, assetIds: [...v.assetIds, newAssetId] }
          : v
      )
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Pane Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">Post Variations</h2>
            <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-400">
              {variations.length} alternate{variations.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Primary copy stays on the session · Up to 3 images per variation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5 bg-violet-600 font-medium text-white hover:bg-violet-500"
            onClick={onClose}
          >
            <Check className="size-3.5" />
            Done
          </Button>
        </div>
      </div>

      {/* Main Content split view within the pane */}
      <div className="flex flex-1 min-h-0 divide-x divide-border">
        {/* Left column: List of Variations */}
        <div className="flex w-64 shrink-0 flex-col gap-3 p-4 bg-muted/20">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="h-9 w-full bg-background pl-8 pr-3 text-xs border-border"
            />
          </div>

          <Button
            onClick={handleAddVariation}
            disabled={disabled}
            className="w-full justify-center gap-2 bg-violet-600 font-medium text-white hover:bg-violet-500"
            size="sm"
          >
            <Plus className="size-4" />
            Add Variation
          </Button>

          <div className="mt-1 flex-1 space-y-2 overflow-y-auto pr-1">
            {filteredVariations.map((v, index) => {
              const isSelected = v.id === activeId;
              const displayNum = index + 1;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-all relative group",
                    isSelected
                      ? "border-violet-500 bg-violet-500/10 shadow-xs"
                      : "border-border bg-card hover:border-border/80 hover:bg-accent/40"
                  )}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span className={isSelected ? "text-violet-400" : ""}>#{displayNum}</span>
                    {v.assetIds.length > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-violet-400">
                        <ImageIcon className="size-3" />
                        {v.assetIds.length}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs font-normal leading-relaxed text-foreground">
                    {v.copy || <span className="italic text-muted-foreground/60">Empty copy...</span>}
                  </p>
                </button>
              );
            })}

            {filteredVariations.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No variations found
              </div>
            )}
          </div>
        </div>

        {/* Right column: Active Variation Detail Editor */}
        {currentVariation ? (
          <div className="flex flex-1 flex-col overflow-y-auto p-6 bg-background">
            <div className="flex flex-col flex-1 gap-5 max-w-2xl">
              {/* Variation Title Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Variation {variations.findIndex((v) => v.id === activeId) + 1}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentVariation.copy.length} characters
                  </p>
                </div>

                {!disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveVariation(currentVariation.id)}
                    className="gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30"
                  >
                    <Trash2 className="size-3.5" />
                    Remove Variation
                  </Button>
                )}
              </div>

              {/* Copy Editor */}
              <div className="flex flex-col gap-2 flex-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Alternate Copy
                </span>
                <Textarea
                  value={currentVariation.copy}
                  onChange={(e) => handleUpdateCurrentCopy(e.target.value)}
                  disabled={disabled}
                  placeholder="Enter alternate post content..."
                  className="min-h-[220px] flex-1 resize-y border-border bg-card p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-violet-500/20"
                />
              </div>

              {/* Image Library Attachments */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      IMAGE LIBRARY
                    </span>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {currentVariation.assetIds.length}/3 · JPG, PNG, WebP
                    </p>
                  </div>

                  {!disabled && currentVariation.assetIds.length < 3 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-1.5 text-xs border-border"
                      >
                        <Upload className="size-3.5" />
                        Upload
                      </Button>
                      {onOpenMediaLibrary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onOpenMediaLibrary}
                          className="gap-1.5 text-xs border-border"
                        >
                          <FolderOpen className="size-3.5" />
                          Library
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {currentVariation.assetIds.length > 0 ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {currentVariation.assetIds.map((assetId) => {
                      const asset = mediaAssets.find((a) => a.id === assetId);
                      return (
                        <div key={assetId} className="relative group/thumb">
                          <div className="size-16 overflow-hidden rounded-lg border border-border bg-accent/40">
                            {asset ? (
                              <MediaThumb assetId={asset.id} type={asset.type} className="size-full" />
                            ) : (
                              <MediaThumb assetId={assetId} className="size-full" />
                            )}
                          </div>
                          {!disabled && (
                            <button
                              onClick={() => handleRemoveAssetFromCurrent(assetId)}
                              className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-red-600 text-white shadow-xs hover:bg-red-500"
                            >
                              <X className="size-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-xs italic text-muted-foreground/70">
                    Optional. Without a library, Wozku uses the session/post gallery when sharing.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
            No variation selected
          </div>
        )}
      </div>
    </div>
  );
}
