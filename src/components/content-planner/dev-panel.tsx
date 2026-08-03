"use client";

import { useEffect, useRef } from "react";
import { FlaskConical, X, RotateCcw, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrandMode } from "./brand-toggle";

export interface DevPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seeded: boolean;
  onToggleSeed: () => void;
  demoState: string;
  demoStates: { id: string; label: string }[];
  onDemoState: (id: string) => void;
  brandMode: BrandMode;
  onBrandMode: (mode: BrandMode) => void;
  version: string;
  versions: { id: string; label: string }[];
  onVersion: (id: string) => void;
  onResetTour: () => void;
}

const BRAND_MODES: { id: BrandMode; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
];

/* Demo scaffolding, not product — kept out of the top bar. */
export function DevPanel({
  open,
  onOpenChange,
  seeded,
  onToggleSeed,
  demoState,
  demoStates,
  onDemoState,
  brandMode,
  onBrandMode,
  version,
  versions,
  onVersion,
  onResetTour,
}: DevPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Off ⌘ so it can't collide with browser shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (!panelRef.current?.contains(e.target as Node)) onOpenChange(false);
    }
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open, onOpenChange]);

  if (!open) {
    return (
      <button
        onClick={() => onOpenChange(true)}
        title="Dev tools (Ctrl+Shift+D)"
        aria-label="Open dev tools"
        className="fixed bottom-3 left-3 z-50 flex size-7 items-center justify-center rounded-(--r-pill) text-muted-foreground/25 transition-[color,background-color] duration-150 hover:bg-(--ink)/[0.06] hover:text-muted-foreground"
      >
        <Wrench className="size-3.5" />
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Dev tools"
      className="fixed bottom-3 left-3 z-50 w-[236px] rounded-(--r-float) bg-(--surface-dialog) p-3 shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.09] duration-200 animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-(family-name:--font-label) text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          <span className="rounded-sm bg-amber-500/20 px-1 py-px text-amber-300">Dev</span>
          Tools
        </span>
        <button
          onClick={() => onOpenChange(false)}
          aria-label="Close dev tools"
          className="flex size-5 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-colors hover:bg-(--ink)/[0.08] hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      </div>

      <button
        onClick={onToggleSeed}
        className={cn(
          "mb-2.5 flex h-7 w-full items-center gap-1.5 rounded-(--r-pill) px-2.5 text-[11.5px] font-medium transition-[background-color,color] duration-150",
          seeded
            ? "bg-violet-500/[0.16] text-violet-100 inset-ring-1 inset-ring-violet-400/45"
            : "bg-(--ink)/[0.04] text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.08] hover:text-foreground",
        )}
      >
        <FlaskConical className="size-3.5" />
        {seeded ? "Remove sample items" : "Seed 450 sample items"}
      </button>

      <Segmented label="Demo state" options={demoStates} value={demoState} onChange={onDemoState} />
      <Segmented
        label="Brand layer"
        options={BRAND_MODES}
        value={brandMode}
        onChange={(id) => onBrandMode(id as BrandMode)}
      />
      <Segmented label="Version" options={versions} value={version} onChange={onVersion} />

      <button
        onClick={onResetTour}
        title="Show the first-run nudge again without clearing demo content"
        className="mt-1 flex h-7 w-full items-center gap-1.5 rounded-(--r-pill) px-2.5 text-[11.5px] font-medium text-muted-foreground transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground"
      >
        <RotateCcw className="size-3.5" />
        Reset first-run tour
      </button>
    </div>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mb-2.5">
      <span className="mb-1 block font-(family-name:--font-label) text-[9.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground/70">
        {label}
      </span>
      <div className="flex items-center gap-0.5 rounded-(--r-pill) bg-(--ink)/[0.04] p-0.5 inset-ring-1 inset-ring-(--ink)/[0.07]">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              "flex-1 truncate rounded-(--r-pill) px-1.5 py-1 text-[11px] font-medium transition-[background-color,color] duration-150",
              value === o.id
                ? "bg-(--ink)/[0.11] text-foreground shadow-(--lift-sm)"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
