"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Loader2, Plus, Settings2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* -------------------------------------------------------------------------- */
/*  The knobs                                                                  */
/* -------------------------------------------------------------------------- */

export const OPTIMIZATIONS = [
  "Engagement",
  "Reach",
  "Clicks",
  "Saves",
  "Conversions",
] as const;

export const HOOK_FORMATS = [
  "Question",
  "Bold claim",
  "Story",
  "Statistic",
  "Contrarian take",
  "How-to",
] as const;

export const STRUCTURES = [
  "Problem → Solution",
  "Listicle",
  "Before / After",
  "Step-by-step",
  "Narrative",
  "Myth vs fact",
] as const;

export const USE_CASES = [
  "Product launch",
  "Announcement",
  "Educational",
  "Testimonial",
  "Promotion",
  "Recruiting",
] as const;

export const CTAS = [
  "Comment below",
  "DM us",
  "Link in bio",
  "Sign up",
  "Share this",
  "No CTA",
] as const;

export interface GeneratorSettings {
  count: number;
  optimization: string | null;
  hooks: string[];
  structures: string[];
  useCases: string[];
  ctas: string[];
  useEmojis: boolean;
}

const DEFAULT_SETTINGS: GeneratorSettings = {
  count: 3,
  optimization: null,
  hooks: [],
  structures: [],
  useCases: [],
  ctas: [],
  useEmojis: false,
};

/* -------------------------------------------------------------------------- */
/*  The generator                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A local stand-in for the model.
 *
 * There is no API behind this build, so the copy is composed from the post, the
 * brief and the settings rather than sampled. That is deliberate: what needs
 * demonstrating is that the knobs REACH the output — change the hook and the
 * first line changes, ask for three and you get three — and a stub that ignored
 * its inputs would demo the button while hiding the feature.
 */
function subjectOf(source: string) {
  const cleaned = source
    .replace(/@\w+/g, "")
    .replace(/[#*_>`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const firstSentence = cleaned.split(/[.!?\n]/)[0] ?? cleaned;
  const words = firstSentence.split(" ").filter(Boolean).slice(0, 9);
  return words.join(" ") || "the thing we just shipped";
}

function hookLine(format: string, subject: string, i: number) {
  const lower = subject.charAt(0).toLowerCase() + subject.slice(1);
  switch (format) {
    case "Question":
      return `Ever wondered what it takes to get ${lower} right?`;
    case "Bold claim":
      return `${subject} changes how this work gets done. Here is why.`;
    case "Story":
      return `Six months ago we were wrong about ${lower}. Here is what changed.`;
    case "Statistic":
      return `${70 + ((i * 7) % 25)}% of teams still get ${lower} wrong.`;
    case "Contrarian take":
      return `Unpopular opinion: most advice about ${lower} is backwards.`;
    case "How-to":
      return `How to think about ${lower}, in ${3 + (i % 3)} steps.`;
    default:
      return `${subject}.`;
  }
}

function bodyLines(structure: string, subject: string, detail: string) {
  switch (structure) {
    case "Listicle":
      return [
        "Three things worth knowing:",
        `1. ${subject} is the part everyone underestimates.`,
        "2. The work is mostly in what you leave out.",
        `3. ${detail}`,
      ];
    case "Before / After":
      return [
        "Before: guesswork, three tools, and a spreadsheet nobody trusted.",
        `After: ${detail}`,
      ];
    case "Step-by-step":
      return [
        "Step one, name the problem. Step two, cut the scope in half.",
        `Step three: ${detail}`,
      ];
    case "Narrative":
      return [
        "We started with a hunch and a deadline.",
        detail,
        "It worked, and not for the reason we expected.",
      ];
    case "Myth vs fact":
      return ["The myth: this is a tooling problem.", `The fact: ${detail}`];
    case "Problem → Solution":
    default:
      return [
        "The problem was never effort — it was everything living somewhere else.",
        detail,
      ];
  }
}

function useCaseLine(useCase: string, subject: string) {
  switch (useCase) {
    case "Product launch":
      return `${subject} is live today.`;
    case "Announcement":
      return `Making it official: ${subject}.`;
    case "Educational":
      return "Keep this one — it is the part that took us longest to learn.";
    case "Testimonial":
      return "“We stopped losing work between tools.” — a customer, last week.";
    case "Promotion":
      return "This week only, for anyone who wants to try it.";
    case "Recruiting":
      return "We are hiring the people who want to build the next part of this.";
    default:
      return "";
  }
}

function ctaLine(cta: string) {
  switch (cta) {
    case "Comment below":
      return "What would you add? Tell us in the comments.";
    case "DM us":
      return "Curious how it works? Send us a DM.";
    case "Link in bio":
      return "The full write-up is in the link in our bio.";
    case "Sign up":
      return "Sign up and see it on your own content.";
    case "Share this":
      return "If this was useful, pass it to someone who needs it.";
    default:
      return "";
  }
}

function optimizationTail(optimization: string | null) {
  switch (optimization) {
    case "Engagement":
      return "Which side of this are you on?";
    case "Reach":
      return "#contentmarketing #socialmedia #brandstrategy";
    case "Clicks":
      return "Read the whole thing →";
    case "Saves":
      return "Save this for the next time it comes up.";
    case "Conversions":
      return "Two minutes to set up. No card needed.";
    default:
      return "";
  }
}

const HOOK_EMOJI: Record<string, string> = {
  Question: "🤔",
  "Bold claim": "🚀",
  Story: "📖",
  Statistic: "📊",
  "Contrarian take": "🔥",
  "How-to": "🛠️",
};

export function generateVariations(
  /** The post's own copy — what the alternates are alternates OF. */
  source: string,
  /** The one-line steer, if the writer gave one. */
  brief: string,
  settings: GeneratorSettings,
): string[] {
  const subject = subjectOf(brief.trim() || source);
  const detail =
    (brief.trim() ? `${brief.trim()} ` : "") +
    source.trim().replace(/\s+/g, " ").slice(0, 150);
  const hooks = settings.hooks.length ? settings.hooks : [...HOOK_FORMATS];
  const structures = settings.structures.length
    ? settings.structures
    : [...STRUCTURES];
  const ctas = settings.ctas.length ? settings.ctas : ["Comment below", "No CTA"];

  return Array.from({ length: settings.count }, (_, i) => {
    const hook = hooks[i % hooks.length];
    const structure = structures[i % structures.length];
    const cta = ctas[i % ctas.length];
    const useCase = settings.useCases.length
      ? settings.useCases[i % settings.useCases.length]
      : null;

    const lines: string[] = [];
    lines.push(
      `${settings.useEmojis ? `${HOOK_EMOJI[hook] ?? "✨"} ` : ""}${hookLine(hook, subject, i)}`,
    );
    lines.push("");
    lines.push(...bodyLines(structure, subject, detail.trim()));

    // The use case reads as the reason for the post, so it sits where a writer
    // would put the "what this is" line: near the end, before the ask.
    if (useCase) {
      lines.push("");
      lines.push(useCaseLine(useCase, subject));
    }

    const call = ctaLine(cta);
    const tail = optimizationTail(settings.optimization);
    if (call || tail) {
      lines.push("");
      if (call) lines.push(settings.useEmojis ? `👉 ${call}` : call);
      if (tail) lines.push(tail);
    }

    return lines.join("\n").trim();
  });
}

/* -------------------------------------------------------------------------- */
/*  The panel                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Generation, attached to the field it fills.
 *
 * It is not a mode, a tab or a second screen: it opens under the copy label of
 * the alternate you are already writing, and everything it produces is offered
 * TO that field. So the controls are sized like controls and not like a landing
 * page — a one-line brief, the knobs as chips on one wrapping row, and a normal
 * button. The post's copy is the source and does not need re-pasting, so it is
 * stated once, quietly, rather than dropped into an editable box.
 */
export function GeneratePanel({
  source,
  disabled,
  onUse,
  onAddAlternates,
  onClose,
}: {
  /** The post's primary copy, which the drafts are alternates of. */
  source: string;
  disabled?: boolean;
  /** Put this draft in the field being edited. */
  onUse: (copy: string) => void;
  /** Keep these drafts as further alternates, without touching this one. */
  onAddAlternates: (copies: string[]) => void;
  onClose: () => void;
}) {
  const [brief, setBrief] = useState("");
  const [settings, setSettings] = useState<GeneratorSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "generating">("idle");
  const [drafts, setDrafts] = useState<string[] | null>(null);

  const canGenerate = !disabled && status === "idle" && source.trim().length > 0;

  // Shut, the header has to say what the settings are currently doing. Names
  // where there are one or two, counts beyond that — the point is to answer
  // "will this generate what I asked for" without opening anything.
  const settingsSummary = useMemo(() => {
    const parts = [`${settings.count} ${settings.count === 1 ? "draft" : "drafts"}`];
    if (settings.optimization) parts.push(settings.optimization);
    const named = [
      ...settings.hooks,
      ...settings.structures,
      ...settings.useCases,
      ...settings.ctas,
    ];
    if (named.length) {
      parts.push(named.length <= 2 ? named.join(", ") : `${named.length} constraints`);
    }
    if (settings.useEmojis) parts.push("emoji");
    return parts.join(" · ");
  }, [settings]);

  function generate() {
    if (!canGenerate) return;
    setStatus("generating");
    const next = generateVariations(source, brief, settings);
    // The beat is for the reader: results that appear on mousedown read as
    // canned rather than made.
    window.setTimeout(() => {
      setDrafts(next);
      setStatus("idle");
    }, 800);
  }

  return (
    <div className="flex flex-col gap-3 border-t border-(--ink)/[0.06] bg-(--ink)/[0.015] px-9 py-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-violet-200/90">
          <Sparkles className="size-3.5" />
          Generate an alternate
        </span>
        <button
          onClick={onClose}
          aria-label="Close the generator"
          className="flex size-6 items-center justify-center rounded-(--r-pill) text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.07] hover:text-foreground active:scale-(--press)"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <input
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        disabled={disabled}
        placeholder="Optional: shorter, funnier, more technical…"
        className="h-9 w-full rounded-(--r-inner) bg-(--ink)/[0.03] px-3 text-[13px] caret-violet-400 inset-ring-1 inset-ring-(--ink)/[0.08] outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-muted-foreground/70 focus:bg-(--ink)/[0.05] focus:inset-ring-violet-400/45 disabled:cursor-not-allowed disabled:opacity-70"
      />

      {/* Additional settings: a named group, disclosed, exactly as the live
          product has it — six labelled controls are six decisions, and stripping
          the labels off to save space made you learn what a chip meant. It is
          shut by default because "additional" is a promise that the panel works
          without it, and its header carries the summary so shut never means
          hidden. Emojis sit on the header row: a switch, not a field. */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            aria-expanded={settingsOpen}
            className="group flex min-w-0 items-center gap-1.5 text-left text-[12px] font-medium text-violet-300 transition-colors duration-150 hover:text-violet-200"
          >
            <Settings2 className="size-3.5 shrink-0" />
            Additional settings
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 transition-transform duration-200",
                settingsOpen && "rotate-180",
              )}
            />
            {!settingsOpen && (
              <span className="truncate text-[11px] font-normal text-muted-foreground/70">
                {settingsSummary}
              </span>
            )}
          </button>

          <Toggle
            label="Use emojis"
            checked={settings.useEmojis}
            disabled={disabled}
            onChange={(useEmojis) => setSettings((s) => ({ ...s, useEmojis }))}
          />
        </div>

        {settingsOpen && (
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 @[520px]:grid-cols-2">
            <Field label="Number of variations">
              <SelectSingle
                value={String(settings.count)}
                options={["1", "2", "3", "5"]}
                disabled={disabled}
                onChange={(v) => setSettings((s) => ({ ...s, count: Number(v) || 1 }))}
              />
            </Field>
            <Field label="Optimization">
              <SelectSingle
                value={settings.optimization}
                placeholder="Select optimization"
                options={[...OPTIMIZATIONS]}
                clearable
                disabled={disabled}
                onChange={(optimization) => setSettings((s) => ({ ...s, optimization }))}
              />
            </Field>
            <Field label="Hook format">
              <SelectMulti
                values={settings.hooks}
                options={[...HOOK_FORMATS]}
                noun="hook"
                disabled={disabled}
                onChange={(hooks) => setSettings((s) => ({ ...s, hooks }))}
              />
            </Field>
            <Field label="Structure / flow">
              <SelectMulti
                values={settings.structures}
                options={[...STRUCTURES]}
                noun="structure"
                disabled={disabled}
                onChange={(structures) => setSettings((s) => ({ ...s, structures }))}
              />
            </Field>
            <Field label="Use case">
              <SelectMulti
                values={settings.useCases}
                options={[...USE_CASES]}
                noun="use case"
                disabled={disabled}
                onChange={(useCases) => setSettings((s) => ({ ...s, useCases }))}
              />
            </Field>
            <Field label="Ideal CTA">
              <SelectMulti
                values={settings.ctas}
                options={[...CTAS]}
                noun="CTA"
                disabled={disabled}
                onChange={(ctas) => setSettings((s) => ({ ...s, ctas }))}
              />
            </Field>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground/70">
          From the post’s copy · AI can make mistakes
        </span>
        <button
          onClick={generate}
          disabled={!canGenerate}
          className={cn(
            "flex h-8 shrink-0 items-center gap-1.5 rounded-(--r-pill) px-3.5 text-[12.5px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,scale,opacity] duration-150",
            canGenerate
              ? "bg-violet-600 hover:bg-violet-500 active:scale-(--press)"
              : "cursor-not-allowed bg-violet-600/40 opacity-70",
          )}
        >
          {status === "generating" ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="size-3.5" />
              {drafts ? "Regenerate" : "Generate"}
            </>
          )}
        </button>
      </div>

      {drafts && (
        <div className="flex flex-col gap-1.5">
          {drafts.map((copy, i) => (
            <div
              key={`${i}-${copy.length}`}
              className="group rounded-(--r-inner) bg-(--ink)/[0.022] p-3 inset-ring-1 inset-ring-(--ink)/[0.07] transition-[background-color,box-shadow] duration-150 hover:inset-ring-violet-400/30"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium">
                  Draft <span className="tabular-nums">{i + 1}</span>
                  <span className="ml-1.5 font-normal tabular-nums text-muted-foreground/70">
                    {copy.length} characters
                  </span>
                </span>
                {/* "Use" replaces what is in the field, so it says so plainly and
                    stays the quieter of the two — adding is the safe one. */}
                <span className="flex shrink-0 items-center gap-1">
                  <DraftAction
                    label="Add as alternate"
                    icon={Plus}
                    onClick={() => onAddAlternates([copy])}
                  />
                  <DraftAction label="Use" onClick={() => onUse(copy)} accent />
                </span>
              </div>
              <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-[12.5px] leading-snug text-muted-foreground">
                {copy}
              </p>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-end gap-1.5 pt-0.5">
            <DraftAction label="Discard" onClick={() => setDrafts(null)} />
            {drafts.length > 1 && (
              <DraftAction
                label={`Add all ${drafts.length} as alternates`}
                icon={Plus}
                onClick={() => onAddAlternates(drafts)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Fields                                                                     */
/* -------------------------------------------------------------------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

/** 32px, not the 36px of a page form: these sit inside a panel, under a field. */
const TRIGGER =
  "flex h-8 w-full items-center justify-between gap-2 rounded-(--r-inner) bg-(--ink)/[0.03] px-2.5 text-left text-[12.5px] inset-ring-1 inset-ring-(--ink)/[0.08] transition-[background-color,box-shadow] duration-150 hover:bg-(--ink)/[0.055] data-[popup-open]:inset-ring-violet-400/45 disabled:cursor-not-allowed disabled:opacity-60";

function SelectSingle({
  value,
  options,
  placeholder = "Select…",
  clearable,
  disabled,
  onChange,
}: {
  value: string | null;
  options: string[];
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  onChange: (value: string | null) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button disabled={disabled} className={TRIGGER}>
            <span className={cn("truncate", !value && "text-muted-foreground/70")}>
              {value ?? placeholder}
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground/70" />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="min-w-[190px]">
        <DropdownMenuRadioGroup
          value={value ?? ""}
          onValueChange={(next) => onChange(String(next) || null)}
        >
          {clearable && <DropdownMenuRadioItem value="">Any</DropdownMenuRadioItem>}
          {options.map((o) => (
            <DropdownMenuRadioItem key={o} value={o}>
              {o}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SelectMulti({
  values,
  options,
  noun,
  disabled,
  onChange,
}: {
  values: string[];
  options: string[];
  /** Fills the empty label: "Choose hook(s)…". */
  noun: string;
  disabled?: boolean;
  onChange: (values: string[]) => void;
}) {
  // Names first, count second: with three picked, "Question, Story +1" tells you
  // what the generator will do — "3 selected" makes you open the menu to find out.
  const label = values.length
    ? values.length <= 2
      ? values.join(", ")
      : `${values.slice(0, 2).join(", ")} +${values.length - 2}`
    : `Choose ${noun}(s)…`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            disabled={disabled}
            className={cn(TRIGGER, values.length && "inset-ring-violet-400/30")}
          >
            <span className={cn("truncate", !values.length && "text-muted-foreground/70")}>
              {label}
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground/70" />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="min-w-[210px]">
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o}
            checked={values.includes(o)}
            // Closing after each tick would make three constraints three trips.
            closeOnClick={false}
            onCheckedChange={(checked) =>
              onChange(checked ? [...values, o] : values.filter((v) => v !== o))
            }
          >
            {o}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex shrink-0 items-center gap-2 text-[11.5px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
    >
      {/* 28×16 track, 12px knob, 2px inset on every side — the knob is placed by
          `left`/`top` and moved by exactly the slack (28 − 12 − 2 − 2 = 12px), so
          there is no arithmetic to get wrong and nothing can ride outside the
          pill. `block` because an inline span ignores width and height. */}
      <span
        aria-hidden
        className={cn(
          "relative block h-4 w-7 shrink-0 rounded-(--r-pill) transition-colors duration-200",
          checked
            ? "bg-violet-600"
            : "bg-(--ink)/[0.10] inset-ring-1 inset-ring-(--ink)/[0.10]",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 block size-3 rounded-(--r-pill) bg-white shadow-(--lift-sm) transition-transform duration-200",
            checked ? "translate-x-3" : "translate-x-0",
          )}
          style={{ transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
        />
      </span>
      {label}
    </button>
  );
}

function DraftAction({
  label,
  icon: Icon,
  accent,
  onClick,
}: {
  label: string;
  icon?: typeof Plus;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-6 items-center gap-1 rounded-(--r-pill) px-2 text-[11px] font-medium transition-[background-color,color,scale] duration-150 active:scale-(--press)",
        accent
          ? "bg-violet-500/15 text-violet-100 hover:bg-violet-500/25"
          : "text-muted-foreground hover:bg-(--ink)/[0.07] hover:text-foreground",
      )}
    >
      {Icon && <Icon className="size-3" />}
      {label}
    </button>
  );
}
