"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";
import { MentionAutocomplete, MentionPopover, useMentionTarget } from "./mention-list";
import { mentionsIn, stripMention, type MentionAccount } from "@/lib/mentions";

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
        "The problem was never effort. It was everything living somewhere else.",
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
      return "Keep this one. It is the part that took us longest to learn.";
    case "Testimonial":
      return "“We stopped losing work between tools.” A customer, last week.";
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
  source: string,
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

export function GeneratePanel({
  source,
  disabled,
  onUse,
  onAddAlternates,
  onClose,
}: {
  source: string;
  disabled?: boolean;
  onUse: (copy: string) => void;
  onAddAlternates: (copies: string[]) => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const [brief, setBrief] = useState("");
  const [settings, setSettings] = useState<GeneratorSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "generating">("idle");
  const [drafts, setDrafts] = useState<string[] | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [editing, setEditing] = useState<number | null>(null);

  const canGenerate = !disabled && status === "idle" && source.trim().length > 0;
  const allPicked = Boolean(drafts) && picked.length === drafts?.length;

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
    window.setTimeout(() => {
      setDrafts(next);
      setPicked([]);
      setEditing(null);
      setStatus("idle");
    }, 800);
  }

  function discard() {
    setDrafts(null);
    setPicked([]);
    setEditing(null);
  }

  function togglePick(index: number) {
    setPicked((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  }

  function toggleAll() {
    setPicked(allPicked || !drafts ? [] : drafts.map((_, i) => i));
  }

  function saveEdit(index: number, copy: string) {
    setDrafts((prev) => prev?.map((d, i) => (i === index ? copy : d)) ?? prev);
    setEditing(null);
  }

  function addPicked() {
    if (!drafts) return;
    const copies = picked.length
      ? [...picked].sort((a, b) => a - b).map((i) => drafts[i])
      : drafts;
    onAddAlternates(copies);
    toast({
      title: `${copies.length} ${copies.length === 1 ? "alternate" : "alternates"} added`,
      description: "Find them in the variations list.",
      tone: "success",
    });
    discard();
    onClose();
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
          {drafts.length > 1 && (
            <div className="flex items-center justify-between gap-3 pl-0.5">
              <button
                role="checkbox"
                aria-checked={allPicked ? true : picked.length ? "mixed" : false}
                onClick={toggleAll}
                className="group/box flex items-center gap-2 text-[11.5px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                <CheckBox
                  checked={allPicked}
                  indeterminate={!allPicked && picked.length > 0}
                />
                Select all drafts
              </button>
              <span className="text-[11px] tabular-nums text-muted-foreground/70">
                {picked.length
                  ? `${picked.length} of ${drafts.length} selected`
                  : `${drafts.length} drafts`}
              </span>
            </div>
          )}

          {drafts.map((copy, i) => (
            <div
              key={i}
              className={cn(
                "group rounded-(--r-inner) bg-(--ink)/[0.022] p-3 inset-ring-1 transition-[background-color,box-shadow] duration-150",
                picked.includes(i)
                  ? "bg-violet-500/[0.05] inset-ring-violet-400/35"
                  : "inset-ring-(--ink)/[0.07] hover:inset-ring-violet-400/30",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <button
                    role="checkbox"
                    aria-checked={picked.includes(i)}
                    aria-label={`Select draft ${i + 1}`}
                    onClick={() => togglePick(i)}
                    className="group/box -m-1 flex shrink-0 items-center p-1"
                  >
                    <CheckBox checked={picked.includes(i)} />
                  </button>
                  <span className="truncate text-[11px] font-medium">
                    Draft <span className="tabular-nums">{i + 1}</span>
                    <span className="ml-1.5 font-normal tabular-nums text-muted-foreground/70">
                      {copy.length} characters
                    </span>
                  </span>
                </span>
                {editing !== i && (
                  <span className="flex shrink-0 items-center gap-1">
                    <DraftAction
                      label="Edit"
                      icon={Pencil}
                      onClick={() => setEditing(i)}
                    />
                    <DraftAction
                      label="Add as alternate"
                      icon={Plus}
                      onClick={() => {
                        onAddAlternates([copy]);
                        toast({
                          title: "Alternate added",
                          description: "Find it in the variations list.",
                          tone: "success",
                        });
                      }}
                    />
                    {!(allPicked && drafts.length > 1) && (
                      <DraftAction label="Use" onClick={() => onUse(copy)} accent />
                    )}
                  </span>
                )}
              </div>

              {editing === i ? (
                <DraftEditor
                  initial={copy}
                  onCancel={() => setEditing(null)}
                  onSave={(next) => saveEdit(i, next)}
                />
              ) : (
                <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-[12.5px] leading-snug text-muted-foreground">
                  {copy}
                </p>
              )}
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-end gap-1.5 pt-0.5">
            <DraftAction label="Discard" onClick={discard} />
            {drafts.length > 1 && (
              <button
                onClick={addPicked}
                className="flex h-7 items-center gap-1 rounded-(--r-pill) bg-violet-600 px-3 text-[11.5px] font-medium text-white shadow-(--lift-accent) inset-ring-1 inset-ring-(--ink)/15 transition-[background-color,scale] duration-150 hover:bg-violet-500 active:scale-(--press)"
              >
                <Plus className="size-3" />
                {picked.length
                  ? `Add ${picked.length} as ${picked.length === 1 ? "alternate" : "alternates"}`
                  : `Add all ${drafts.length} as alternates`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function PostAiAssist({
  source,
  disabled,
  onUse,
  onClose,
}: {
  source: string;
  disabled?: boolean;
  onUse: (copy: string) => void;
  onClose: () => void;
}) {
  const [brief, setBrief] = useState("");
  const [status, setStatus] = useState<"idle" | "generating">("idle");
  const [draft, setDraft] = useState<string | null>(null);

  const canGenerate = !disabled && status === "idle" && source.trim().length > 0;

  function generate() {
    if (!canGenerate) return;
    setStatus("generating");
    const [next] = generateVariations(source, brief, { ...DEFAULT_SETTINGS, count: 1 });
    window.setTimeout(() => {
      setDraft(next);
      setStatus("idle");
    }, 800);
  }

  return (
    <div className="flex flex-col gap-3 border-t border-(--ink)/[0.06] px-9 py-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-violet-200/90">
          <Sparkles className="size-3.5" />
          AI Assist
        </span>
        <button
          onClick={onClose}
          aria-label="Close AI Assist"
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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground/70">
          Rewrites this post&rsquo;s copy · AI can make mistakes
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
              {draft ? "Regenerate" : "Generate"}
            </>
          )}
        </button>
      </div>

      {draft !== null && (
        <div className="rounded-(--r-inner) bg-(--ink)/[0.022] p-3 inset-ring-1 inset-ring-(--ink)/[0.07]">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Edit the generated draft"
            className="block max-h-[280px] min-h-[80px] w-full resize-y whitespace-pre-line bg-transparent text-[12.5px] leading-snug text-foreground/90 outline-none"
          />
          <div className="mt-2 flex justify-end gap-1.5">
            <DraftAction label="Discard" onClick={() => setDraft(null)} />
            <DraftAction label="Use" onClick={() => onUse(draft)} accent />
          </div>
        </div>
      )}
    </div>
  );
}

function CheckBox({
  checked,
  indeterminate,
}: {
  checked: boolean;
  indeterminate?: boolean;
}) {
  const on = checked || Boolean(indeterminate);
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-[15px] shrink-0 items-center justify-center rounded-[4px] transition-[background-color,box-shadow,scale] duration-150",
        on
          ? "bg-violet-500 text-white inset-ring-1 inset-ring-violet-400"
          : "inset-ring-1 inset-ring-(--ink)/[0.18] group-hover/box:inset-ring-(--ink)/40",
      )}
    >
      {indeterminate ? (
        <Minus className="size-2.5" strokeWidth={3} />
      ) : (
        <Check
          className={cn(
            "size-2.5 transition-[scale,opacity] duration-150",
            checked ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
          strokeWidth={3}
        />
      )}
    </span>
  );
}

function DraftEditor({
  initial,
  onCancel,
  onSave,
}: {
  initial: string;
  onCancel: () => void;
  onSave: (copy: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const [area, mention] = useMentionTarget(value, setValue);
  const taggedIds = mentionsIn(value).map((a) => a.id);

  function toggleMention(account: MentionAccount) {
    if (taggedIds.includes(account.id)) {
      const stripped = stripMention(value, account.handle);
      setValue(stripped);
      mention.clamp(stripped);
    } else {
      mention.insert(account.handle);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <textarea
        ref={area}
        autoFocus
        value={value}
        onChange={mention.onChange}
        onSelect={mention.onSelect}
        onBlur={mention.onBlur}
        onKeyDown={(e) => {
          mention.onKeyDown(e);
          if (e.defaultPrevented) return;
          if (e.key === "Escape") {
            e.stopPropagation();
            onCancel();
          } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSave(value);
          }
        }}
        aria-label="Edit this draft"
        className="block min-h-[132px] w-full resize-y rounded-(--r-inner) bg-(--ink)/[0.04] px-3 py-2.5 text-[12.5px] leading-[1.6] caret-violet-400 inset-ring-1 inset-ring-violet-400/40 outline-none"
      />
      <MentionAutocomplete {...mention.autocomplete} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <MentionPopover
          taggedIds={taggedIds}
          onToggle={toggleMention}
          side="top"
          align="start"
        />

        <span className="flex items-center gap-1">
          <span className="mr-1 text-[11px] tabular-nums text-muted-foreground/70">
            {value.length} characters
          </span>
          <DraftAction label="Cancel" onClick={onCancel} />
          <DraftAction label="Save" onClick={() => onSave(value)} accent />
        </span>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

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
  noun: string;
  disabled?: boolean;
  onChange: (values: string[]) => void;
}) {
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
