"use client";

import {
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Layers2,
  Repeat2,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PostType } from "@/lib/types";

const EASE = "cubic-bezier(0.2,0,0,1)";

/**
 * Each type states what it needs from you, not what it is: "Image" tells you
 * nothing, where "one image" tells you what the next screen will ask for.
 */
const TYPES: {
  id: PostType;
  label: string;
  hint: string;
  icon: LucideIcon;
  /** Each type owns a hue, so four rows read as four kinds of thing. Bordered
      wells rather than ringed ones — Classic draws edges, not elevation. */
  well: string;
  hover: string;
}[] = [
  {
    id: "Image",
    label: "Image",
    hint: "One image",
    icon: ImageIcon,
    well: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    hover: "hover:border-violet-500/40",
  },
  {
    id: "Frames",
    label: "Frames",
    hint: "Several images, swiped in order",
    icon: Layers2,
    well: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    hover: "hover:border-sky-500/40",
  },
  {
    id: "PDF",
    label: "PDF",
    hint: "One PDF, swiped as pages",
    icon: FileText,
    well: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    hover: "hover:border-amber-500/40",
  },
  {
    id: "Reshare",
    label: "Reshare",
    hint: "Keeps the original post’s media",
    icon: Repeat2,
    well: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    hover: "hover:border-emerald-500/40",
  },
];

/**
 * The post type, asked before the composer opens — Classic's dialect.
 *
 * Same question the repository asks, deliberately not the same object. The
 * repository's picker is a floating canvas sheet: ringed rows, tinted wells,
 * elevation doing the separating. Classic states structure with edges instead —
 * a bordered card on the surface, hairline-divided sections, flat rows that
 * answer with a fill on hover, and the shared Button for Cancel. Sharing the
 * component and theming it would have meant one file carrying two design
 * systems and neither being written for.
 *
 * A modal rather than a step in the pane: it is one decision, made once, and it
 * should not cost the pane vertical space forever after. Classic keeps Post Type
 * as a field in the composer, so the answer stays changeable afterwards — this
 * only means the composer opens already shaped for what you are making, instead
 * of defaulting to Image and making you notice.
 */
export function ClassicPostTypeModal({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: PostType) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[420px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 text-left text-foreground sm:max-w-[420px]"
      >
        <DialogHeader className="p-0 text-left">
          <div className="px-5 pb-4 pt-5">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              What are you posting?
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-snug text-muted-foreground">
              This decides which fields the composer gives you.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Rows, not a grid of tiles: the hints are the point and they need the
            width to be read. Each row is one click straight into the composer. */}
        <div className="flex flex-col gap-1.5 border-t border-border p-3">
          {TYPES.map(({ id, label, hint, icon: Icon, well, hover }, i) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              style={{ animation: `post-type-in 400ms ${EASE} ${i * 55}ms both` }}
              className={cn(
                "group flex items-center gap-3 rounded-lg border border-border px-3 py-3 text-left transition-[background-color,border-color,scale] duration-150 hover:bg-accent/40 active:scale-[0.99]",
                hover,
              )}
              onMouseDown={(e) => e.preventDefault()}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-md border transition-transform duration-300 group-hover:scale-[1.06]",
                  well,
                )}
                style={{ transitionTimingFunction: EASE }}
              >
                <Icon className="size-4" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{label}</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                  {hint}
                </span>
              </span>

              <ChevronRight
                className="size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-[opacity,translate] duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                style={{ transitionTimingFunction: EASE }}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <span className="text-[11px] text-muted-foreground/70">
            You can change it later in the pane
          </span>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
