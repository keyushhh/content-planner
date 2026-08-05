"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Palette, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { HANDOFF_MODE } from "@/lib/handoff";

const BRAND_STORAGE_KEY = "cp_brand";

const BRAND_CLASS = "wozku";
const BRAND_LIGHT_CLASS = "wozku-light";

const BRAND_EVENT = "cp:brand";

export type BrandMode = "off" | "dark" | "light";

function read(): BrandMode {
  try {
    const raw = window.localStorage.getItem(BRAND_STORAGE_KEY);
    if (raw === "on" || raw === "dark") return "dark";
    if (raw === "light") return "light";
    if (raw === "off") return "off";
    return HANDOFF_MODE ? "dark" : "off";
  } catch {
    return HANDOFF_MODE ? "dark" : "off";
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

export function useBrandLayer(active = true) {
  const stored = useSyncExternalStore(subscribe, read, (): BrandMode => "off");

  const mode: BrandMode = active ? stored : "off";

  const setMode = useCallback((next: BrandMode) => {
    try {
      window.localStorage.setItem(BRAND_STORAGE_KEY, next);
    } catch {
    }
    apply(next);
    window.dispatchEvent(new Event(BRAND_EVENT));
  }, []);

  if (typeof document !== "undefined") apply(mode);

  return { mode, setMode };
}

const MODES: { id: Exclude<BrandMode, "off">; label: string; Icon: typeof Sun }[] = [
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "light", label: "Light", Icon: Sun },
];

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
        title={
          on
            ? "Wozku brand guideline is on. Click for the original look"
            : "Wozku brand guideline is off. Click to apply the Wozku design system"
        }
        onClick={() => onChange(on ? "off" : "dark")}
        className={cn(
          "relative ml-1 flex h-7 items-center gap-2 rounded-(--r-pill) px-2.5 text-[11px] font-medium inset-ring-1 transition-[background-color,color,box-shadow,scale] duration-150 active:scale-(--press)",
          "after:absolute after:inset-x-0 after:top-1/2 after:h-10 after:-translate-y-1/2 after:content-['']",
          on
            ? "bg-violet-500/[0.14] text-violet-200 inset-ring-violet-400/40"
            : "bg-(--ink)/[0.03] text-muted-foreground inset-ring-(--ink)/[0.08] hover:bg-(--ink)/[0.06] hover:text-foreground",
        )}
      >
        <Palette className="size-3.5 shrink-0" />
        Brand guideline
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

/**
 * Dark/Light picker only — no on/off switch. For the hand-off build, where brand
 * guidelines must always stay on; devs can still preview both variants.
 */
export function BrandVariantToggle({
  mode,
  onChange,
}: {
  mode: Exclude<BrandMode, "off">;
  onChange: (next: Exclude<BrandMode, "off">) => void;
}) {
  return (
    <div
      title="Wozku brand guideline"
      className="flex items-center gap-0.5 rounded-(--r-pill) bg-(--ink)/[0.03] p-0.5 text-[11px] font-medium inset-ring-1 inset-ring-(--ink)/[0.08]"
    >
      {MODES.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
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
  );
}
