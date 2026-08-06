import type { ComponentType } from "react";
import { BLADE_MOMENTS } from "@/components/public/templates/blade";
import { BEACON_MOMENTS } from "@/components/public/templates/beacon";
import { BROADCAST_MOMENTS, BroadcastChrome } from "@/components/public/templates/broadcast";
import { LedgerView } from "@/components/public/templates/ledger";
import { MosaicView } from "@/components/public/templates/mosaic";
import { RelayView } from "@/components/public/templates/relay";
import type { ScreenViewProps } from "@/components/public/templates/shared";
import type { MomentId } from "@/lib/screen-theme";
import type { ScreenTemplateId } from "@/lib/screen-templates";

type MomentRenderer = ComponentType<ScreenViewProps>;

interface LiveTemplate {
  /* Single-view templates render one persistent layout and ignore the moment sequence. */
  view?: MomentRenderer;
  /* Sequence templates override the moments they care about; the rest fall back to Blade. */
  moments?: Partial<Record<MomentId, MomentRenderer>>;
  chrome?: ComponentType<ScreenViewProps & { children?: React.ReactNode }>;
}

const LIVE_TEMPLATES: Record<ScreenTemplateId, LiveTemplate> = {
  blade: { moments: BLADE_MOMENTS },
  relay: { view: RelayView },
  mosaic: { view: MosaicView },
  ledger: { view: LedgerView },
  broadcast: { moments: BROADCAST_MOMENTS, chrome: BroadcastChrome },
  beacon: { moments: BEACON_MOMENTS },
};

export function liveTemplate(id: ScreenTemplateId): LiveTemplate {
  return LIVE_TEMPLATES[id] ?? LIVE_TEMPLATES.blade;
}

export function momentRenderer(id: ScreenTemplateId, moment: MomentId): MomentRenderer {
  return liveTemplate(id).moments?.[moment] ?? BLADE_MOMENTS[moment];
}

export type { ScreenViewProps };
