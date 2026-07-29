"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Tone = "violet" | "destructive" | "success";

interface ConfirmDialogAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  tone?: "primary" | "outline" | "destructive";
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: LucideIcon;
  tone?: Tone;
  title: React.ReactNode;
  description: React.ReactNode;
  /**
   * The thing being acted on, shown as its own inset row between the copy and
   * the footer.
   */
  preview?: React.ReactNode;
  actions: ConfirmDialogAction[];
}

/** Icon-well treatment per tone: tinted fill + matching hairline. */
const TONE_WELL: Record<Tone, string> = {
  destructive: "text-red-300 bg-red-500/[0.13] inset-ring-red-400/25",
  violet: "text-violet-300 bg-violet-500/[0.13] inset-ring-violet-400/25",
  success: "text-emerald-300 bg-emerald-500/[0.13] inset-ring-emerald-400/25",
};

/**
 * Built as a small Canvas sheet, so a confirmation looks like it belongs to
 * this product rather than to the browser: specular top edge, hairline-divided
 * footer, actions side by side on one row.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  icon: CustomIcon,
  tone = "violet",
  title,
  description,
  preview,
  actions,
}: ConfirmDialogProps) {
  const Icon = CustomIcon ?? (tone === "destructive" ? AlertTriangle : null);

  // Cancel-style actions read first, the committing action lands last on the
  // right, where the eye finishes and the thumb expects it.
  const outlineActions = actions.filter((a) => a.tone === "outline");
  const mainActions = actions.filter((a) => a.tone !== "outline");
  const orderedActions = [...outlineActions, ...mainActions];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[440px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-(--r-surface) border-0 bg-(--surface-dialog) p-0 text-left text-foreground shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.09] sm:max-w-[440px]"
      >
        <div
          aria-hidden
          className="h-px w-full shrink-0 [background-image:var(--specular)]"
        />

        <div
          className={cn(
            "flex items-start gap-3.5 px-6 pt-6",
            preview ? "pb-5" : "pb-6",
          )}
        >
          {Icon && (
            <span
              className={cn(
                "flex size-10 shrink-0 select-none items-center justify-center rounded-(--r-pill) inset-ring-1",
                TONE_WELL[tone],
              )}
            >
              <Icon className="size-[18px] stroke-[1.75]" />
            </span>
          )}

          <div className="min-w-0 flex-1 pt-0.5">
            <DialogTitle className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-balance">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground text-pretty">
              {description}
            </DialogDescription>
          </div>
        </div>

        {preview && (
          <div className="px-6 pb-6">
            <div className="rounded-(--r-float) bg-(--ink)/[0.035] px-3.5 py-3 inset-ring-1 inset-ring-(--ink)/[0.07]">
              {preview}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-(--ink)/[0.06] bg-(--sink)/[0.12] px-6 py-4">
          {orderedActions.map((action) => {
            const ActionIcon = action.icon;
            const isOutline = action.tone === "outline";
            const isDestructive = action.tone === "destructive";

            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-(--r-pill) text-[13px] font-medium transition-[background-color,box-shadow,color,scale] duration-150 active:scale-(--press)",
                  isOutline
                    ? "px-3.5 text-muted-foreground hover:bg-(--ink)/[0.06] hover:text-foreground"
                    : "px-4 text-white inset-ring-1 inset-ring-(--ink)/15",
                  isDestructive &&
                    "bg-red-600 shadow-(--lift-destructive) hover:bg-red-500",
                  action.tone === "primary" &&
                    "bg-violet-600 shadow-(--lift-accent) hover:bg-violet-500",
                )}
              >
                {ActionIcon && <ActionIcon className="size-3.5" />}
                {action.label}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
