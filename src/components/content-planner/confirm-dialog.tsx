"use client";

import type { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tone = "violet" | "destructive" | "success";

const TONE_STYLES: Record<Tone, string> = {
  violet: "bg-violet-500/10 text-violet-400",
  destructive: "bg-destructive/10 text-destructive",
  success: "bg-emerald-500/10 text-emerald-400",
};

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
  icon: Icon,
  tone = "violet",
  title,
  description,
  actions,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg gap-0 rounded-2xl p-7">
        {Icon && (
          <span
            className={cn(
              "mb-4 flex size-12 items-center justify-center rounded-full",
              TONE_STYLES[tone],
            )}
          >
            <Icon className="size-6" />
          </span>
        )}
        <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        <DialogDescription className="mt-2 text-[13px] leading-relaxed">
          {description}
        </DialogDescription>
        <div className="mt-7 flex flex-wrap justify-end gap-2.5">
          {actions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={action.label}
                size="lg"
                variant={
                  action.tone === "outline"
                    ? "outline"
                    : action.tone === "destructive"
                      ? "destructive"
                      : "default"
                }
                className={cn(
                  "h-10 gap-1.5 px-4",
                  action.tone === "primary" &&
                    "bg-violet-600 text-white hover:bg-violet-500",
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
