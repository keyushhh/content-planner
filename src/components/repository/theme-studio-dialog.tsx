"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScreenPreview } from "@/components/repository/screen-preview";
import { TemplateGrid } from "@/components/repository/template-grid";
import {
  ImageSlot,
  Row,
  Segmented,
  VideoSlot,
} from "@/components/repository/theme-controls";
import { Hint } from "@/components/ui/tooltip";
import {
  ACCENTS,
  SCREEN_FONTS,
  appearanceOf,
  sameAppearance,
  templateOf,
  usesBackdrop,
  type BackdropKind,
  type ScreenMode,
  type ScreenTheme,
} from "@/lib/screen-theme";
import { cn } from "@/lib/utils";
import type { Campaign, CampaignState, MediaAsset, Session } from "@/lib/types";

export function ThemeStudioDialog({
  open,
  onOpenChange,
  campaign,
  posts,
  mediaAssets,
  state,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign;
  posts: Session[];
  mediaAssets: MediaAsset[];
  state: CampaignState;
  onChange: (patch: Partial<ScreenTheme>) => void;
}) {
  const [entry, setEntry] = useState<ScreenTheme>(campaign.theme);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setEntry(campaign.theme);
  }

  const theme = campaign.theme;
  const template = templateOf(theme);
  const changed = !sameAppearance(theme, entry);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-3rem)] max-w-[min(1160px,calc(100vw-2.5rem))] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden bg-(--surface-canvas) p-0 sm:max-w-[min(1160px,calc(100vw-2.5rem))]">
        <div className="flex items-center justify-between gap-4 border-b border-(--ink)/[0.06] px-5 py-3.5">
          <span className="min-w-0 pr-9">
            <span className="block truncate text-[14px] font-semibold">
              Appearance
            </span>
            <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
              {template.label}. {template.blurb}
            </span>
          </span>

          {changed && (
            <Hint label="Put every appearance setting back to how it was when you opened this">
              <button
                type="button"
                onClick={() => onChange(appearanceOf(entry))}
                className="mr-9 flex h-7 shrink-0 items-center gap-1.5 rounded-(--r-pill) px-2.5 text-[11.5px] font-medium text-muted-foreground transition-[background-color,color] duration-150 hover:bg-(--ink)/[0.07] hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
                Revert
              </button>
            </Hint>
          )}
        </div>

        <div className="grid min-h-0 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-col gap-2.5 overflow-y-auto p-5 [background-image:var(--wash-page)]">
            <ScreenPreview
              campaign={campaign}
              posts={posts}
              mediaAssets={mediaAssets}
              state={state}
            />

            <p className="shrink-0 text-center text-[11px] text-muted-foreground/75">
              Every change here is already saved and live.
            </p>
          </div>

          <div className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto border-t border-(--ink)/[0.06] p-5 lg:border-t-0 lg:border-l">
            <Row
              label="Template"
              hint="Changes the layout of the screen, not just the colours. Picking one also sets the palette and typeface below, which you can then change."
            >
              <TemplateGrid
                campaign={campaign}
                posts={posts}
                mediaAssets={mediaAssets}
                onChange={onChange}
              />
            </Row>

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
                          ? "ring-2 ring-(--ink)/45 ring-offset-2 ring-offset-(--surface-canvas)"
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
                    onClick={() => onChange({ font: font.id })}
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
              hint={
                usesBackdrop(theme)
                  ? "Sits behind everything on the screen. Whatever you pick is dimmed automatically so the text on top stays readable."
                  : `${template.label} paints its own background, so a backdrop would not be visible on the live screen.`
              }
            >
              <div
                className={cn(
                  "flex flex-col gap-2",
                  !usesBackdrop(theme) && "pointer-events-none opacity-45",
                )}
              >
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
