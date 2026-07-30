"use client";

import { useState } from "react";
import { Check, Lock, Megaphone, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PLATFORMS, isGranted } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import type { NewCampaign, Platform } from "@/lib/types";

const TAG_SUGGESTIONS = ["LAUNCH", "CONTEST", "EVENT", "ALWAYS-ON", "HIRING"];

export function CampaignCreateModal({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (draft: NewCampaign) => void;
}) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [endDate, setEndDate] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>(["linkedin"]);
  const [requested, setRequested] = useState<Platform[]>([]);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName("");
      setTag("");
      setEndDate("");
      setPlatforms(["linkedin"]);
      setRequested([]);
    }
  }

  const canCreate = name.trim().length > 0 && platforms.length > 0;

  function create() {
    if (!canCreate) return;
    onCreate({
      name: name.trim(),
      tag: tag.trim().toUpperCase(),
      endDate,
      platforms,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            create();
          }
        }}
        className="w-[480px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-(--r-surface) border-0 bg-(--surface-dialog) p-0 text-foreground shadow-(--lift-lg) inset-ring-1 inset-ring-(--ink)/[0.09] sm:max-w-[480px]"
      >
        <div
          aria-hidden
          className="h-px w-full shrink-0 [background-image:var(--specular)]"
        />

        <div className="px-6 pb-5 pt-6">
          <DialogHeader className="p-0">
            <span className="flex size-9 items-center justify-center rounded-(--r-pill) bg-violet-500/12 text-violet-300 inset-ring-1 inset-ring-violet-400/25">
              <Megaphone className="size-4" />
            </span>
            <DialogTitle className="mt-3.5 text-[19px] font-semibold tracking-[-0.018em]">
              New campaign
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-[12.5px] leading-snug text-muted-foreground text-pretty">
              Name it after the push it serves. You can send posts to it right away, and
              take it live once one is approved.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-4 border-t border-(--ink)/[0.06] px-6 py-5">
          <Field label="Campaign name" required>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="iPhone 18 Pro launch"
              className="h-9 w-full rounded-(--r-inner) bg-(--ink)/[0.04] px-3 text-[13.5px] caret-violet-400 inset-ring-1 inset-ring-(--ink)/[0.09] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted-foreground/60 focus:bg-(--ink)/[0.06] focus:inset-ring-violet-400/50"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tag">
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="LAUNCH"
                className="h-9 w-full rounded-(--r-inner) bg-(--ink)/[0.04] px-3 text-[13.5px] uppercase tracking-[0.04em] caret-violet-400 inset-ring-1 inset-ring-(--ink)/[0.09] outline-none transition-[box-shadow,background-color] duration-200 placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:bg-(--ink)/[0.06] focus:inset-ring-violet-400/50"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TAG_SUGGESTIONS.filter((t) => t !== tag.toUpperCase()).slice(0, 3).map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setTag(suggestion)}
                      className="flex h-6 items-center rounded-(--r-pill) bg-(--ink)/[0.035] px-2 text-[10px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.06em] text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.08] transition-[background-color,color,box-shadow] duration-150 hover:bg-violet-500/12 hover:text-violet-200 hover:inset-ring-violet-400/35"
                    >
                      {suggestion}
                    </button>
                  ),
                )}
              </div>
            </Field>

            <Field label="End date">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 w-full rounded-(--r-inner) bg-(--ink)/[0.04] px-3 text-[13.5px] tabular-nums caret-violet-400 inset-ring-1 inset-ring-(--ink)/[0.09] outline-none transition-[box-shadow,background-color] duration-200 focus:bg-(--ink)/[0.06] focus:inset-ring-violet-400/50 [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-90"
              />
              <span className="mt-2 block text-[11px] text-muted-foreground/70">
                Leave empty for always-on.
              </span>
            </Field>
          </div>

          <Field label="Publishes to" required>
            <div className="flex flex-col gap-1.5">
              {PLATFORMS.map((platform) => {
                const granted = isGranted(platform.id);
                const on = platforms.includes(platform.id);
                const asked = requested.includes(platform.id);

                if (!granted) {
                  return (
                    <div
                      key={platform.id}
                      className="flex items-center gap-2.5 rounded-(--r-inner) bg-(--ink)/[0.02] px-3 py-2 inset-ring-1 inset-ring-(--ink)/[0.05]"
                    >
                      <Lock className="size-3.5 shrink-0 text-muted-foreground/45" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-muted-foreground/70">
                          {platform.label}
                        </span>
                        <span className="block truncate text-[10.5px] text-muted-foreground/50">
                          {asked
                            ? "Request sent, waiting on Wozku"
                            : "Not enabled on your account yet"}
                        </span>
                      </span>
                      <button
                        type="button"
                        disabled={asked}
                        onClick={() => setRequested((prev) => [...prev, platform.id])}
                        className="flex h-7 shrink-0 items-center rounded-(--r-pill) px-2.5 text-[11.5px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.07] hover:text-foreground active:scale-(--press) disabled:pointer-events-none disabled:opacity-45"
                      >
                        {asked ? "Requested" : "Request"}
                      </button>
                    </div>
                  );
                }

                return (
                  <button
                    key={platform.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() =>
                      setPlatforms((prev) =>
                        prev.includes(platform.id)
                          ? prev.filter((p) => p !== platform.id)
                          : [...prev, platform.id],
                      )
                    }
                    className={cn(
                      "group/plat flex items-center gap-2.5 rounded-(--r-inner) px-3 py-2 text-left transition-[background-color,box-shadow] duration-150 inset-ring-1",
                      on
                        ? "bg-violet-500/[0.07] inset-ring-violet-400/35"
                        : "bg-(--ink)/[0.03] inset-ring-(--ink)/[0.08] hover:bg-(--ink)/[0.055]",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-[16px] shrink-0 items-center justify-center rounded-[4px] transition-[background-color,box-shadow] duration-150",
                        on
                          ? "bg-violet-500 text-white inset-ring-1 inset-ring-violet-400"
                          : "inset-ring-1 inset-ring-(--ink)/[0.18] group-hover/plat:inset-ring-(--ink)/40",
                      )}
                    >
                      <Check
                        className={cn(
                          "size-2.5 transition-[scale,opacity] duration-150",
                          on ? "scale-100 opacity-100" : "scale-50 opacity-0",
                        )}
                        strokeWidth={3}
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                      {platform.label}
                    </span>
                    <span className="shrink-0 text-[10.5px] tabular-nums text-muted-foreground/60">
                      {platform.limit.toLocaleString()} chars
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-(--ink)/[0.06] bg-(--sink)/[0.12] px-6 py-4">
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-9 items-center rounded-(--r-pill) px-3.5 text-[13px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
          >
            Cancel
          </button>
          <button
            disabled={!canCreate}
            onClick={create}
            title="Create campaign (⌘↵)"
            className="flex h-9 items-center gap-1.5 rounded-(--r-pill) bg-violet-600 px-4 text-[13px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,box-shadow,scale] duration-200 hover:bg-violet-500 active:scale-(--press) disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
          >
            <PlusCircle className="size-3.5" />
            Create campaign
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.08em] text-muted-foreground">
        {label}
        {required && <span className="text-violet-400/80">*</span>}
      </span>
      {children}
    </div>
  );
}
