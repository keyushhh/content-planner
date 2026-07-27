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
  actions: ConfirmDialogAction[];
}

/** Icon-well treatment per tone: tinted fill + matching hairline. */
const TONE_WELL: Record<Tone, string> = {
  destructive: "text-red-300 bg-red-500/[0.13] inset-ring-red-400/25",
  violet: "text-violet-300 bg-violet-500/[0.13] inset-ring-violet-400/25",
  success: "text-emerald-300 bg-emerald-500/[0.13] inset-ring-emerald-400/25",
};

/**
 * Built as a small Canvas sheet, so a confirmation looks like it belongs to this
 * product rather than to the browser: specular top edge, hairline-divided
 * footer, and the actions side by side on one row.
 *
 * Two things the stacked full-width version got wrong. The buttons were equal
 * slabs, which made "Delete session" and "Cancel" read as equally likely — a
 * destructive default by layout. And the icon sat alone on the surface at
 * red-600, a light-mode red that goes muddy on a dark sheet.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  icon: CustomIcon,
  tone = "violet",
  title,
  description,
  actions,
}: ConfirmDialogProps) {
  const Icon = CustomIcon ?? (tone === "destructive" ? AlertTriangle : null);

  // Cancel-style actions read first, the committing action lands last on the
  // right — the position the eye finishes on and the thumb expects.
  const outlineActions = actions.filter((a) => a.tone === "outline");
  const mainActions = actions.filter((a) => a.tone !== "outline");
  const orderedActions = [...outlineActions, ...mainActions];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[440px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-[24px] border-0 bg-[oklch(0.26_0_0)] p-0 text-left text-foreground shadow-[0_2px_4px_rgba(0,0,0,0.35),0_32px_72px_-32px_rgba(0,0,0,1)] inset-ring-1 inset-ring-white/[0.09] sm:max-w-[440px]"
      >
        <div
          aria-hidden
          className="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-white/[0.11] to-transparent"
        />

        <div className="flex items-start gap-3.5 px-6 pb-6 pt-6">
          {Icon && (
            <span
              className={cn(
                "flex size-10 shrink-0 select-none items-center justify-center rounded-full inset-ring-1",
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

        <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] bg-black/[0.12] px-6 py-4">
          {orderedActions.map((action) => {
            const ActionIcon = action.icon;
            const isOutline = action.tone === "outline";
            const isDestructive = action.tone === "destructive";

            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-full text-[13px] font-medium transition-[background-color,box-shadow,color,scale] duration-150 active:scale-[0.97]",
                  isOutline
                    ? "px-3.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                    : "px-4 text-white inset-ring-1 inset-ring-white/15",
                  isDestructive &&
                    "bg-red-600 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_16px_-8px_rgba(220,38,38,0.75)] hover:bg-red-500",
                  action.tone === "primary" &&
                    "bg-violet-600 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_16px_-8px_rgba(139,92,246,0.7)] hover:bg-violet-500",
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
