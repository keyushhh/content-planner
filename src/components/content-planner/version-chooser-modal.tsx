"use client";

import type { LucideIcon } from "lucide-react";
import { CalendarDays, ChevronRight, Database } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { EASE } from "./session-composer";

export type AppVersion = "classic" | "repository";

/**
 * One description of each version, shared by everything that has to name them:
 * these rows, the title menu, and the switch confirmation. Two products should
 * not drift into two different sets of words.
 */
export const VERSIONS: {
  id: AppVersion;
  label: string;
  hint: string;
  icon: LucideIcon;
  /** Each version owns a hue, the way the post types do. */
  well: string;
  glow: string;
}[] = [
  {
    id: "classic",
    label: "Classic",
    hint: "One campaign at a time. Pick it in the sidebar, write inside it, send to it.",
    icon: CalendarDays,
    well: "bg-sky-500/[0.14] text-sky-300 inset-ring-sky-400/25",
    glow: "hover:inset-ring-sky-400/45 hover:bg-sky-500/[0.07]",
  },
  {
    id: "repository",
    label: "Repository",
    hint: "Everything in one table. Content joins no campaign until you send it — then as many as you like.",
    icon: Database,
    well: "bg-violet-500/[0.14] text-violet-300 inset-ring-violet-400/25",
    glow: "hover:inset-ring-violet-400/45 hover:bg-violet-500/[0.07]",
  },
];

export const versionMeta = (v: AppVersion) => VERSIONS.find((x) => x.id === v)!;

/**
 * Two products share this build, and which one you are looking at changes what
 * almost every screen means — so it is asked once, up front, rather than
 * inferred. The dialog cannot be dismissed: there is no sensible default to
 * fall back to, and a half-chosen app is worse than a question.
 *
 * Built as rows rather than side-by-side tiles, for the same reason the post
 * type picker is: the hints are what you decide on, and they need the width to
 * be read. The two standalone repos ask nothing, because there is nothing to
 * ask — this exists only in the combined build.
 */
export function VersionChooserModal({
  open,
  onChoose,
}: {
  open: boolean;
  onChoose: (version: AppVersion) => void;
}) {
  return (
    // No onOpenChange: Escape, the backdrop and a close button all have nothing
    // to do here, because there is no state behind this to return to.
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="w-[440px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-[24px] border-0 bg-[oklch(0.26_0_0)] p-0 text-left text-foreground shadow-[0_2px_4px_rgba(0,0,0,0.35),0_32px_72px_-32px_rgba(0,0,0,1)] inset-ring-1 inset-ring-white/[0.09] sm:max-w-[440px]"
      >
        <div
          aria-hidden
          className="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-white/[0.11] to-transparent"
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

        <div className="flex flex-col gap-1.5 border-t border-white/[0.06] p-3">
          {VERSIONS.map(({ id, label, hint, icon: Icon, well, glow }, i) => (
            <button
              key={id}
              onClick={() => onChoose(id)}
              style={{ animation: `post-type-in 400ms ${EASE} ${i * 55}ms both` }}
              className={cn(
                "group flex items-start gap-3.5 rounded-[16px] bg-white/[0.028] px-3.5 py-3.5 text-left inset-ring-1 inset-ring-white/[0.07] transition-[background-color,box-shadow,scale] duration-200 active:scale-[0.985]",
                glow,
              )}
              // Without this the row keeps a focus ring after the click, which
              // reads as "still deciding" on a dialog that is already closing.
              onMouseDown={(e) => e.preventDefault()}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-[12px] inset-ring-1 transition-transform duration-300 group-hover:scale-[1.06]",
                  well,
                )}
                style={{ transitionTimingFunction: EASE }}
              >
                <Icon className="size-[18px]" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium tracking-[-0.008em]">
                  {label}
                </span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground text-pretty">
                  {hint}
                </span>
              </span>

              <ChevronRight
                className="mt-2.5 size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-[opacity,translate] duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                style={{ transitionTimingFunction: EASE }}
              />
            </button>
          ))}
        </div>

        {/* Hairline, not a filled band: there is nothing to cancel to, so the
            footer only orients — it holds no action. */}
        <div className="border-t border-white/[0.06] px-6 py-3">
          <span className="text-[11px] text-muted-foreground/70">
            Switch any time from the title menu
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
