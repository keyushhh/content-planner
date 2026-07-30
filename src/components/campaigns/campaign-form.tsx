"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ImageIcon,
  Trash2,
  UploadCloud,
  Users,
} from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { CampaignLandingPreview } from "./campaign-landing-preview";
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

export function CampaignForm({
  draft,
  missing,
  touched,
  onChange,
  onSettingsChange,
  error,
  onError,
  onDismissError,
  footer,
}: {
  draft: NewCampaign;
  missing: { key: keyof NewCampaign; label: string }[];
  touched: boolean;
  onChange: (patch: Partial<NewCampaign>) => void;
  onSettingsChange: (patch: Partial<CampaignSettings>) => void;
  error: string | null;
  onError: (msg: string | null) => void;
  onDismissError: () => void;
  footer?: React.ReactNode;
}) {
  const [showExtra, setShowExtra] = useState(false);

  const showIssue = (key: keyof NewCampaign) =>
    touched && missing.some((field) => field.key === key);

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto [background-image:var(--wash-page)] @container flex flex-col">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-12 px-6 pb-24 pt-10 @[1000px]:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-8 lg:pr-8">
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
                  onChange={(logoUrl) => onChange({ logoUrl })}
                  onError={onError}
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
                  onChange={(e) => onChange({ name: e.target.value })}
                  placeholder="iPhone 18 Pro launch"
                  className={inputClass(showIssue("name"))}
                />
              </FieldRow>

              <FieldRow label="Tag" hint="A short label for your own sorting.">
                <input
                  value={draft.tag}
                  onChange={(e) => onChange({ tag: e.target.value.toUpperCase() })}
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
                        onClick={() => onChange({ tag: suggestion })}
                        className="flex h-7 items-center rounded-full bg-(--ink)/[0.03] px-3 text-[10.5px] font-semibold font-(family-name:--font-label) uppercase tracking-[0.06em] text-muted-foreground/80 inset-ring-1 inset-ring-(--ink)/[0.08] transition-all duration-200 hover:bg-violet-500/10 hover:text-violet-500 hover:inset-ring-violet-500/30 active:scale-95"
                      >
                        {suggestion}
                      </button>
                    ))}
                </div>
              </FieldRow>

              <FieldRow
                label="Linkedin Company ID"
                hint={
                  <>
                    Please follow this <a href="https://www.linkedin.com/help/linkedin/answer/a511394/find-your-linkedin-page-id" target="_blank" rel="noopener noreferrer" className="text-violet-400 transition-colors hover:text-violet-300 hover:underline">link</a> to get find Linkedin Company ID
                  </>
                }
              >
                <input
                  value={draft.linkedInCompanyId || ""}
                  onChange={(e) => onChange({ linkedInCompanyId: e.target.value })}
                  className={inputClass(false)}
                />
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
                  onChange={(headerUrl) => onChange({ headerUrl })}
                  onError={onError}
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
                  onChange={(description) => onChange({ description })}
                  ariaLabel="Campaign page description"
                  placeholder="Scan the QR code to share this post on LinkedIn and win exciting gifts."
                />
              </FieldRow>
            </Section>

            <Section label="Post-share behavior">
              <FieldRow
                label="Thank you message"
                required
                issue={showIssue("thankYou")}
                hint="Shown after a user successfully shares a post."
              >
                <input
                  value={draft.thankYou}
                  onChange={(e) => onChange({ thankYou: e.target.value })}
                  placeholder="Thank you for participating"
                  className={inputClass(showIssue("thankYou"))}
                />
              </FieldRow>

              <FieldRow
                label="Redirection URL"
                hint="Where to route users afterwards. Leave empty to keep them on the page."
              >
                <input
                  value={draft.redirectUrl}
                  onChange={(e) => onChange({ redirectUrl: e.target.value })}
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
                layout="horizontal"
              >
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      inputClass(showIssue("endDate")),
                      "flex items-center justify-between text-left",
                      !draft.endDate && "text-muted-foreground/50",
                    )}
                  >
                    {draft.endDate ? format(parseISO(draft.endDate), "PPP") : "Select a date..."}
                    <ChevronDown className="size-4 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[220px] p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={draft.endDate ? parseISO(draft.endDate) : undefined}
                      onSelect={(date) => {
                        onChange({ endDate: date ? format(date, "yyyy-MM-dd") : "" });
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </FieldRow>
            </Section>

            <section className="flex flex-col overflow-hidden rounded-[20px] bg-(--surface-panel) shadow-sm inset-ring-1 inset-ring-(--ink)/[0.06]">
              <button
                onClick={() => setShowExtra((v) => !v)}
                aria-expanded={showExtra}
                className="flex w-full items-center gap-3 bg-(--ink)/[0.015] px-6 py-4 text-left transition-colors hover:bg-(--ink)/[0.03]"
              >
                <div className="flex flex-1 flex-col">
                  <span className="text-[15px] font-semibold tracking-tight text-foreground/90">
                    Additional settings
                  </span>
                  <span className="mt-0.5 truncate text-[12px] text-muted-foreground/80">
                    {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
                    {(() => {
                      const active = TOGGLES.filter(({ key }) => draft.settings[key]);
                      return active.length > 0
                        ? active.map((t) => t.label).join(", ")
                        : "None enabled";
                    })()}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground/50 transition-transform duration-300",
                    showExtra && "rotate-180",
                  )}
                />
              </button>

              {showExtra && (
                <div className="flex flex-col gap-2 border-t border-(--ink)/[0.04] px-6 py-5">
                  {TOGGLES.map(({ key, label, hint }) => (
                    <SettingToggle
                      key={key}
                      label={label}
                      hint={hint}
                      on={draft.settings[key]}
                      onChange={(value) => onSettingsChange({ [key]: value })}
                    />
                  ))}

                  <span aria-hidden className="my-3 h-px bg-(--ink)/[0.06]" />

                  <SettingToggle
                    icon={Users}
                    label="Community invitation"
                    hint="Invite the people who share into your community."
                    on={draft.settings.communityInvitation}
                    onChange={(communityInvitation) =>
                      onSettingsChange({ communityInvitation })
                    }
                  />

                  {draft.settings.communityInvitation && (
                    <div className="ml-[34px] mt-2 border-l-2 border-violet-500/20 pl-4">
                      <span className="block text-[13px] font-semibold text-foreground/80">Job roles</span>
                      <span className="mt-1 block text-[12px] text-muted-foreground text-pretty">
                        Which roles this campaign&rsquo;s invite applies to.
                      </span>
                      <span className="mt-2 block text-[12px] text-muted-foreground/60 italic">
                        No job roles defined yet. They come from Community settings.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          <aside className="min-w-0">
            <div className="@[1000px]:sticky @[1000px]:top-10">
              <span className="mb-3.5 flex shrink-0 items-center gap-2 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Public page preview
              </span>
              <CampaignLandingPreview draft={draft} className="shadow-xl shadow-black/5 ring-1 ring-(--ink)/[0.08]" />
            </div>
          </aside>
        </div>

        {footer && (
          <div className="sticky bottom-0 z-10 mt-auto border-t border-(--ink)/[0.06] bg-background/80 p-4 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-8">
              <div className="min-w-0 flex-1 pr-8">
                {missing.length > 0 ? (
                  <div className="flex items-center gap-2 text-[13px] text-amber-500 animate-in fade-in">
                    <span className="shrink-0 font-semibold">Required to launch:</span>
                    <span className="truncate opacity-90">
                      {missing.map((field) => field.label).join(", ")}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[13px] text-emerald-500 animate-out fade-out fill-mode-forwards duration-1000 delay-1000">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span className="truncate font-semibold">Ready to launch</span>
                  </div>
                )}
              </div>
              <div className="shrink-0">{footer}</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex shrink-0 items-center gap-2 border-t border-amber-400/20 bg-amber-500/10 px-6 py-2.5 text-[12.5px] text-amber-200">
          <AlertCircle className="size-4 shrink-0" />
          <span className="min-w-0 flex-1">{error}</span>
          <button
            onClick={onDismissError}
            className="shrink-0 rounded-(--r-pill) px-2 py-0.5 text-[11.5px] font-medium transition-colors duration-150 hover:bg-amber-400/15"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}

function inputClass(issue: boolean) {
  return cn(
    "h-10 w-full rounded-xl bg-(--ink)/[0.02] px-3.5 text-[14px] caret-violet-500 outline-none transition-[box-shadow,background-color] duration-200 inset-ring-1 placeholder:text-muted-foreground/40 focus:bg-(--ink)/[0.04]",
    issue
      ? "inset-ring-amber-500/50 focus:inset-ring-amber-500/80"
      : "inset-ring-(--ink)/[0.08] hover:inset-ring-(--ink)/[0.15] focus:inset-ring-violet-500/50 focus:hover:inset-ring-violet-500/50",
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
    <section className="flex min-w-0 flex-col overflow-hidden rounded-[20px] bg-(--surface-panel) shadow-sm inset-ring-1 inset-ring-(--ink)/[0.06]">
      <div className="border-b border-(--ink)/[0.04] bg-(--ink)/[0.015] px-6 py-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground/90">
          {label}
        </h2>
      </div>
      <div className="flex flex-col gap-6 px-6 py-6">{children}</div>
    </section>
  );
}

function FieldRow({
  label,
  hint,
  required,
  issue,
  children,
  layout = "vertical",
}: {
  label: string;
  hint?: React.ReactNode;
  required?: boolean;
  issue?: boolean;
  children: React.ReactNode;
  layout?: "vertical" | "horizontal";
}) {
  if (layout === "horizontal") {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="flex flex-col min-w-0 pr-4">
          <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-foreground/80">
            {label}
            {required && (
              <span
                aria-label="required"
                className={cn(issue ? "text-amber-500" : "text-violet-500/70")}
              >
                *
              </span>
            )}
          </span>
          {hint && (
            <span className="mt-0.5 text-[12px] text-muted-foreground/70 text-pretty">
              {hint}
            </span>
          )}
        </div>
        <div className="min-w-[220px] shrink-0">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col">
      <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-foreground/80">
        {label}
        {required && (
          <span
            aria-label="required"
            className={cn(issue ? "text-amber-500" : "text-violet-500/70")}
          >
            *
          </span>
        )}
      </span>
      {hint && (
        <span className="mb-2.5 mt-0.5 text-[12px] text-muted-foreground/70 text-pretty">
          {hint}
        </span>
      )}
      <div className={cn("min-w-0", !hint && "mt-2.5")}>{children}</div>
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
          "group flex w-full items-center justify-start gap-4 rounded-xl border border-dashed px-4 py-3.5 text-left transition-all duration-200 active:scale-[0.995]",
          over
            ? "border-violet-500/50 bg-violet-500/[0.04]"
            : "border-(--ink)/[0.15] bg-(--ink)/[0.015] hover:border-violet-500/30 hover:bg-(--ink)/[0.03]",
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background shadow-sm inset-ring-1 inset-ring-(--ink)/[0.06] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md">
          {busy ? (
            <ImageIcon className="size-4 animate-pulse text-violet-500/70" />
          ) : (
            <UploadCloud className="size-4 text-muted-foreground/60 transition-colors group-hover:text-violet-500/80" />
          )}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-medium text-foreground/80">
            {busy ? "Reading image…" : cta}
          </span>
          <span className="mt-0.5 truncate text-[11.5px] text-muted-foreground/60">
            Click to pick, or drop a file
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
