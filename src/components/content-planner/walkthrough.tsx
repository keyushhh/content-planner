"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_ACTION_SM, SECONDARY_ACTION_SM } from "@/lib/button-styles";
import type { TourContext, TourSection, TourStep } from "@/lib/tour";

const CALLOUT_WIDTH = 312;

/* Anchors need this much clearance below, or the cut-out clips the next element. */
const SPOT_PAD = 6;
const GAP = 12;
const EDGE = 12;

const RESOLVE_TIMEOUT_MS = 1500;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function findAnchor(anchor: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour="${anchor}"]`);
}

/* Present *and* laid out: container-query-gated columns render with no box. */
function isUsable(el: HTMLElement | null): el is HTMLElement {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 1 && r.height > 1;
}

function measure(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/* Scrim panels around the cut-out. Corners belong to top/bottom, so none overlap. */
function scrimPanels(rect: Rect) {
  const top = Math.max(0, rect.top - SPOT_PAD);
  const left = Math.max(0, rect.left - SPOT_PAD);
  const bottom = rect.top + rect.height + SPOT_PAD;
  const right = rect.left + rect.width + SPOT_PAD;

  return [
    { key: "top", left: 0, top: 0, width: "100%", height: top },
    { key: "bottom", left: 0, top: bottom, width: "100%", bottom: 0 },
    { key: "left", left: 0, top, width: left, height: bottom - top },
    { key: "right", left: right, top, right: 0, height: bottom - top },
  ];
}

/* Mounted means open, so a fresh mount already starts at step one. */
export function Walkthrough({
  onOpenChange,
  steps,
  section,
  onNavigate,
  ctx,
  finishLabel,
  onFinished,
}: {
  onOpenChange: (open: boolean) => void;
  steps: TourStep[];
  section: TourSection;
  onNavigate: (section: TourSection) => void;
  ctx?: TourContext;
  finishLabel?: string;
  onFinished?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [resolving, setResolving] = useState(false);

  // Finishing returns here rather than stranding the user mid-tour.
  const homeSection = useRef<TourSection>(section);
  const calloutRef = useRef<HTMLDivElement>(null);

  // Resolved once at mount; the counter follows this, not the authored list.
  const [active] = useState(() =>
    steps.filter(
      (s) => !s.optional || s.section !== section || isUsable(findAnchor(s.anchor)),
    ),
  );

  const step = active[index];
  const isLast = index === active.length - 1;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    if (!step) return;
    if (step.section !== section) onNavigate(step.section);
  }, [step, section, onNavigate]);

  useEffect(() => {
    if (!step) return;

    let raf = 0;
    let cancelled = false;
    const startedAt = performance.now();

    function attempt() {
      if (cancelled) return;
      const el = findAnchor(step.anchor);

      if (isUsable(el)) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        raf = requestAnimationFrame(() => {
          if (cancelled) return;
          setRect(isUsable(el) ? measure(el) : null);
          setResolving(false);
        });
        return;
      }

      if (performance.now() - startedAt > RESOLVE_TIMEOUT_MS) {
        setResolving(false);
        if (step.done) {
          setRect(null);
          raf = requestAnimationFrame(attempt);
          return;
        }
        if (isLast) onOpenChange(false);
        else setIndex((i) => Math.min(i + 1, active.length - 1));
        return;
      }

      setResolving(true);
      raf = requestAnimationFrame(attempt);
    }

    attempt();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [step, active.length, isLast, onOpenChange]);

  useEffect(() => {
    if (!step) return;

    let raf = 0;
    function sync() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = findAnchor(step.anchor);
        if (isUsable(el)) setRect(measure(el));
      });
    }

    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [step]);

  const close = useCallback(() => {
    if (homeSection.current !== section) onNavigate(homeSection.current);
    onOpenChange(false);
  }, [onNavigate, onOpenChange, section]);

  const finish = useCallback(() => {
    onFinished?.();
    close();
  }, [close, onFinished]);

  const next = useCallback(() => {
    if (isLast) finish();
    else setIndex((i) => i + 1);
  }, [isLast, finish]);

  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, next, back]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!step?.done) return;
    const id = setInterval(() => {
      setTick((t) => t + 1);
      const el = findAnchor(step.anchor);
      setRect(isUsable(el) ? measure(el) : null);
    }, 250);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (!step || !ctx) return;
    void tick;
    const advance = Boolean(step.done?.(ctx));
    const rewind = !advance && Boolean(step.rewindWhen?.(ctx));
    if (!advance && !rewind) return;
    const raf = requestAnimationFrame(() => {
      if (advance) {
        if (isLast) finish();
        else setIndex((i) => i + 1);
      } else {
        setIndex((i) => Math.max(0, i - 1));
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [step, ctx, isLast, finish, tick]);

  useEffect(() => {
    if (rect && !step?.done) calloutRef.current?.focus();
  }, [rect, index, step]);

  if (!step) return null;

  const waiting = Boolean(step.done);

  const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;

  let calloutTop = waiting ? vh - 190 : vh / 2 - 80;
  let calloutLeft = vw / 2 - CALLOUT_WIDTH / 2;

  if (rect) {
    const below = rect.top + rect.height + GAP;
    const wantsTop = step.placement === "top";
    const fitsBelow = vh - below > 190;
    const fitsAbove = rect.top > 190;
    const placeBelow = wantsTop ? !fitsAbove && fitsBelow : fitsBelow || !fitsAbove;

    calloutTop = placeBelow ? below : Math.max(EDGE, rect.top - GAP - 172);
    calloutLeft = rect.left + rect.width / 2 - CALLOUT_WIDTH / 2;
    calloutLeft = Math.min(Math.max(EDGE, calloutLeft), vw - CALLOUT_WIDTH - EDGE);
    calloutTop = Math.min(Math.max(EDGE, calloutTop), vh - 190);
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]" role="presentation">
      {/* Four blurred panels, not a box-shadow scrim: a shadow can't blur. */}
      {rect ? (
        <>
          {scrimPanels(rect).map(({ key, ...box }) => (
            <div
              key={key}
              aria-hidden
              className={cn(
                "pointer-events-auto absolute backdrop-blur-[3px]",
                !resolving && "transition-all duration-200 motion-reduce:transition-none",
              )}
              style={{
                ...box,
                background: "var(--tour-dim)",
                transitionTimingFunction: "cubic-bezier(0.2,0,0,1)",
              }}
            />
          ))}
          {!waiting && (
            <div
              aria-hidden
              className="pointer-events-auto absolute"
              style={{
                top: rect.top - SPOT_PAD,
                left: rect.left - SPOT_PAD,
                width: rect.width + SPOT_PAD * 2,
                height: rect.height + SPOT_PAD * 2,
              }}
            />
          )}
        </>
      ) : waiting ? null : (
        <div
          aria-hidden
          className="pointer-events-auto absolute inset-0 backdrop-blur-[3px]"
          style={{ background: "var(--tour-dim)" }}
        />
      )}

      <div
        ref={calloutRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
        className="pointer-events-auto absolute rounded-(--r-float) bg-(--surface-float) p-4 shadow-(--lift-lg) outline-none inset-ring-1 inset-ring-(--ink)/[0.09] duration-200 animate-in fade-in zoom-in-95 motion-reduce:animate-none"
        style={{
          top: calloutTop,
          left: calloutLeft,
          width: CALLOUT_WIDTH,
          transitionTimingFunction: "cubic-bezier(0.2,0,0,1)",
        }}
      >
        <span
          id="tour-title"
          className="block text-[13.5px] font-semibold tracking-[-0.01em]"
        >
          {step.title}
        </span>
        <span
          id="tour-body"
          className="mt-1 block text-[12.5px] leading-snug text-muted-foreground text-pretty"
        >
          {step.body}
        </span>

        {waiting && step.waitingFor && (
          <span className="mt-3 flex items-center gap-2 text-[11.5px] text-violet-200/80">
            <span className="relative flex size-1.5 shrink-0">
              <span className="absolute inset-0 animate-ping rounded-(--r-round) bg-violet-400 motion-reduce:animate-none" />
              <span className="relative size-1.5 rounded-(--r-round) bg-violet-400" />
            </span>
            {step.waitingFor}
          </span>
        )}

        {isLast && finishLabel ? (
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={next}
              className={cn(PRIMARY_ACTION_SM, "h-8 w-full justify-center")}
            >
              {finishLabel}
              <ChevronRight className="size-3.5" />
            </button>
            <div className="flex items-center justify-between gap-2">
              <span className="font-(family-name:--font-label) text-[10.5px] font-semibold uppercase tracking-[0.08em] tabular-nums text-muted-foreground/70">
                {index + 1} of {active.length}
              </span>
              <button
                onClick={close}
                className="h-7 rounded-(--r-pill) px-2 text-xs text-muted-foreground transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground"
              >
                Done for now
              </button>
            </div>
          </div>
        ) : (
        <div className="mt-3.5 flex items-center justify-between gap-2">
          <span className="font-(family-name:--font-label) text-[10.5px] font-semibold uppercase tracking-[0.08em] tabular-nums text-muted-foreground/70">
            {index + 1} of {active.length}
          </span>

          <div className="flex items-center gap-1.5">
            {index > 0 && (
              <button onClick={back} className={SECONDARY_ACTION_SM}>
                <ChevronLeft className="size-3.5" />
                Back
              </button>
            )}
            {(index === 0 || waiting) && (
              <button
                onClick={close}
                className="h-7 rounded-(--r-pill) px-2.5 text-xs text-muted-foreground transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground"
              >
                Skip
              </button>
            )}
            {!waiting && (
              <button onClick={next} className={PRIMARY_ACTION_SM}>
                {isLast ? (
                  <>
                    <Check className="size-3.5" />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="size-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
