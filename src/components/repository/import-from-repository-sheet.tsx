"use client";

import { useState } from "react";
import { Check, FolderInput } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Session } from "@/lib/types";

interface ImportFromRepositorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignName: string;
  availableSessions: Session[];
  onImport: (sessionIds: string[]) => void;
}

export function ImportFromRepositorySheet({
  open,
  onOpenChange,
  campaignName,
  availableSessions,
  onImport,
}: ImportFromRepositorySheetProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function reset() {
    setSelectedIds([]);
  }

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Import from Repository</SheetTitle>
          <SheetDescription>
            Pick existing content to bring into &ldquo;{campaignName}&rdquo;. It'll land here as WIP,
            pending this campaign's platform and scheduling settings.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          {availableSessions.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 py-10 text-center text-muted-foreground">
              <span className="text-sm font-medium">Nothing left to import</span>
              <span className="text-xs">
                All repository content has already been sent somewhere.
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {availableSessions.map((session) => {
                const isSelected = selectedIds.includes(session.id);
                return (
                  <button
                    key={session.id}
                    onClick={() => toggle(session.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-3.5 py-3 text-left transition-colors",
                      isSelected
                        ? "border-violet-500/60 bg-violet-500/[0.08]"
                        : "border-border hover:bg-accent/40",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{session.title}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {session.tags.length > 0
                          ? session.tags.join(", ")
                          : "No tags"}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-md border",
                        isSelected
                          ? "border-violet-500 bg-violet-500 text-white"
                          : "border-border",
                      )}
                    >
                      {isSelected && <Check className="size-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={selectedIds.length === 0}
            className="gap-1.5 bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40"
            onClick={() => {
              if (selectedIds.length === 0) return;
              onImport(selectedIds);
              onOpenChange(false);
            }}
          >
            <FolderInput className="size-4" />
            Import {selectedIds.length > 0 ? selectedIds.length : ""}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
