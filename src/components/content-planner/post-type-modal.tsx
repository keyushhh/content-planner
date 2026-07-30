"use client";

import {
  Check,
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
import { cn } from "@/lib/utils";
import type { PostType } from "@/lib/types";

const EASE = "cubic-bezier(0.2,0,0,1)";

const TYPES: {
  id: PostType;
  label: string;
  hint: string;
  icon: LucideIcon;
  well: string;
  glow: string;
}[] = [
  {
    id: "Image",
    label: "Image",
    hint: "One image",
    icon: ImageIcon,
    well: "bg-violet-500/[0.14] text-violet-300 inset-ring-violet-400/25",
    glow: "hover:inset-ring-violet-400/45 hover:bg-violet-500/[0.07]",
  },
  {
    id: "Frames",
    label: "Frames",
    hint: "Several images, swiped in order",
    icon: Layers2,
    well: "bg-sky-500/[0.14] text-sky-300 inset-ring-sky-400/25",
    glow: "hover:inset-ring-sky-400/45 hover:bg-sky-500/[0.07]",
  },
  {
    id: "PDF",
    label: "PDF",
    hint: "One PDF, swiped as pages",
    icon: FileText,
    well: "bg-amber-500/[0.14] text-amber-300 inset-ring-amber-400/25",
    glow: "hover:inset-ring-amber-400/45 hover:bg-amber-500/[0.07]",
  },
  {
    id: "Reshare",
    label: "Reshare",
    hint: "Keeps the original post\u2019s media",
    icon: Repeat2,
    well: "bg-emerald-500/[0.14] text-emerald-300 inset-ring-emerald-400/25",
    glow: "hover:inset-ring-emerald-400/45 hover:bg-emerald-500/[0.07]",
  },
];

export function PostTypeModal({
  open,
  onOpenChange,
  onSelect,
  mode = "create",
  current,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: PostType) => void;
  mode?: "create" | "change";
  current?: PostType;
}) {
  const isChange = mode === "change";
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

        <DialogHeader className="p-0 text-left">
          <div className="px-6 pb-4 pt-6">
            <DialogTitle className="text-[22px] font-semibold leading-tight tracking-[-0.022em] text-balance">
              {isChange ? "Change post type" : "What are you posting?"}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-[13px] leading-snug text-muted-foreground text-pretty">
              {isChange
                ? "Your copy is kept. Anything attached that the new type can\u2019t carry comes off."
                : "This decides which fields the composer gives you."}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-1.5 border-t border-(--ink)/[0.06] p-3">
          {TYPES.map(({ id, label, hint, icon: Icon, well, glow }, i) => {
            const isCurrent = isChange && current === id;
            return (
            <button
              key={id}
              onClick={() => (isCurrent ? onOpenChange(false) : onSelect(id))}
              aria-current={isCurrent ? "true" : undefined}
              style={{ animation: `post-type-in 400ms ${EASE} ${i * 55}ms both` }}
              className={cn(
                "group flex items-center gap-3.5 rounded-(--r-float) px-3.5 py-3.5 text-left inset-ring-1 transition-[background-color,box-shadow,scale] duration-200 active:scale-(--press-lg)",
                isCurrent
                  ? "bg-(--ink)/[0.07] inset-ring-(--ink)/[0.16]"
                  : cn("bg-(--ink)/[0.028] inset-ring-(--ink)/[0.07]", glow),
              )}
              onMouseDown={(e) => e.preventDefault()}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-(--r-inner) inset-ring-1 transition-transform duration-300 group-hover:scale-[1.06]",
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
                <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">
                  {hint}
                </span>
              </span>

              {isCurrent ? (
                <Check className="size-4 shrink-0 text-violet-300" />
              ) : (
                <ChevronRight
                  className="size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-[opacity,translate] duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                  style={{ transitionTimingFunction: EASE }}
                />
              )}
            </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-(--ink)/[0.06] px-6 py-3">
          <span className="text-[11px] text-muted-foreground/70">
            {isChange ? "Your copy is never touched" : "Set once, at the start"}
          </span>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-9 items-center rounded-(--r-pill) px-3.5 text-[13px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
