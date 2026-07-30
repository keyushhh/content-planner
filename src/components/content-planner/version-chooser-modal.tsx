"use client";

import type { LucideIcon } from "lucide-react";
import { CalendarDays, Database } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { EASE } from "./session-composer";
import { VersionPreview } from "./version-preview";

export type AppVersion = "classic" | "repository";

export const VERSIONS: {
  id: AppVersion;
  label: string;
  hint: string;
  icon: LucideIcon;
  well: string;
  glow: string;
  ring: string;
}[] = [
  {
    id: "classic",
    label: "Classic",
    hint: "One campaign at a time",
    icon: CalendarDays,
    well: "bg-sky-500/[0.14] text-sky-300 inset-ring-sky-400/25",
    glow: "hover:inset-ring-sky-400/45 hover:bg-sky-500/[0.05]",
    ring: "group-hover:inset-ring-sky-400/40",
  },
  {
    id: "repository",
    label: "Repository",
    hint: "Everything, across every campaign",
    icon: Database,
    well: "bg-violet-500/[0.14] text-violet-300 inset-ring-violet-400/25",
    glow: "hover:inset-ring-violet-400/45 hover:bg-violet-500/[0.05]",
    ring: "group-hover:inset-ring-violet-400/40",
  },
];

export const versionMeta = (v: AppVersion) => VERSIONS.find((x) => x.id === v)!;

export function VersionChooserModal({
  open,
  onChoose,
}: {
  open: boolean;
  onChoose: (version: AppVersion) => void;
}) {
  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="w-[600px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-(--r-surface) border-0 bg-(--surface-dialog) p-0 text-left text-foreground shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.09] sm:max-w-[600px]"
      >
        <div
          aria-hidden
          className="h-px w-full shrink-0 [background-image:var(--specular)]"
        />

        <DialogHeader className="p-0 text-left">
          <div className="px-6 pt-6 pb-4">
            <DialogTitle className="text-[22px] leading-tight font-semibold tracking-[-0.022em] text-balance">
              Which version?
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-[13px] leading-snug text-muted-foreground text-pretty">
              Two models of the same product, over the same content.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 border-t border-(--ink)/[0.06] p-3">
          {VERSIONS.map(({ id, label, hint, icon: Icon, well, glow, ring }, i) => (
            <button
              key={id}
              onClick={() => onChoose(id)}
              style={{ animation: `post-type-in 400ms ${EASE} ${i * 55}ms both` }}
              className={cn(
                "group flex flex-col gap-3 rounded-(--r-float) bg-(--ink)/[0.028] p-3 text-left inset-ring-1 inset-ring-(--ink)/[0.07] transition-[background-color,box-shadow,scale] duration-200 active:scale-(--press-lg)",
                glow,
              )}
              onMouseDown={(e) => e.preventDefault()}
            >
              <VersionPreview
                version={id}
                className={cn(
                  "transition-[scale,box-shadow] duration-300 group-hover:scale-[1.012]",
                  ring,
                )}
              />

              <span className="flex items-center gap-2.5 px-0.5 pb-0.5">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-(--r-inner) inset-ring-1 transition-transform duration-300 group-hover:scale-[1.06]",
                    well,
                  )}
                  style={{ transitionTimingFunction: EASE }}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-medium tracking-[-0.008em]">
                    {label}
                  </span>
                  <span className="mt-px block truncate text-[12px] leading-snug text-muted-foreground">
                    {hint}
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="border-t border-(--ink)/[0.06] px-6 py-3">
          <span className="text-[11px] text-muted-foreground/70">
            Switch any time from the title menu
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
