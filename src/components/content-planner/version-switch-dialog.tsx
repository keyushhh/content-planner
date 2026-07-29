"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { versionMeta, type AppVersion } from "./version-chooser-modal";
import { VersionPreview } from "./version-preview";

/**
 * Switching version is confirmed rather than instant: the two models show the
 * same content so differently that arriving in the other one unannounced reads
 * as a bug.
 *
 * It gets its own dialog rather than the shared ConfirmDialog because what it
 * needs to say is a picture. "Repository" and "Classic" are names for layouts,
 * and a miniature of the destination answers "where am I going" in the time it
 * takes to look — which is the whole job of this dialog. No alert icon: nothing
 * here is created, moved or destroyed.
 */
export function VersionSwitchDialog({
  target,
  onOpenChange,
  onConfirm,
}: {
  /** The version being switched TO, or null when nothing is pending. */
  target: AppVersion | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  /**
   * The last version asked about, kept after `target` clears so the dialog can
   * animate OUT with its content intact. Reading `target` directly would empty
   * the sheet a frame before it left, which looks like a glitch rather than a
   * dismissal. Updated during render, the way the other dialogs here do it — an
   * effect would let one blank frame through.
   */
  const [shown, setShown] = useState(target);
  if (target && target !== shown) setShown(target);
  const meta = shown ? versionMeta(shown) : null;

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[560px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-[24px] border-0 bg-[oklch(0.26_0_0)] p-0 text-left text-foreground shadow-[0_2px_4px_rgba(0,0,0,0.35),0_32px_72px_-32px_rgba(0,0,0,1)] inset-ring-1 inset-ring-white/[0.09] sm:max-w-[560px]"
      >
        <div
          aria-hidden
          className="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-white/[0.11] to-transparent"
        />

        {shown && meta && (
          <div className="flex">
            {/* The destination, shown. Its own hue washes the panel so the
                miniature sits in the colour it is about. */}
            <div
              className={cn(
                "flex w-[43%] shrink-0 items-center border-r border-white/[0.06] p-4",
                shown === "repository"
                  ? "bg-[radial-gradient(120%_100%_at_50%_50%,rgba(139,92,246,0.10),transparent_70%)]"
                  : "bg-[radial-gradient(120%_100%_at_50%_50%,rgba(56,189,248,0.10),transparent_70%)]",
              )}
            >
              <VersionPreview version={shown} />
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <DialogHeader className="flex-1 gap-0 p-0 text-left">
                <div className="px-5 pt-5 pb-4">
                  <DialogTitle className="text-[19px] leading-tight font-semibold tracking-[-0.02em] text-balance">
                    Switch to {meta.label}?
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-[13px] leading-relaxed text-muted-foreground text-pretty">
                    {shown === "repository"
                      ? "The same content, shown as one table across every campaign."
                      : "The same content, shown one campaign at a time."}
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-4 py-3.5">
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-white/[0.06] hover:text-foreground active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex h-9 items-center rounded-full bg-violet-600 px-4 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_16px_-8px_rgba(139,92,246,0.7)] inset-ring-1 inset-ring-white/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-[0.97]"
                >
                  Switch
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
