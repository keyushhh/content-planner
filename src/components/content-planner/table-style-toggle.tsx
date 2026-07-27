"use client";

import { Rows3, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComposerLayout } from "./session-detail-pane";

/**
 * One switch for the whole design language: it restyles the table AND decides
 * which detail-pane layout opens. Classic → Split pane, Canvas → Canvas pane.
 */
export function TableStyleToggle({
  value,
  onChange,
}: {
  value: ComposerLayout;
  onChange: (next: ComposerLayout) => void;
}) {
  const OPTIONS = [
    { id: "split", label: "Classic", icon: Rows3, hint: "Classic table + split detail pane" },
    { id: "canvas", label: "Canvas", icon: Square, hint: "Canvas table + canvas detail pane" },
  ] as const;

  return (
    <div
      role="radiogroup"
      aria-label="Design style"
      className="flex items-center gap-0.5 rounded-full bg-white/[0.03] p-0.5 inset-ring-1 inset-ring-white/[0.08]"
    >
      {OPTIONS.map(({ id, label, icon: Icon, hint }) => {
        const active = value === id;
        return (
          <button
            key={id}
            role="radio"
            aria-checked={active}
            title={hint}
            onClick={() => onChange(id)}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium transition-[background-color,color,box-shadow,scale] duration-150 active:scale-[0.96]",
              active
                ? "bg-white/[0.11] text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
