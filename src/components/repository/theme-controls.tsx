"use client";

import { useRef, useState } from "react";
import { Image as ImageIconLucide, Trash2, Upload } from "lucide-react";
import {
  ACCEPTED_IMAGES,
  SCREEN_BOX,
  fileToScaledDataUrl,
  isAcceptedImage,
} from "@/lib/images";
import { cn } from "@/lib/utils";

export function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-medium text-muted-foreground">{label}</span>
      {hint && (
        <span className="-mt-1 text-[10.5px] leading-snug text-muted-foreground/70 text-pretty">
          {hint}
        </span>
      )}
      {children}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex w-fit items-center gap-0.5 rounded-(--r-pill) bg-(--ink)/[0.05] p-0.5 inset-ring-1 inset-ring-(--ink)/[0.06]">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex h-7 items-center rounded-(--r-pill) px-3 text-[12px] font-medium transition-[background-color,color] duration-150",
            value === option.value
              ? "bg-(--surface-float) text-foreground shadow-(--lift-sm)"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative block h-[18px] w-8 rounded-(--r-pill) transition-colors duration-200",
        on ? "bg-live-500" : "bg-(--ink)/[0.10] inset-ring-1 inset-ring-(--ink)/[0.10]",
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 block size-3.5 rounded-(--r-pill) bg-white shadow-(--lift-sm) transition-transform duration-200",
          on ? "translate-x-3.5" : "translate-x-0",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
      />
    </span>
  );
}

export function ImageSlot({
  value,
  cta,
  size,
  onChange,
}: {
  value: string;
  cta: string;
  size: string;
  onChange: (dataUrl: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept(file: File | undefined) {
    if (!file) return;
    if (!isAcceptedImage(file)) {
      setError(`${file.name} is not a JPG, PNG, WEBP or GIF.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      onChange(await fileToScaledDataUrl(file, SCREEN_BOX));
    } catch {
      setError("That image could not be read. Try another file.");
    } finally {
      setBusy(false);
    }
  }

  const file = (
    <input
      ref={input}
      type="file"
      accept={ACCEPTED_IMAGES}
      hidden
      onChange={(e) => {
        accept(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  if (value) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="aspect-video w-24 shrink-0 overflow-hidden rounded-(--r-inner) bg-(--ink)/[0.04] inset-ring-1 inset-ring-(--ink)/[0.10]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" draggable={false} className="size-full object-cover" />
        </span>
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex h-8 items-center rounded-(--r-pill) px-2.5 text-[12px] font-medium text-muted-foreground transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.07] hover:text-foreground"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Remove image"
          className="flex size-8 items-center justify-center rounded-(--r-pill) text-muted-foreground/70 transition-[background-color,color] duration-150 hover:bg-destructive/15 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
        {file}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="flex items-center gap-2.5 rounded-(--r-inner) bg-(--ink)/[0.03] px-3 py-2.5 text-left transition-colors duration-150 inset-ring-1 inset-ring-(--ink)/[0.07] hover:bg-(--ink)/[0.06]"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-(--r-inner) bg-violet-500/15 text-violet-200">
          {busy ? (
            <Upload className="size-3.5 animate-pulse" />
          ) : (
            <ImageIconLucide className="size-3.5" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-[12px] font-medium">{busy ? "Reading…" : cta}</span>
          <span className="mt-0.5 block text-[10.5px] text-muted-foreground">
            Best at {size}
          </span>
        </span>
      </button>
      {error && <span className="text-[11px] text-destructive">{error}</span>}
      {file}
    </>
  );
}

export function VideoSlot({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://vimeo.com/123456789"
        spellCheck={false}
        className="h-9 rounded-(--r-inner) bg-(--ink)/[0.04] px-3 text-[12px] text-foreground placeholder:text-muted-foreground/50 inset-ring-1 inset-ring-(--ink)/[0.08] focus:outline-none focus:inset-ring-2 focus:inset-ring-(--focus-ring)"
      />
      <span className="text-[10.5px] leading-snug text-muted-foreground/70 text-pretty">
        Vimeo, YouTube or a direct .mp4 link. It loops, and it stays muted unless you say
        otherwise.
      </span>
    </div>
  );
}
