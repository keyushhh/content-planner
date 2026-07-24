"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

export function ConfirmDialog({
  open,
  onOpenChange,
  icon: CustomIcon,
  tone = "violet",
  title,
  description,
  actions,
}: ConfirmDialogProps) {
  // Default to AlertTriangle for destructive tone if no custom icon provided
  const Icon = CustomIcon ?? (tone === "destructive" ? AlertTriangle : null);

  // Separate destructive/primary action from outline action for stacked ordering
  const mainActions = actions.filter((a) => a.tone !== "outline");
  const outlineActions = actions.filter((a) => a.tone === "outline");
  const orderedActions = [...mainActions, ...outlineActions];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px] gap-0 rounded-2xl p-5 text-center shadow-2xl border border-border">
        {Icon && (
          <div className="mx-auto mb-3 flex items-center justify-center pointer-events-none select-none">
            <Icon
              className={cn(
                "size-8 stroke-[1.75]",
                tone === "destructive"
                  ? "text-red-600"
                  : tone === "violet"
                  ? "text-violet-400"
                  : "text-emerald-400"
              )}
            />
          </div>
        )}

        <DialogTitle className="text-center text-lg font-bold tracking-tight text-foreground">
          {title}
        </DialogTitle>

        <DialogDescription className="mt-1.5 text-center text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {description}
        </DialogDescription>

        <div className="mt-5 flex flex-col gap-2.5 w-full">
          {orderedActions.map((action) => {
            const ActionIcon = action.icon;
            const isDestructive = action.tone === "destructive";
            const isPrimary = action.tone === "primary";
            const isOutline = action.tone === "outline";

            return (
              <Button
                key={action.label}
                variant={isOutline ? "outline" : isDestructive ? "destructive" : "default"}
                className={cn(
                  "h-10 w-full gap-2 rounded-xl text-sm font-semibold transition-all shadow-none",
                  isDestructive &&
                    "bg-red-600 text-white hover:bg-red-500 active:bg-red-700 border-0 shadow-sm",
                  isPrimary &&
                    "bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700 border-0 shadow-sm",
                  isOutline &&
                    "border-border bg-transparent text-foreground hover:bg-accent/60 font-medium"
                )}
                onClick={action.onClick}
              >
                {ActionIcon && <ActionIcon className="size-4" />}
                {action.label}
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
