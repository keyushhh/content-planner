"use client";

import { useRef, useState } from "react";
import {
  Check,
  Clapperboard,
  Image as ImageIconLucide,
  Palette,
  Trash2,
  Upload,
} from "lucide-react";
import { SetupSection, type SetupSectionId } from "@/components/repository/setup-section";
import { Hint } from "@/components/ui/tooltip";
import {
  ACCENTS,
  MOMENTS,
  SCREEN_FONTS,
  type BackdropKind,
  type MomentId,
  type ScreenFontId,
  type ScreenMode,
  type ScreenTheme,
} from "@/lib/screen-theme";
import {
  ACCEPTED_IMAGES,
  SCREEN_BOX,
  fileToScaledDataUrl,
  isAcceptedImage,
} from "@/lib/images";
import { cn } from "@/lib/utils";

export function ThemePanel({
  theme,
  selectedMoment,
  openSection,
  onSelectMoment,
  onToggleSection,
  onChange,
}: {
  theme: ScreenTheme;
  selectedMoment: MomentId | null;
  openSection: SetupSectionId | null;
  onSelectMoment: (id: MomentId | null) => void;
  onToggleSection: (id: SetupSectionId) => void;
  onChange: (patch: Partial<ScreenTheme>) => void;
}) {
  function patchMoment(id: MomentId, patch: Partial<ScreenTheme["moments"][MomentId]>) {
    onChange({ moments: { ...theme.moments, [id]: { ...theme.moments[id], ...patch } } });
  }

  const runningCount = MOMENTS.filter((m) => m.fixed || theme.moments[m.id].enabled).length;
  const accent = ACCENTS.find((a) => a.id === theme.accent) ?? ACCENTS[0];
  const font = SCREEN_FONTS.find((f) => f.id === theme.font) ?? SCREEN_FONTS[0];
  const backdropSummary =
    theme.backdrop.kind === "none" ? "No backdrop" : `${theme.backdrop.kind} backdrop`;

  return (
    <>
      <SetupSection
        icon={Palette}
        title="Appearance"
        open={openSection === "appearance"}
        onToggle={() => onToggleSection("appearance")}
        summary={
          <>
            {theme.mode === "dark" ? "Dark" : "Light"} &middot; {accent.label} &middot;{" "}
            {font.label} &middot; {backdropSummary}
          </>
        }
      >
        <Row label="Colour scheme">
          <Segmented<ScreenMode>
            value={theme.mode}
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
            onChange={(mode) => onChange({ mode })}
          />
        </Row>

        <Row label="Accent" hint="Used for buttons, highlights and the share call to action.">
          <div className="flex flex-wrap items-center gap-1.5">
            {ACCENTS.map((accent) => (
              <Hint key={accent.id} label={accent.label}>
                <button
                  type="button"
                  aria-label={accent.label}
                  aria-pressed={theme.accent === accent.id}
                  onClick={() => onChange({ accent: accent.id })}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-(--r-round) transition-[box-shadow,scale] duration-150 active:scale-(--press)",
                    theme.accent === accent.id
                      ? "ring-2 ring-(--ink)/45 ring-offset-2 ring-offset-(--surface-raised)"
                      : "ring-1 ring-(--ink)/15 hover:ring-(--ink)/35",
                  )}
                  style={{ backgroundColor: accent.hex }}
                >
                  {theme.accent === accent.id && (
                    <Check className="size-3.5" style={{ color: accent.on }} />
                  )}
                </button>
              </Hint>
            ))}
          </div>
        </Row>

        <Row label="Font">
          <div className="flex flex-col gap-1">
            {SCREEN_FONTS.map((font) => (
              <button
                key={font.id}
                type="button"
                onClick={() => onChange({ font: font.id as ScreenFontId })}
                className={cn(
                  "flex items-center gap-2.5 rounded-(--r-inner) px-2.5 py-2 text-left transition-colors duration-150",
                  theme.font === font.id
                    ? "bg-(--ink)/[0.07] inset-ring-1 inset-ring-(--ink)/[0.10]"
                    : "hover:bg-(--ink)/[0.04]",
                )}
              >
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-(--r-inner) bg-(--ink)/[0.05] text-[14px] font-semibold"
                  style={{ fontFamily: font.stack }}
                >
                  Aa
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-medium">{font.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground text-pretty">
                    {font.hint}
                  </span>
                </span>
                {theme.font === font.id && (
                  <Check className="size-3.5 shrink-0 text-live-300" />
                )}
              </button>
            ))}
          </div>
        </Row>

        <Row
          label="Backdrop"
          hint="Sits behind everything on both surfaces. Whatever you pick is dimmed automatically so the text on top stays readable."
        >
          <div className="flex flex-col gap-2">
            <Segmented<BackdropKind>
              value={theme.backdrop.kind}
              options={[
                { value: "none", label: "None" },
                { value: "image", label: "Image" },
                { value: "video", label: "Video" },
              ]}
              onChange={(kind) => onChange({ backdrop: { ...theme.backdrop, kind } })}
            />

            {theme.backdrop.kind === "image" && (
              <ImageSlot
                value={theme.backdrop.imageUrl}
                cta="Upload a backdrop"
                size="1920×1080"
                onChange={(imageUrl) =>
                  onChange({ backdrop: { ...theme.backdrop, imageUrl } })
                }
              />
            )}

            {theme.backdrop.kind === "video" && (
              <VideoSlot
                value={theme.backdrop.videoUrl}
                onChange={(videoUrl) =>
                  onChange({ backdrop: { ...theme.backdrop, videoUrl } })
                }
              />
            )}
          </div>
        </Row>
      </SetupSection>

      <SetupSection
        icon={Clapperboard}
        title="Moments"
        open={openSection === "moments"}
        onToggle={() => onToggleSection("moments")}
        summary={`${runningCount} of ${MOMENTS.length} playing on the live screen`}
      >
        <p className="-mt-1 text-[11.5px] leading-snug text-muted-foreground text-pretty">
          The live screen plays these in order, then loops. Turn one on and select it to see
          it in the preview.
        </p>

        <div className="flex flex-col gap-1.5">
          {MOMENTS.map((moment, i) => {
            const value = theme.moments[moment.id];
            const on = moment.fixed || value.enabled;
            const selected = selectedMoment === moment.id;

            return (
              <div
                key={moment.id}
                className={cn(
                  "rounded-(--r-inner) transition-[background-color,box-shadow] duration-150 inset-ring-1",
                  selected
                    ? "bg-(--ink)/[0.05] inset-ring-violet-400/50"
                    : "bg-(--ink)/[0.025] inset-ring-(--ink)/[0.05]",
                )}
              >
                <div className="flex items-center gap-2.5 p-2">
                  <button
                    type="button"
                    onClick={() => onSelectMoment(selected ? null : moment.id)}
                    aria-expanded={selected}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-(--r-round) text-[10.5px] font-semibold tabular-nums transition-colors duration-150",
                        on
                          ? "bg-violet-500/20 text-violet-200"
                          : "bg-(--ink)/[0.05] text-muted-foreground/50",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-[12.5px] font-medium",
                          !on && "text-muted-foreground",
                        )}
                      >
                        {moment.label}
                      </span>
                      <span className="mt-0.5 block text-[10.5px] leading-snug text-muted-foreground/75 text-pretty">
                        {on ? moment.description : "Off. Skipped when the screen plays."}
                      </span>
                    </span>
                  </button>

                  {moment.fixed ? (
                    <Hint label="The posts are the point of the screen, so this one always plays.">
                      <span className="shrink-0 rounded-(--r-pill) bg-(--ink)/[0.05] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Always on
                      </span>
                    </Hint>
                  ) : (
                    <Hint label={value.enabled ? "Skip this moment" : "Play this moment"}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={value.enabled}
                        aria-label={`${moment.label} moment`}
                        onClick={() => {
                          patchMoment(moment.id, { enabled: !value.enabled });
                          if (!value.enabled) onSelectMoment(moment.id);
                        }}
                        className="shrink-0"
                      >
                        <Toggle on={value.enabled} />
                      </button>
                    </Hint>
                  )}
                </div>

                {selected && (
                  <div className="flex flex-col gap-3 border-t border-(--ink)/[0.06] p-3 duration-200 animate-in fade-in">
                    {moment.imageHint && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {moment.imageHint}
                        </span>
                        <ImageSlot
                          value={value.imageUrl}
                          cta={`Upload a ${moment.label.toLowerCase()} image`}
                          size={moment.imageSize ?? "1920×1080"}
                          onChange={(imageUrl) => patchMoment(moment.id, { imageUrl })}
                        />
                      </div>
                    )}

                    {moment.id === "featured" && (
                      <>
                        <VideoSlot
                          value={theme.featuredVideoUrl}
                          onChange={(featuredVideoUrl) => onChange({ featuredVideoUrl })}
                        />
                        <label className="flex items-center justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block text-[12px] font-medium">Play sound</span>
                            <span className="mt-0.5 block text-[10.5px] leading-snug text-muted-foreground text-pretty">
                              Off keeps the video silent, which is usually what you want in a
                              room with a speaker.
                            </span>
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={theme.featuredSound}
                            aria-label="Play sound"
                            onClick={() => onChange({ featuredSound: !theme.featuredSound })}
                            className="shrink-0"
                          >
                            <Toggle on={theme.featuredSound} />
                          </button>
                        </label>
                      </>
                    )}

                    <label className="flex items-center justify-between gap-3">
                      <span className="text-[12px] font-medium">
                        {moment.id === "posts" ? "Seconds per post" : "Seconds on screen"}
                      </span>
                      <span className="flex items-center gap-2">
                        <input
                          type="range"
                          min={3}
                          max={60}
                          step={1}
                          value={value.seconds}
                          onChange={(e) =>
                            patchMoment(moment.id, { seconds: Number(e.target.value) })
                          }
                          className="w-28 accent-violet-400"
                        />
                        <span className="w-9 shrink-0 text-right text-[12px] tabular-nums text-muted-foreground">
                          {value.seconds}s
                        </span>
                      </span>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SetupSection>
    </>
  );
}

function Row({
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

function Segmented<T extends string>({
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

function Toggle({ on }: { on: boolean }) {
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

function ImageSlot({
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

function VideoSlot({
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
