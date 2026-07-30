"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  ImageIcon,
  Trash2,
  UploadCloud,
  Users,
} from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { CampaignLandingPreview } from "./campaign-landing-preview";
import { missingFields } from "@/lib/campaigns";
import {
  ACCEPTED_IMAGES,
  HEADER_BOX,
  LOGO_BOX,
  fileToScaledDataUrl,
  isAcceptedImage,
  type ImageBox,
} from "@/lib/images";
import { cn } from "@/lib/utils";
import type { CampaignSettings, NewCampaign } from "@/lib/types";

const TAG_SUGGESTIONS = ["LAUNCH", "CONTEST", "EVENT", "ALWAYS-ON", "HIRING"];

const TOGGLES: {
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
];

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
  const [showExtra, setShowExtra] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missing = missingFields(draft);
  const ready = missing.length === 0;

  function patch(next: Partial<NewCampaign>) {
    setDraft((prev) => ({ ...prev, ...next }));
  }

  function patchSettings(next: Partial<CampaignSettings>) {
    setDraft((prev) => ({ ...prev, settings: { ...prev.settings, ...next } }));
  }

  function save() {
    if (!ready) {
      setTouched(true);
      return;
    }
    onSave(draft);
  }

  const showIssue = (key: keyof NewCampaign) =>
    touched && missing.some((field) => field.key === key);

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

      <div className="min-h-0 flex-1 overflow-y-auto [background-image:var(--wash-page)] @container">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-8 px-6 pb-16 pt-6 @[1000px]:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-7">
            <Section label="Identity">
              <FieldRow
                label="Logo"
                required
                issue={showIssue("logoUrl")}
                hint="300 by 300 pixels. JPG, PNG, WEBP or GIF."
              >
                <ImageField
                  value={draft.logoUrl}
                  box={LOGO_BOX}
                  shape="square"
                  cta="Upload logo"
                  onChange={(logoUrl) => patch({ logoUrl })}
                  onError={setError}
                />
              </FieldRow>

              <FieldRow
                label="Campaign name"
                required
                issue={showIssue("name")}
                hint="The event name or a call to action. Visible to the public."
              >
                <input
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="iPhone 18 Pro launch"
                  className={inputClass(showIssue("name"))}
                />
              </FieldRow>

              <FieldRow label="Tag" hint="A short label for your own sorting.">
                <input
                  value={draft.tag}
                  onChange={(e) => patch({ tag: e.target.value.toUpperCase() })}
                  placeholder="LAUNCH"
                  className={cn(inputClass(false), "uppercase tracking-[0.04em]")}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TAG_SUGGESTIONS.filter((t) => t !== draft.tag)
                    .slice(0, 4)
                    .map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => patch({ tag: suggestion })}
                        className="flex h-6 items-center rounded-(--r-pill) bg-(--ink)/[0.035] px-2 text-[10px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.06em] text-muted-foreground inset-ring-1 inset-ring-(--ink)/[0.08] transition-[background-color,color,box-shadow] duration-150 hover:bg-violet-500/12 hover:text-violet-200 hover:inset-ring-violet-400/35"
                      >
                        {suggestion}
                      </button>
                    ))}
                </div>
              </FieldRow>
            </Section>

            <Section label="The page">
              <FieldRow
                label="Header image"
                hint="1920 by 400 pixels reads best across the top."
              >
                <ImageField
                  value={draft.headerUrl}
                  box={HEADER_BOX}
                  shape="banner"
                  cta="Upload header image"
                  onChange={(headerUrl) => patch({ headerUrl })}
                  onError={setError}
                />
              </FieldRow>

              <FieldRow
                label="Page description"
                required
                issue={showIssue("description")}
                hint="Tell people what this campaign is and why they should share it."
              >
                <RichTextEditor
                  value={draft.description}
                  onChange={(description) => patch({ description })}
                  ariaLabel="Campaign page description"
                  placeholder="Scan the QR code to share this post on LinkedIn and win exciting gifts."
                />
              </FieldRow>
            </Section>

            <Section label="After they share">
              <FieldRow
                label="Thank you message"
                required
                issue={showIssue("thankYou")}
                hint="Shown the moment someone finishes sharing."
              >
                <input
                  value={draft.thankYou}
                  onChange={(e) => patch({ thankYou: e.target.value })}
                  placeholder="Thank you for participating"
                  className={inputClass(showIssue("thankYou"))}
                />
              </FieldRow>

              <FieldRow
                label="Redirection URL"
                hint="Where to send them afterwards. Leave empty to keep them on the page."
              >
                <input
                  value={draft.redirectUrl}
                  onChange={(e) => patch({ redirectUrl: e.target.value })}
                  placeholder="https://wozku.com/thanks"
                  className={inputClass(false)}
                />
              </FieldRow>
            </Section>

            <Section label="Schedule">
              <FieldRow
                label="End date"
                required
                issue={showIssue("endDate")}
                hint="When this campaign stops collecting shares."
              >
                <input
                  type="date"
                  value={draft.endDate}
                  onChange={(e) => patch({ endDate: e.target.value })}
                  className={cn(
                    inputClass(showIssue("endDate")),
                    "tabular-nums [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-90",
                  )}
                />
              </FieldRow>
            </Section>

            <section className="rounded-(--r-float) bg-(--ink)/[0.02] inset-ring-1 inset-ring-(--ink)/[0.06]">
              <button
                onClick={() => setShowExtra((v) => !v)}
                aria-expanded={showExtra}
                className="flex w-full items-center gap-2 px-4 py-3 text-left"
              >
                <ChevronDown
                  className={cn(
                    "size-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200",
                    showExtra && "rotate-180",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium">
                    Additional settings
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {summarize(draft.settings)}
                  </span>
                </span>
              </button>

              {showExtra && (
                <div className="flex flex-col gap-1 border-t border-(--ink)/[0.06] px-4 py-3">
                  {TOGGLES.map(({ key, label, hint }) => (
                    <SettingToggle
                      key={key}
                      label={label}
                      hint={hint}
                      on={draft.settings[key]}
                      onChange={(value) => patchSettings({ [key]: value })}
                    />
                  ))}

                  <span aria-hidden className="my-1.5 h-px bg-(--ink)/[0.06]" />

                  <SettingToggle
                    icon={Users}
                    label="Community invitation"
                    hint="Invite the people who share into your community."
                    on={draft.settings.communityInvitation}
                    onChange={(communityInvitation) =>
                      patchSettings({ communityInvitation })
                    }
                  />

                  {draft.settings.communityInvitation && (
                    <div className="ml-1 mt-1 border-l border-(--ink)/[0.08] pl-3.5">
                      <span className="block text-[12px] font-medium">Job roles</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground text-pretty">
                        Which roles this campaign&rsquo;s invite applies to.
                      </span>
                      <span className="mt-1.5 block text-[11px] text-muted-foreground/70">
                        No job roles defined yet. They come from Community settings.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          <aside className="min-w-0">
            <div className="@[1000px]:sticky @[1000px]:top-0">
              <span className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/70">
                Public page
              </span>
              <CampaignLandingPreview draft={draft} />

              {missing.length > 0 && (
                <div className="mt-3 rounded-(--r-float) bg-(--ink)/[0.025] px-3.5 py-3 inset-ring-1 inset-ring-(--ink)/[0.06]">
                  <span className="text-[11px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/70">
                    Still needed
                  </span>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {missing.map((field) => (
                      <li
                        key={String(field.key)}
                        className="flex items-center gap-2 text-[12px] text-muted-foreground"
                      >
                        <span
                          aria-hidden
                          className="size-1.5 shrink-0 rounded-(--r-round) bg-amber-400/70"
                        />
                        {field.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {error && (
        <div className="flex shrink-0 items-center gap-2 border-t border-amber-400/20 bg-amber-500/10 px-6 py-2.5 text-[12.5px] text-amber-200">
          <AlertCircle className="size-4 shrink-0" />
          <span className="min-w-0 flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="shrink-0 rounded-(--r-pill) px-2 py-0.5 text-[11.5px] font-medium transition-colors duration-150 hover:bg-amber-400/15"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

function inputClass(issue: boolean) {
  return cn(
    "h-9 w-full rounded-(--r-inner) bg-(--ink)/[0.03] px-3 text-[13.5px] caret-violet-400 outline-none transition-[box-shadow,background-color] duration-200 inset-ring-1 placeholder:text-muted-foreground/50 focus:bg-(--ink)/[0.05]",
    issue
      ? "inset-ring-amber-400/50 focus:inset-ring-amber-400/70"
      : "inset-ring-(--ink)/[0.09] focus:inset-ring-violet-400/50",
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col">
      <span className="mb-3 text-[11px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.09em] text-muted-foreground/70">
        {label}
      </span>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

function FieldRow({
  label,
  hint,
  required,
  issue,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  issue?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="flex items-center gap-1 text-[12.5px] font-medium">
        {label}
        {required && (
          <span
            aria-label="required"
            className={cn(issue ? "text-amber-400" : "text-violet-400/80")}
          >
            *
          </span>
        )}
      </span>
      {hint && (
        <span className="mb-2 mt-0.5 text-[11.5px] text-muted-foreground/75 text-pretty">
          {hint}
        </span>
      )}
      <div className={cn("min-w-0", !hint && "mt-2")}>{children}</div>
    </div>
  );
}

function ImageField({
  value,
  box,
  shape,
  cta,
  onChange,
  onError,
}: {
  value: string;
  box: ImageBox;
  shape: "square" | "banner";
  cta: string;
  onChange: (dataUrl: string) => void;
  onError: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  async function accept(file: File | undefined) {
    if (!file) return;
    if (!isAcceptedImage(file)) {
      onError(`${file.name} is not a JPG, PNG, WEBP or GIF.`);
      return;
    }
    setBusy(true);
    try {
      onChange(await fileToScaledDataUrl(file, box));
    } catch {
      onError("That image could not be read. Try another file.");
    } finally {
      setBusy(false);
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "overflow-hidden bg-(--ink)/[0.04] shadow-(--lift-sm) inset-ring-1 inset-ring-(--ink)/[0.10]",
            shape === "square"
              ? "size-16 shrink-0 rounded-(--r-inner)"
              : "aspect-[1920/400] min-w-0 flex-1 rounded-(--r-inner)",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            draggable={false}
            className="size-full object-cover"
          />
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex h-8 items-center rounded-(--r-pill) px-2.5 text-[12px] font-medium text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-(--ink)/[0.07] hover:text-foreground active:scale-(--press)"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove image"
            className="flex size-8 items-center justify-center rounded-(--r-pill) text-muted-foreground/70 transition-[background-color,color,scale] duration-150 hover:bg-destructive/15 hover:text-destructive active:scale-(--press)"
          >
            <Trash2 className="size-3.5" />
          </button>
        </span>
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
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          accept(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "group flex w-full items-center gap-3 rounded-(--r-inner) px-3.5 py-3 text-left transition-[background-color,box-shadow,scale] duration-200 active:scale-[0.995] inset-ring-1",
          over
            ? "bg-violet-500/[0.09] inset-ring-violet-400/50"
            : "bg-(--ink)/[0.03] inset-ring-(--ink)/[0.09] hover:bg-violet-500/[0.05] hover:inset-ring-violet-400/35",
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-(--r-pill) bg-violet-500/10 text-violet-300 inset-ring-1 inset-ring-violet-400/25 transition-transform duration-200 group-hover:scale-[1.06]">
          {busy ? (
            <ImageIcon className="size-4 animate-pulse" />
          ) : (
            <UploadCloud className="size-4" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-medium">
            {busy ? "Reading image…" : cta}
          </span>
          <span className="block truncate text-[11px] text-muted-foreground">
            Click to pick, or drop a file here
          </span>
        </span>
      </button>
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
    </>
  );
}

function SettingToggle({
  icon: Icon,
  label,
  hint,
  on,
  onChange,
}: {
  icon?: typeof Users;
  label: string;
  hint: string;
  on: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-(--r-inner) px-1 py-2">
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[12.5px] font-medium">
          {Icon && <Icon className="size-3.5 shrink-0 text-violet-300/80" />}
          {label}
        </span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground text-pretty">
          {hint}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className="mt-0.5 shrink-0"
      >
        <span
          aria-hidden
          className={cn(
            "relative block h-[18px] w-8 rounded-(--r-pill) transition-colors duration-200",
            on
              ? "bg-violet-600"
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
    </div>
  );
}

function summarize(settings: CampaignSettings) {
  const on = [
    settings.multiPostIntervals && "multiple posts",
    settings.holdAndFire && "hold and fire",
    settings.sendToAdvocates && "advocates",
    settings.communityInvitation && "community invite",
  ].filter(Boolean) as string[];
  return on.length ? on.join(" · ") : "Nothing changed from the defaults";
}
