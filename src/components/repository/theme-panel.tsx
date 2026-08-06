"use client";

import { useState } from "react";
import { Clapperboard, Palette } from "lucide-react";
import { SetupSection, type SetupSectionId } from "@/components/repository/setup-section";
import { ThemeStudioDialog } from "@/components/repository/theme-studio-dialog";
import { ImageSlot, Toggle, VideoSlot } from "@/components/repository/theme-controls";
import { Hint } from "@/components/ui/tooltip";
import {
  MOMENTS,
  templateOf,
  usesMoments,
  type MomentId,
  type ScreenTheme,
} from "@/lib/screen-theme";
import { cn } from "@/lib/utils";
import type { Campaign, CampaignState, MediaAsset, Session } from "@/lib/types";

export function ThemePanel({
  campaign,
  posts,
  mediaAssets,
  state,
  theme,
  selectedMoment,
  openSection,
  onSelectMoment,
  onToggleSection,
  onChange,
}: {
  campaign: Campaign;
  posts: Session[];
  mediaAssets: MediaAsset[];
  state: CampaignState;
  theme: ScreenTheme;
  selectedMoment: MomentId | null;
  openSection: SetupSectionId | null;
  onSelectMoment: (id: MomentId | null) => void;
  onToggleSection: (id: SetupSectionId) => void;
  onChange: (patch: Partial<ScreenTheme>) => void;
}) {
  const [studioOpen, setStudioOpen] = useState(false);

  function patchMoment(id: MomentId, patch: Partial<ScreenTheme["moments"][MomentId]>) {
    onChange({ moments: { ...theme.moments, [id]: { ...theme.moments[id], ...patch } } });
  }

  const runningCount = MOMENTS.filter((m) => m.fixed || theme.moments[m.id].enabled).length;
  const template = templateOf(theme);
  const sequenced = usesMoments(theme);
  const backdropSummary =
    theme.backdrop.kind === "none" ? null : `${theme.backdrop.kind} backdrop`;

  return (
    <>
      <SetupSection
        icon={Palette}
        title="Appearance"
        variant="dialog"
        onOpen={() => setStudioOpen(true)}
        summary={
          <>
            {template.label}
            {backdropSummary && <> &middot; {backdropSummary}</>}
          </>
        }
      />

      <ThemeStudioDialog
        open={studioOpen}
        onOpenChange={setStudioOpen}
        campaign={campaign}
        posts={posts}
        mediaAssets={mediaAssets}
        state={state}
        onChange={onChange}
      />

      <SetupSection
        icon={Clapperboard}
        title="Moments"
        open={openSection === "moments"}
        onToggle={() => onToggleSection("moments")}
        summary={
          sequenced
            ? `${runningCount} of ${MOMENTS.length} playing on the live screen`
            : `Not used by ${template.label}`
        }
      >
        {sequenced ? (
          <p className="-mt-1 text-[11.5px] leading-snug text-muted-foreground text-pretty">
            The live screen plays these in order, then loops. Turn one on and select it to see
            it in the preview.
          </p>
        ) : (
          <p className="-mt-1 text-[11.5px] leading-snug text-muted-foreground text-pretty">
            {template.label} holds one layout instead of playing a sequence, so these have no
            effect right now. Your settings are kept, and come back the moment you pick a
            template that plays moments. Images and durations below still apply where the
            layout uses them.
          </p>
        )}

        <div className={cn("flex flex-col gap-1.5", !sequenced && "opacity-55")}>
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
