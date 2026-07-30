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
const MAX_VISIBLE = 3;

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: "default" | "success" | "danger";
  action?: ToastAction;
  durationMs?: number;
}

interface ToastRecord extends ToastOptions {
  id: number;
  open: boolean;
  closing: boolean;
}

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const [paused, setPaused] = useState(false);
  const nextId = useRef(1);
  const clocks = useRef(
    new Map<number, { timeout: ReturnType<typeof setTimeout>; endsAt: number; left: number }>(),
  );

  const dismiss = useCallback((id: number) => {
    const clock = clocks.current.get(id);
    if (clock) {
      clearTimeout(clock.timeout);
      clocks.current.delete(id);
    }
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
      requestAnimationFrame(() =>
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, open: true } : t))),
      );
      arm(id, options.durationMs ?? DEFAULT_DURATION);
    },
    [arm],
  );

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
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) return null;

  return createPortal(
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      onPointerEnter={onPause}
      onPointerLeave={onResume}
      onFocusCapture={onPause}
      onBlurCapture={onResume}
      className={cn(
        "pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(360px,calc(100vw-2.5rem))] flex-col transition-[gap] duration-250",
        paused ? "gap-2.5" : "gap-1.5",
      )}
      style={{ transitionTimingFunction: EASE }}
    >
      {toasts.map((t, i) => (
        <ToastCard
          key={t.id}
          toast={t}
          depth={paused ? 0 : toasts.length - 1 - i}
          paused={paused}
          onDismiss={() => onDismiss(t.id)}
        />
      ))}
    </div>,
    document.body,
  );
}

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

  const recede = Math.min(depth, 2);

  return (
    <div
      className={cn(
        "pointer-events-auto relative overflow-hidden rounded-(--r-float) bg-(--surface-float) shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.09]",
        "transition-[opacity,translate,scale] duration-240 motion-reduce:transition-none",
        toast.closing
          ? "translate-x-8 scale-[0.98] opacity-0"
          : toast.open
          ? "translate-y-0 opacity-100"
          : "translate-y-2 scale-[0.97] opacity-0",
      )}
      style={{
        transitionTimingFunction: EASE,
        ...(toast.open && !toast.closing
          ? {
              scale: `${1 - recede * 0.02}`,
              opacity: 1 - recede * 0.18,
            }
          : null),
      }}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px [background-image:var(--specular)]"
      />

      {toast.open && !toast.closing && (
        <span
          aria-hidden
          className={cn(
            "absolute bottom-0 left-3.5 right-3.5 h-px origin-left rounded-(--r-pill) motion-reduce:hidden",
            t.bar,
          )}
          style={{
            animation: `toast-drain ${toast.durationMs ?? DEFAULT_DURATION}ms linear forwards`,
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
