"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { versionMeta, type AppVersion } from "@/lib/versions";
import { VersionPreview } from "./version-preview";

const MESH: Record<AppVersion, string> = {
  repository: [
    "radial-gradient(58% 68% at 18% 12%, rgba(167,139,250,0.16), transparent 62%)",
    "radial-gradient(52% 62% at 88% 28%, rgba(139,92,246,0.11), transparent 64%)",
    "radial-gradient(72% 58% at 52% 100%, rgba(91,33,182,0.15), transparent 66%)",
  ].join(", "),
  classic: [
    "radial-gradient(58% 68% at 18% 12%, rgba(125,211,252,0.15), transparent 62%)",
    "radial-gradient(52% 62% at 88% 28%, rgba(56,189,248,0.10), transparent 64%)",
    "radial-gradient(72% 58% at 52% 100%, rgba(3,105,161,0.16), transparent 66%)",
  ].join(", "),
};

export function VersionSwitchDialog({
  target,
  onOpenChange,
  onConfirm,
}: {
  target: AppVersion | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const [shown, setShown] = useState(target);
  if (target && target !== shown) setShown(target);
  const meta = shown ? versionMeta(shown) : null;

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[760px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-(--r-surface) border-0 bg-(--surface-dialog) p-0 text-left text-foreground shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.09] sm:max-w-[760px]"
      >
        <div
          aria-hidden
          className="h-px w-full shrink-0 [background-image:var(--specular)]"
        />

        {shown && meta && (
          <div className="flex">
            <div
              className="relative flex w-[54%] shrink-0 items-center border-r border-(--ink)/[0.06] px-6 py-8"
              style={{ backgroundImage: MESH[shown] }}
            >
              <VersionPreview
                version={shown}
                className="shadow-[0_2px_6px_rgba(0,0,0,0.35),0_18px_44px_-20px_rgba(0,0,0,0.9)]"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <DialogHeader className="flex-1 justify-center gap-0 p-0 text-left">
                <div className="px-7 pt-7 pb-5">
                  <DialogTitle className="text-[21px] leading-tight font-semibold tracking-[-0.022em] text-balance">
                    Switch to {meta.label}?
                  </DialogTitle>
                  <DialogDescription className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground text-pretty">
                    {shown === "repository"
                      ? "The same content, shown as one table across every campaign."
                      : "The same content, shown one campaign at a time."}
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="flex items-center justify-end gap-2 border-t border-(--ink)/[0.06] px-6 py-4">
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex h-9 items-center rounded-(--r-pill) px-3.5 text-[13px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex h-9 items-center rounded-(--r-pill) bg-violet-600 px-4 text-[13px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-(--press)"
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
