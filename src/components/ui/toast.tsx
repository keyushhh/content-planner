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
  /** Drives the enter/exit transition; false for one frame on mount. */
  open: boolean;
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
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    // Out-transition first, unmount after — removing the node immediately would
    // make every toast vanish rather than leave.
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, open: false } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 220);
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { ...options, id, open: false }]);
      // Mount closed, open on the next frame, so the enter transition has a
      // "from" state to travel out of.
      requestAnimationFrame(() =>
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, open: true } : t))),
      );
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), options.durationMs ?? DEFAULT_DURATION),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((t) => clearTimeout(t));
      pending.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
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
  onDismiss,
}: {
  toasts: ToastRecord[];
  onDismiss: (id: number) => void;
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
      className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>,
    document.body,
  );
}

/**
 * Each tone is a whole surface, not a coloured dot on a grey card: the wash
 * behind the content, the hairline, the outer glow and the medallion all carry
 * it. A confirmation should be readable from the corner of your eye — which
 * means the colour has to be in the object, not on a 12px icon inside it.
 */
const TONES = {
  default: {
    wash: "bg-[radial-gradient(120%_140%_at_0%_0%,rgba(255,255,255,0.05),transparent_60%)]",
    ring: "inset-ring-white/[0.10]",
    glow: "shadow-[0_2px_4px_rgba(0,0,0,0.35),0_20px_48px_-24px_rgba(0,0,0,1)]",
    medallion: "bg-white/[0.07] text-muted-foreground inset-ring-1 inset-ring-white/[0.12]",
    edge: "via-white/[0.12]",
    bar: "bg-white/25",
  },
  success: {
    wash: "bg-[radial-gradient(120%_140%_at_0%_0%,rgba(16,185,129,0.16),transparent_62%)]",
    ring: "inset-ring-emerald-400/25",
    glow: "shadow-[0_2px_4px_rgba(0,0,0,0.35),0_20px_48px_-24px_rgba(0,0,0,1),0_0_0_1px_rgba(16,185,129,0.06),0_12px_40px_-20px_rgba(16,185,129,0.55)]",
    medallion:
      "bg-emerald-500/15 text-emerald-300 inset-ring-1 inset-ring-emerald-400/35 shadow-[0_0_18px_-6px_rgba(16,185,129,0.8)]",
    edge: "via-emerald-300/25",
    bar: "bg-emerald-400/70",
  },
  danger: {
    wash: "bg-[radial-gradient(120%_140%_at_0%_0%,rgba(239,68,68,0.16),transparent_62%)]",
    ring: "inset-ring-red-400/25",
    glow: "shadow-[0_2px_4px_rgba(0,0,0,0.35),0_20px_48px_-24px_rgba(0,0,0,1),0_0_0_1px_rgba(239,68,68,0.06),0_12px_40px_-20px_rgba(239,68,68,0.5)]",
    medallion:
      "bg-red-500/15 text-red-300 inset-ring-1 inset-ring-red-400/35 shadow-[0_0_18px_-6px_rgba(239,68,68,0.8)]",
    edge: "via-red-300/25",
    bar: "bg-red-400/70",
  },
} as const;

function ToastCard({ toast, onDismiss }: { toast: ToastRecord; onDismiss: () => void }) {
  const tone = toast.tone ?? "default";
  const t = TONES[tone];
  const Glyph = tone === "success" ? Check : tone === "danger" ? Trash2 : Info;

  return (
    <div
      className={cn(
        "pointer-events-auto relative overflow-hidden rounded-[16px] bg-[oklch(0.235_0_0)] inset-ring-1",
        t.ring,
        t.glow,
        // Rises and settles rather than sliding flat in from the edge
        "transition-[opacity,translate,scale] duration-220 motion-reduce:transition-none",
        toast.open
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-2 scale-[0.97] opacity-0",
      )}
      style={{ transitionTimingFunction: EASE }}
    >
      {/* Specular top edge, the same one every raised surface in the app wears */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
          t.edge,
        )}
      />
      <span aria-hidden className={cn("pointer-events-none absolute inset-0", t.wash)} />

      {/* The life left on the clock, drawn as it drains. Also the thing that
          makes the toast feel like it is leaving on purpose rather than
          disappearing on you. */}
      {toast.open && (
        <span
          aria-hidden
          className={cn(
            "absolute inset-x-0 bottom-0 h-[2px] origin-left motion-reduce:hidden",
            t.bar,
          )}
          style={{
            animation: `toast-drain ${toast.durationMs ?? DEFAULT_DURATION}ms linear forwards`,
          }}
        />
      )}

      <div className="relative flex items-start gap-3 px-3.5 py-3">
      <span
        className={cn(
          "mt-px flex size-6 shrink-0 items-center justify-center rounded-full",
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
            className="mt-2 flex h-7 items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 text-[12px] font-medium inset-ring-1 inset-ring-white/[0.10] transition-[background-color,box-shadow,scale] duration-150 hover:bg-white/[0.09] hover:inset-ring-white/20 active:scale-[0.97]"
          >
            <Undo2 className="size-3" />
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-mr-1 -mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-70 transition-[background-color,color,opacity,scale] duration-150 hover:bg-white/[0.08] hover:text-foreground hover:opacity-100 active:scale-[0.94]"
      >
        <X className="size-3.5" />
      </button>
      </div>
    </div>
  );
}
