"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { Check, Info, Trash2, Undo2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = "cubic-bezier(0.2,0,0,1)";
const DEFAULT_DURATION = 4200;
/** Beyond this the stack starts covering the app it is reporting on. */
const MAX_VISIBLE = 3;

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: "default" | "success" | "danger";
  /** A second chance, for anything destructive. Dismisses the toast when taken. */
  action?: ToastAction;
  durationMs?: number;
}

interface ToastRecord extends ToastOptions {
  id: number;
  /** Drives the enter transition; false for one frame on mount. */
  open: boolean;
  /** Set while the exit transition plays, so leaving can differ from arriving. */
  closing: boolean;
}

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

/**
 * Toasts: the app confirming something happened somewhere you are not looking.
 *
 * Deliberately not a status inside the control that triggered it — a button
 * that turns green reports success only to the person still staring at the
 * button, and it holds the dialog open to do it. A toast leaves the trigger
 * free to close and puts the confirmation somewhere consistent.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const [paused, setPaused] = useState(false);
  const nextId = useRef(1);
  /** Per-toast countdown, kept as a deadline so it can be paused and resumed. */
  const clocks = useRef(
    new Map<number, { timeout: ReturnType<typeof setTimeout>; endsAt: number; left: number }>(),
  );

  const dismiss = useCallback((id: number) => {
    const clock = clocks.current.get(id);
    if (clock) {
      clearTimeout(clock.timeout);
      clocks.current.delete(id);
    }
    // Out-transition first, unmount after — removing the node immediately would
    // make every toast vanish rather than leave.
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, closing: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 240);
  }, []);

  const arm = useCallback(
    (id: number, ms: number) => {
      clocks.current.set(id, {
        timeout: setTimeout(() => dismiss(id), ms),
        endsAt: Date.now() + ms,
        left: ms,
      });
    },
    [dismiss],
  );

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      setToasts((prev) => [
        ...prev.slice(-(MAX_VISIBLE - 1)),
        { ...options, id, open: false, closing: false },
      ]);
      // Mount closed, open on the next frame, so the enter transition has a
      // "from" state to travel out of.
      requestAnimationFrame(() =>
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, open: true } : t))),
      );
      arm(id, options.durationMs ?? DEFAULT_DURATION);
    },
    [arm],
  );

  /**
   * Reading a toast must not cost you the toast. Hovering stops the clock as
   * well as the bar — pausing only the bar would be theatre, since the thing
   * would still vanish mid-sentence.
   */
  const pause = useCallback(() => {
    clocks.current.forEach((clock) => {
      clearTimeout(clock.timeout);
      clock.left = Math.max(0, clock.endsAt - Date.now());
    });
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    setPaused(false);
    clocks.current.forEach((clock, id) => {
      clock.timeout = setTimeout(() => dismiss(id), clock.left);
      clock.endsAt = Date.now() + clock.left;
    });
  }, [dismiss]);

  useEffect(() => {
    const pending = clocks.current;
    return () => {
      pending.forEach((c) => clearTimeout(c.timeout));
      pending.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastViewport
        toasts={toasts}
        paused={paused}
        onDismiss={dismiss}
        onPause={pause}
        onResume={resume}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast must be used inside <ToastProvider>");
  return toast;
}

function ToastViewport({
  toasts,
  paused,
  onDismiss,
  onPause,
  onResume,
}: {
  toasts: ToastRecord[];
  paused: boolean;
  onDismiss: (id: number) => void;
  onPause: () => void;
  onResume: () => void;
}) {
  // Portalled to the body: the trigger's stacking context is often a dialog
  // that is about to close, and the confirmation must outlive it. Portals do
  // not exist during SSR, so the viewport waits for the client — via the store
  // hook rather than a mount effect, which is a render-triggering round trip.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) return null;

  return createPortal(
    <div
      // aria-live so the confirmation reaches a screen reader too, which is the
      // whole population the green-button pattern left out.
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      // Pointer AND focus: a keyboard user tabbing to Dismiss deserves the same
      // stay of execution as someone resting the mouse there.
      onPointerEnter={onPause}
      onPointerLeave={onResume}
      onFocusCapture={onPause}
      onBlurCapture={onResume}
      className={cn(
        "pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(360px,calc(100vw-2.5rem))] flex-col transition-[gap] duration-250",
        // Collapsed, the deck is tight; attended to, it opens up.
        paused ? "gap-2.5" : "gap-1.5",
      )}
      style={{ transitionTimingFunction: EASE }}
    >
      {toasts.map((t, i) => (
        <ToastCard
          key={t.id}
          toast={t}
          // How far back in the deck this card sits. The newest is always at the
          // front, which is where the eye goes.
          depth={paused ? 0 : toasts.length - 1 - i}
          paused={paused}
          onDismiss={() => onDismiss(t.id)}
        />
      ))}
    </div>,
    document.body,
  );
}

/**
 * Tone is carried by the medallion and the drain bar. That is the whole system.
 *
 * The first pass stacked a radial wash, a tinted hairline and a coloured outer
 * glow on one 360px card, and three light sources on an object that small reads
 * as decoration rather than as meaning. The card is now the same flat, quiet
 * surface every other panel in the app uses — identical geometry for all three
 * tones — and the colour sits in one place, where the eye lands first.
 */
const TONES = {
  default: {
    medallion: "bg-(--ink)/[0.07] text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.12]",
    bar: "bg-(--ink)/20",
  },
  success: {
    medallion: "bg-emerald-500/[0.14] text-emerald-300 inset-ring-1 inset-ring-emerald-400/30",
    bar: "bg-emerald-400/60",
  },
  danger: {
    medallion: "bg-red-500/[0.14] text-red-300 inset-ring-1 inset-ring-red-400/30",
    bar: "bg-red-400/60",
  },
} as const;

function ToastCard({
  toast,
  depth,
  paused,
  onDismiss,
}: {
  toast: ToastRecord;
  depth: number;
  paused: boolean;
  onDismiss: () => void;
}) {
  const tone = toast.tone ?? "default";
  const t = TONES[tone];
  const Glyph = tone === "success" ? Check : tone === "danger" ? Trash2 : Info;

  // Receding, not shrinking: two steps back is the most that still reads as the
  // same object further away. Past that it looks like a smaller card.
  const recede = Math.min(depth, 2);

  return (
    <div
      className={cn(
        "pointer-events-auto relative overflow-hidden rounded-(--r-float) bg-(--surface-float) shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.09]",
        // Arrives rising from below; leaves toward the right edge, so dismissal
        // reads as the card going away rather than the entrance played backwards.
        "transition-[opacity,translate,scale] duration-240 motion-reduce:transition-none",
        toast.closing
          ? "translate-x-8 scale-[0.98] opacity-0"
          : toast.open
          ? "translate-y-0 opacity-100"
          : "translate-y-2 scale-[0.97] opacity-0",
      )}
      style={{
        transitionTimingFunction: EASE,
        // Only while stacked and settled — an entering or leaving card owns its
        // own transform and must not fight the deck for it.
        ...(toast.open && !toast.closing
          ? {
              scale: `${1 - recede * 0.02}`,
              opacity: 1 - recede * 0.18,
            }
          : null),
      }}
    >
      {/* Specular top edge, the same one every raised surface in the app wears —
          neutral, because it describes the light in the room, not the message. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px [background-image:var(--specular)]"
      />

      {/* The life left on the clock, drawn as it drains. Also the thing that
          makes the toast feel like it is leaving on purpose rather than
          disappearing on you. */}
      {toast.open && !toast.closing && (
        <span
          aria-hidden
          className={cn(
            // Inset from the corners so it reads as a measure inside the card
            // rather than a stripe stuck to its edge.
            "absolute bottom-0 left-3.5 right-3.5 h-px origin-left rounded-(--r-pill) motion-reduce:hidden",
            t.bar,
          )}
          style={{
            animation: `toast-drain ${toast.durationMs ?? DEFAULT_DURATION}ms linear forwards`,
            // Held, not restarted: the bar resumes from exactly where it stopped.
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      )}

      <div className="relative flex items-start gap-3 px-3.5 py-3">
      <span
        className={cn(
          "mt-px flex size-6 shrink-0 items-center justify-center rounded-(--r-pill)",
          t.medallion,
        )}
      >
        <Glyph className="size-3" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-snug tracking-[-0.005em]">
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground text-pretty">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onDismiss();
            }}
            className="mt-2 flex h-7 items-center gap-1.5 rounded-(--r-pill) bg-(--ink)/[0.05] px-2.5 text-[12px] font-medium inset-ring-1 inset-ring-(--ink)/[0.10] transition-[background-color,box-shadow,scale] duration-150 hover:bg-(--ink)/[0.09] hover:inset-ring-(--ink)/20 active:scale-(--press)"
          >
            <Undo2 className="size-3" />
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-mr-1 -mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-(--r-pill) text-muted-foreground opacity-70 transition-[background-color,color,opacity,scale] duration-150 hover:bg-(--ink)/[0.08] hover:text-foreground hover:opacity-100 active:scale-(--press)"
      >
        <X className="size-3.5" />
      </button>
      </div>
    </div>
  );
}
