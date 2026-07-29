"use client";

import { CalendarDays, Database, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type AppVersion = "classic" | "repository";

const VERSIONS: {
  id: AppVersion;
  label: string;
  tagline: string;
  points: string[];
  icon: typeof Database;
  /** Each version's own accent, so the cards read as two products. */
  accent: string;
  ring: string;
}[] = [
  {
    id: "classic",
    label: "Classic",
    tagline: "One campaign at a time.",
    points: [
      "Pick a campaign in the sidebar",
      "Write and edit posts inside it",
      "Send goes straight to that campaign",
    ],
    icon: CalendarDays,
    accent: "bg-violet-600 text-white",
    ring: "hover:border-violet-500/60 data-[selected]:border-violet-500",
  },
  {
    id: "repository",
    label: "Repository",
    tagline: "Everything, across every campaign.",
    points: [
      "Thousands of posts in one searchable table",
      "Content belongs to no campaign until you send it",
      "Send one post to several campaigns at once",
    ],
    icon: Database,
    accent: "bg-violet-500/12 text-violet-300 inset-ring-1 inset-ring-violet-400/25",
    ring: "hover:border-violet-500/60",
  },
];

/**
 * Two products share this build, and which one you are looking at changes what
 * almost every screen means — so it is asked once, up front, rather than
 * inferred. The dialog cannot be dismissed: there is no sensible default to
 * fall back to, and a half-chosen app is worse than a question.
 *
 * The two standalone repos have no such question, because there is nothing to
 * ask. This exists only in the combined build.
 */
export function VersionChooserModal({
  open,
  onChoose,
}: {
  open: boolean;
  onChoose: (version: AppVersion) => void;
}) {
  return (
    // No onOpenChange: Escape, the backdrop and the close button all have
    // nothing to do here, because there is no state behind this to return to.
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] gap-0 p-0 sm:max-w-[680px]"
      >
        <DialogHeader className="gap-1.5 px-6 pt-6 pb-5">
          <DialogTitle className="text-[19px] font-semibold tracking-[-0.02em]">
            Which version?
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            Two models of the same product. Pick one to open — you can switch
            later from the title menu.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 px-6 pb-6 sm:grid-cols-2">
          {VERSIONS.map(({ id, label, tagline, points, icon: Icon, accent, ring }) => (
            <button
              key={id}
              onClick={() => onChoose(id)}
              className={cn(
                "group flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-4 text-left transition-[border-color,background-color,scale] duration-150 hover:bg-card/70 active:scale-[0.99]",
                ring,
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full",
                  accent,
                )}
              >
                <Icon className="size-4" />
              </span>

              <span className="min-w-0">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-[12px] text-muted-foreground">
                  {tagline}
                </span>
              </span>

              <ul className="flex flex-col gap-1.5">
                {points.map((p) => (
                  <li
                    key={p}
                    className="flex gap-2 text-[12px] leading-snug text-muted-foreground"
                  >
                    <span className="mt-[6px] size-1 shrink-0 rounded-full bg-violet-400/70" />
                    {p}
                  </li>
                ))}
              </ul>

              <span className="mt-auto flex items-center gap-1 pt-1 text-[12px] font-medium text-violet-300 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                Open {label}
                <ArrowRight className="size-3.5" />
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
