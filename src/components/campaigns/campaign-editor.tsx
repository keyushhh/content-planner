"use client";

import { useState } from "react";
import { AlertCircle, ArrowLeft, Check } from "lucide-react";
import { missingFields } from "@/lib/campaigns";
import { cn } from "@/lib/utils";
import type { NewCampaign } from "@/lib/types";
import { CampaignForm } from "./campaign-form";

export function CampaignEditor({
  initial,
  mode,
  onCancel,
  onSave,
}: {
  initial: NewCampaign;
  mode: "create" | "edit";
  onCancel: () => void;
  onSave: (draft: NewCampaign) => void;
}) {
  const [draft, setDraft] = useState<NewCampaign>(initial);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missing = missingFields(draft);
  const ready = missing.length === 0;

  function save() {
    if (!ready) {
      setTouched(true);
      return;
    }
    onSave(draft);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-(--ink)/[0.06] px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onCancel}
            aria-label="Back to campaigns"
            className="flex size-8 shrink-0 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold tracking-tight">
              {mode === "create" ? "New campaign" : draft.name.trim() || "Campaign"}
            </h1>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {mode === "create"
                ? "This becomes a public page people land on to share your posts."
                : "Editing the public page for this campaign."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {touched && !ready && (
            <span className="hidden items-center gap-1.5 text-[11.5px] text-amber-300/90 @[720px]:flex">
              <AlertCircle className="size-3.5 shrink-0" />
              {missing.length} still needed
            </span>
          )}
          <button
            onClick={onCancel}
            className="flex h-8 items-center rounded-(--r-pill) px-3 text-[13px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.06] hover:text-foreground active:scale-(--press)"
          >
            Cancel
          </button>
          <button
            onClick={save}
            title={ready ? undefined : "Some required fields are still empty"}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-(--r-pill) px-3.5 text-[13px] font-medium transition-[background-color,box-shadow,scale,opacity] duration-200 active:scale-(--press)",
              ready
                ? "bg-violet-600 text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 hover:bg-violet-500"
                : "bg-violet-600/40 text-white/80 opacity-80",
            )}
          >
            <Check className="size-3.5" />
            {mode === "create" ? "Create campaign" : "Save changes"}
          </button>
        </div>
      </div>

      <CampaignForm
        draft={draft}
        missing={missing}
        touched={touched}
        onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
        onSettingsChange={(patch) =>
          setDraft((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
        }
        error={error}
        onError={setError}
        onDismissError={() => setError(null)}
      />
    </div>
  );
}
