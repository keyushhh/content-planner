"use client";

import { Layers } from "lucide-react";
import { Hint } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CampaignSettings } from "@/lib/types";

/* Hints mirror the campaign editor's wording, so the same toggle reads the same in both places. */
const ROWS: {
  key: keyof Omit<CampaignSettings, "jobRoles">;
  label: string;
  hint: string;
}[] = [
  {
    key: "multiPostIntervals",
    label: "Multiple posts at intervals",
    hint: "Someone can share more than one post from this campaign, spaced out over time.",
  },
  {
    key: "holdAndFire",
    label: "Hold and fire",
    hint: "Collect the shares and release them together instead of posting as they come in.",
  },
  {
    key: "sendToAdvocates",
    label: "Send to advocates",
    hint: "Push this campaign to the advocates already following your account.",
  },
  {
    key: "communityInvitation",
    label: "Community invitation",
    hint: "Invite the people who share into your community.",
  },
];

export function CampaignSettingsPanel({
  settings,
  onChange,
  className,
}: {
  settings: CampaignSettings;
  onChange: (patch: Partial<CampaignSettings>) => void;
  className?: string;
}) {
  const enabledCount = ROWS.filter((row) => settings[row.key]).length;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-(--r-surface) bg-(--surface-raised) p-5 shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.08]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[13.5px] font-semibold">
          <Layers className="size-4 text-muted-foreground" />
          Settings
        </span>
        <span className="text-[13.5px] font-semibold tabular-nums">
          {enabledCount}/{ROWS.length}
        </span>
      </div>
      <p className="-mt-2 text-[11.5px] text-muted-foreground text-pretty">
        How this campaign behaves once a post goes out to it.
      </p>

      <div className="flex flex-col gap-2">
        {ROWS.map(({ key, label, hint }) => {
          const on = settings[key];
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-(--r-inner) bg-(--ink)/[0.025] px-3 py-2.5 inset-ring-1 inset-ring-(--ink)/[0.05]"
            >
              {/* The rail is narrow, so the label truncates — the hint carries it in full. */}
              <Hint
                label={
                  <span className="block max-w-[220px]">
                    <span className="block font-medium">{label}</span>
                    <span className="mt-0.5 block text-muted-foreground">{hint}</span>
                  </span>
                }
              >
                <span className="min-w-0 cursor-default truncate text-[12.5px] font-medium">
                  {label}
                </span>
              </Hint>
              <span className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    "rounded-(--r-pill) px-2 py-0.5 text-[10.5px] font-medium",
                    on
                      ? "bg-live-500/[0.13] text-live-300"
                      : "bg-(--ink)/[0.06] text-muted-foreground",
                  )}
                >
                  {on ? "Enabled" : "Disabled"}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={label}
                  onClick={() => onChange({ [key]: !on })}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "relative block h-[18px] w-8 rounded-(--r-pill) transition-colors duration-200",
                      on
                        ? "bg-live-500"
                        : "bg-(--ink)/[0.10] inset-ring-1 inset-ring-(--ink)/[0.10]",
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
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
