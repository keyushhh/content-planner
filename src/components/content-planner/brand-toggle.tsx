"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Palette, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const BRAND_STORAGE_KEY = "cp_brand";

/** Classes the brand layer hangs off, applied to <html> next to `dark`. */
const BRAND_CLASS = "wozku";
const BRAND_LIGHT_CLASS = "wozku-light";

/** Fired on write so every mounted subscriber re-reads, not just this tab. */
const BRAND_EVENT = "cp:brand";

/**
 * One value rather than an `on` boolean beside a `light` boolean, since those
 * two can represent "off, but light".
 */
export type BrandMode = "off" | "dark" | "light";

function read(): BrandMode {
  try {
    const raw = window.localStorage.getItem(BRAND_STORAGE_KEY);
    // "on" is what the first version of this wrote, before light existed.
    if (raw === "on" || raw === "dark") return "dark";
    if (raw === "light") return "light";
    return "off";
  } catch {
    // Private browsing and blocked storage both throw. This is a preview
    // toggle, so failing to remember it is not worth surfacing.
    return "off";
  }
}

function apply(mode: BrandMode) {
  const root = document.documentElement;
  root.classList.toggle(BRAND_CLASS, mode !== "off");
  root.classList.toggle(BRAND_LIGHT_CLASS, mode === "light");
}

function subscribe(onChange: () => void) {
  window.addEventListener(BRAND_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(BRAND_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Which brand layer is active, stored in localStorage and mirrored onto <html>
 * as classes.
 */
export function useBrandLayer(active = true) {
  const stored = useSyncExternalStore(subscribe, read, (): BrandMode => "off");

  /** `active` is how the combined build keeps this away from Classic. */
  const mode: BrandMode = active ? stored : "off";

  const setMode = useCallback((next: BrandMode) => {
    try {
      window.localStorage.setItem(BRAND_STORAGE_KEY, next);
    } catch {
      // as above: the classes still apply, they just won't survive a reload
    }
    apply(next);
    window.dispatchEvent(new Event(BRAND_EVENT));
  }, []);

  // Keeps <html> honest when the value did not come from this tab's click: a
  // second tab switching it, or the stored value on first paint.
  if (typeof document !== "undefined") apply(mode);

  return { mode, setMode };
}

const MODES: { id: Exclude<BrandMode, "off">; label: string; Icon: typeof Sun }[] = [
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "light", label: "Light", Icon: Sun },
];

/**
 * Switches between the app's own visual language and the Wozku brand system,
 * and inside the brand, between its two themes.
 */
export function BrandToggle({
  mode,
  onChange,
}: {
  mode: BrandMode;
  onChange: (next: BrandMode) => void;
}) {
  const on = mode !== "off";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Wozku brand guideline"
        // Both states named, because "Brand guideline" alone leaves you guessing
        // which way the switch points.
        title={
          on
            ? "Wozku brand guideline is on. Click for the original look"
            : "Wozku brand guideline is off. Click to apply the Wozku design system"
        }
        // Turning it on lands on dark, which is the theme this app already
        // is, so one variable changes at a time: you can see what the brand
        // did before you also change what the lighting did.
        onClick={() => onChange(on ? "off" : "dark")}
        className={cn(
          // h-7 matches the dev controls beside it; the pseudo-element takes the
          // hit area to 40px tall without changing how it sits in the bar.
          "relative ml-1 flex h-7 items-center gap-2 rounded-(--r-pill) px-2.5 text-[11px] font-medium inset-ring-1 transition-[background-color,color,box-shadow,scale] duration-150 active:scale-(--press)",
          "after:absolute after:inset-x-0 after:top-1/2 after:h-10 after:-translate-y-1/2 after:content-['']",
          on
            ? "bg-violet-500/[0.14] text-violet-200 inset-ring-violet-400/40"
            : "bg-(--ink)/[0.03] text-muted-foreground inset-ring-(--ink)/[0.08] hover:bg-(--ink)/[0.06] hover:text-foreground",
        )}
      >
        <Palette className="size-3.5 shrink-0" />
        Brand guideline
        {/* The knob travels most of the track's width: one that barely moves
            reads as a dot changing colour rather than a switch throwing. */}
        <span
          aria-hidden
          className={cn(
            "relative h-3 w-[22px] shrink-0 rounded-(--r-round) transition-colors duration-200",
            on ? "bg-violet-500" : "bg-(--ink)/[0.14]",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-2 rounded-(--r-round) bg-white transition-transform duration-200",
              on && "translate-x-[10px]",
            )}
            style={{ transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
          />
        </span>
      </button>

      {/* Collapsed by grid template rather than unmounted, so the reveal
          slides the control out from nothing instead of making the toolbar
          jump. */}
      <div
        aria-hidden={!on}
        className={cn(
          "grid transition-[grid-template-columns,opacity] duration-300",
          on ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
      >
        <div className="overflow-hidden">
          <div
            title="Brand theme"
            className="flex items-center gap-0.5 rounded-(--r-pill) bg-(--ink)/[0.03] p-0.5 text-[11px] font-medium whitespace-nowrap inset-ring-1 inset-ring-(--ink)/[0.08]"
          >
            {MODES.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                // Unreachable by keyboard while collapsed: a focusable child
                // inside aria-hidden is a trap, not a shortcut.
                tabIndex={on ? 0 : -1}
                aria-pressed={mode === id}
                onClick={() => onChange(id)}
                className={cn(
                  "flex h-6 items-center gap-1.5 rounded-(--r-pill) px-2 transition-[background-color,color,box-shadow,scale] duration-150 active:scale-(--press)",
                  mode === id
                    ? "bg-(--ink)/[0.11] text-foreground shadow-(--lift-sm)"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
