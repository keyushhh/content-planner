"use client";

import { useState } from "react";
import { Check, Code2, Copy, RotateCcw, Trophy } from "lucide-react";
import { ConfirmDialog } from "@/components/content-planner/confirm-dialog";
import { SetupSection, type SetupSectionId } from "@/components/repository/setup-section";
import { QR_TARGETS, SCREEN_LOCALES, type ContestSettings } from "@/lib/contest";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

export function ContestPanel({
  campaign,
  openSection,
  onToggleSection,
  onChange,
}: {
  campaign: Campaign;
  openSection: SetupSectionId | null;
  onToggleSection: (id: SetupSectionId) => void;
  onChange: (patch: Partial<ContestSettings>) => void;
}) {
  const contest = campaign.contest;
  const [confirmReset, setConfirmReset] = useState(false);
  const locale =
    SCREEN_LOCALES.find((l) => l.id === contest.locale) ?? SCREEN_LOCALES[0];

  return (
    <>
      <SetupSection
        icon={Trophy}
        title="Contest"
        open={openSection === "contest"}
        onToggle={() => onToggleSection("contest")}
        summary={
          contest.leaderboardCleared
            ? "Leaderboard cleared"
            : `${contest.ranked ? "Ranked" : "Flat"} board · ${locale.label}`
        }
      >
        <Field
          label="Call to action"
          hint="The line beside the QR code on the live screen."
          value={contest.ctaText}
          placeholder="Scan. Share. Win."
          onChange={(ctaText) => onChange({ ctaText })}
        />

        <Field
          label="Leaderboard title"
          value={contest.leaderboardTitle}
          placeholder="Leaderboard"
          onChange={(leaderboardTitle) => onChange({ leaderboardTitle })}
        />

        <SwitchRow
          label="Show ranks and a podium"
          hint="Off shows a flat list of everyone taking part, with no scores."
          on={contest.ranked}
          onToggle={() => onChange({ ranked: !contest.ranked })}
        />

        <Group label="QR code opens" hint="What people get when they scan the screen.">
          <div className="flex flex-col gap-1">
            {QR_TARGETS.map((target) => (
              <button
                key={target.id}
                type="button"
                role="radio"
                aria-checked={contest.qrTarget === target.id}
                onClick={() => onChange({ qrTarget: target.id })}
                className={cn(
                  "flex items-center gap-2.5 rounded-(--r-inner) px-2.5 py-2 text-left transition-colors duration-150",
                  contest.qrTarget === target.id
                    ? "bg-(--ink)/[0.07] inset-ring-1 inset-ring-(--ink)/[0.10]"
                    : "hover:bg-(--ink)/[0.04]",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-3.5 shrink-0 items-center justify-center rounded-(--r-round) transition-colors duration-150",
                    contest.qrTarget === target.id
                      ? "bg-violet-500"
                      : "inset-ring-1 inset-ring-(--ink)/25",
                  )}
                >
                  {contest.qrTarget === target.id && (
                    <span className="size-1.5 rounded-(--r-round) bg-white" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-medium">{target.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                    {target.hint}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Group>

        {contest.qrTarget !== "share" && (
          <Field
            label={`${contest.qrTarget === "quiz" ? "Quiz" : "Form"} link`}
            value={contest.qrUrl}
            placeholder="https://"
            onChange={(qrUrl) => onChange({ qrUrl })}
          />
        )}

        <Group label="Language" hint="Formats scores and numbers on the screen.">
          <select
            value={contest.locale}
            onChange={(e) => onChange({ locale: e.target.value })}
            className="h-9 rounded-(--r-inner) bg-(--ink)/[0.04] px-2.5 text-[12px] text-foreground inset-ring-1 inset-ring-(--ink)/[0.08] focus:outline-none focus:inset-ring-2 focus:inset-ring-(--focus-ring)"
          >
            {SCREEN_LOCALES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </Group>

        <div className="flex flex-col gap-2 rounded-(--r-inner) bg-(--ink)/[0.03] p-3 inset-ring-1 inset-ring-(--ink)/[0.05]">
          <span className="text-[12px] font-medium">When the contest ends</span>
          <Field
            label="Heading"
            value={contest.endHeading}
            placeholder="This contest has ended."
            onChange={(endHeading) => onChange({ endHeading })}
          />
          <SwitchRow
            label="Winners have been announced"
            hint="Switches the closing message between the two below."
            on={contest.winnersAnnounced}
            onToggle={() => onChange({ winnersAnnounced: !contest.winnersAnnounced })}
          />
          <Field
            label="Message once winners are announced"
            value={contest.endMessageAnnounced}
            placeholder="Thank you for your interest and participation!"
            muted={!contest.winnersAnnounced}
            onChange={(endMessageAnnounced) => onChange({ endMessageAnnounced })}
          />
          <Field
            label="Message while winners are pending"
            value={contest.endMessagePending}
            placeholder="The winners will be announced soon."
            muted={contest.winnersAnnounced}
            onChange={(endMessagePending) => onChange({ endMessagePending })}
          />
        </div>

        <div className="flex flex-col gap-2 rounded-(--r-inner) bg-(--ink)/[0.03] p-3 inset-ring-1 inset-ring-(--ink)/[0.05]">
          <span className="text-[12px] font-medium">Leaderboard data</span>
          <span className="text-[11px] leading-snug text-muted-foreground text-pretty">
            {contest.leaderboardCleared
              ? "The board is cleared. Rebuild it to bring past shares back."
              : "Clearing keeps the campaign running but starts the scores from zero."}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {contest.leaderboardCleared ? (
              <button
                type="button"
                onClick={() => onChange({ leaderboardCleared: false })}
                className="flex h-8 items-center gap-1.5 rounded-(--r-pill) bg-live-500/15 px-3 text-[12px] font-medium text-live-200 transition-colors duration-150 hover:bg-live-500/25"
              >
                <RotateCcw className="size-3.5" />
                Rebuild leaderboard
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex h-8 items-center gap-1.5 rounded-(--r-pill) bg-destructive/15 px-3 text-[12px] font-medium text-destructive transition-colors duration-150 hover:bg-destructive/25"
              >
                <RotateCcw className="size-3.5" />
                Clear leaderboard
              </button>
            )}
          </div>
        </div>
      </SetupSection>

      <EmbedSection
        campaign={campaign}
        open={openSection === "embed"}
        onToggle={() => onToggleSection("embed")}
      />

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Clear the leaderboard?"
        description="Every score goes back to zero and only shares from now on will count. You can rebuild it afterwards, so nothing is lost for good."
        tone="destructive"
        actions={[
          { label: "Cancel", tone: "outline", onClick: () => setConfirmReset(false) },
          {
            label: "Clear leaderboard",
            tone: "destructive",
            onClick: () => onChange({ leaderboardCleared: true }),
          },
        ]}
      />
    </>
  );
}

type EmbedView = "screen" | "leaderboard";

function EmbedSection({
  campaign,
  open,
  onToggle,
}: {
  campaign: Campaign;
  open: boolean;
  onToggle: () => void;
}) {
  const [view, setView] = useState<EmbedView>("screen");
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const src = `${origin}/c/${campaign.id}/screen${
    view === "leaderboard" ? "?only=leaderboard" : ""
  }`;
  const snippet = `<iframe\n  src="${src}"\n  title="${campaign.name}"\n  width="100%"\n  height="640"\n  style="border:0;border-radius:12px"\n  allow="autoplay; fullscreen"\n></iframe>`;

  return (
    <SetupSection
      icon={Code2}
      title="Embed"
      open={open}
      onToggle={onToggle}
      summary={view === "screen" ? "Whole screen" : "Leaderboard only"}
    >
      <p className="-mt-1 text-[11.5px] leading-snug text-muted-foreground text-pretty">
        Drop the screen into your own site. It picks up the theme and posts from here, so it
        stays in step with whatever you change.
      </p>

      <div className="flex w-fit items-center gap-0.5 rounded-(--r-pill) bg-(--ink)/[0.05] p-0.5 inset-ring-1 inset-ring-(--ink)/[0.06]">
        {(
          [
            { id: "screen", label: "Whole screen" },
            { id: "leaderboard", label: "Leaderboard only" },
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={view === option.id}
            onClick={() => setView(option.id)}
            className={cn(
              "flex h-7 items-center rounded-(--r-pill) px-3 text-[12px] font-medium transition-[background-color,color] duration-150",
              view === option.id
                ? "bg-(--surface-float) text-foreground shadow-(--lift-sm)"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <pre className="max-h-[168px] overflow-auto rounded-(--r-inner) bg-(--ink)/[0.04] p-3 pr-11 text-[11px] leading-relaxed text-foreground/85 inset-ring-1 inset-ring-(--ink)/[0.07]">
          {snippet}
        </pre>
        <button
          type="button"
          aria-label="Copy embed code"
          onClick={() => {
            navigator.clipboard.writeText(snippet);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="absolute right-2 top-2 flex h-7 items-center gap-1.5 rounded-(--r-pill) bg-(--surface-float) px-2.5 text-[11.5px] font-medium shadow-(--lift-sm) transition-colors duration-150 hover:bg-(--ink)/[0.10]"
        >
          {copied ? (
            <Check className="size-3.5 text-live-300" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <span className="text-[10.5px] leading-snug text-muted-foreground/70 text-pretty">
        The theme follows this campaign, so the embed matches whatever you set under
        Appearance.
      </span>
    </SetupSection>
  );
}

function Group({
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

function Field({
  label,
  hint,
  value,
  placeholder,
  muted,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  placeholder: string;
  muted?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", muted && "opacity-55")}>
      <span className="text-[11.5px] font-medium text-muted-foreground">{label}</span>
      {hint && (
        <span className="-mt-1 text-[10.5px] leading-snug text-muted-foreground/70 text-pretty">
          {hint}
        </span>
      )}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-(--r-inner) bg-(--ink)/[0.04] px-3 text-[12px] text-foreground placeholder:text-muted-foreground/45 inset-ring-1 inset-ring-(--ink)/[0.08] focus:outline-none focus:inset-ring-2 focus:inset-ring-(--focus-ring)"
      />
    </label>
  );
}

function SwitchRow({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0">
        <span className="block text-[12px] font-medium">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-[10.5px] leading-snug text-muted-foreground text-pretty">
            {hint}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onToggle}
        className="shrink-0"
      >
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
      </button>
    </div>
  );
}
