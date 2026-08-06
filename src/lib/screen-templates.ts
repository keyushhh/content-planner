import type { ScreenFontId, ScreenMode } from "./screen-theme";

export type ScreenTemplateId =
  | "blade"
  | "relay"
  | "mosaic"
  | "ledger"
  | "broadcast"
  | "beacon";

export type HeroLayout = "split" | "banner" | "stack";
export type PostsLayout = "list" | "grid" | "tiles";
export type BoardLayout = "hidden" | "rail" | "inline";
export type StatsLayout = "tiles" | "strip" | "hidden";

export interface ScreenTemplate {
  id: ScreenTemplateId;
  label: string;
  blurb: string;
  /* A sequence template rotates through moments. A single template is one persistent view. */
  kind: "sequence" | "single";
  /* True when the layout supplies its own background, so the backdrop control stands down. */
  ownsBackground: boolean;
  defaults: { mode: ScreenMode; accent: string; font: ScreenFontId };
  /* Surface tokens per mode, merged over the base palette so both modes stay usable. */
  vars?: Partial<Record<ScreenMode, Record<string, string>>>;
  page: {
    hero: HeroLayout;
    posts: PostsLayout;
    board: BoardLayout;
    stats: StatsLayout;
  };
}

export const SCREEN_TEMPLATES: ScreenTemplate[] = [
  {
    id: "blade",
    label: "Blade",
    blurb: "One thing at a time, centred and full bleed. The safe all-rounder.",
    kind: "sequence",
    ownsBackground: false,
    defaults: { mode: "dark", accent: "violet", font: "sans" },
    page: { hero: "split", posts: "list", board: "hidden", stats: "tiles" },
  },
  {
    id: "relay",
    label: "Relay",
    blurb: "Standings as lanes racing to a finish line. Built to be watched.",
    kind: "single",
    ownsBackground: false,
    defaults: { mode: "dark", accent: "amber", font: "display" },
    vars: {
      dark: {
        "--screen-bg": "#0d0906",
        "--screen-panel": "rgba(255,238,214,0.05)",
        "--screen-panel-strong": "rgba(255,238,214,0.09)",
        "--screen-ink": "#fdf6ec",
        "--screen-muted": "rgba(253,246,236,0.58)",
        "--screen-line": "rgba(255,196,128,0.16)",
      },
      light: {
        "--screen-bg": "#fffaf3",
        "--screen-panel": "rgba(72,38,4,0.045)",
        "--screen-panel-strong": "rgba(72,38,4,0.08)",
        "--screen-ink": "#1d1408",
        "--screen-muted": "rgba(29,20,8,0.60)",
        "--screen-line": "rgba(72,38,4,0.14)",
      },
    },
    page: { hero: "banner", posts: "list", board: "rail", stats: "strip" },
  },
  {
    id: "mosaic",
    label: "Mosaic",
    blurb: "Every post as a tile on a wall, the busiest ones biggest.",
    kind: "single",
    ownsBackground: false,
    defaults: { mode: "dark", accent: "rose", font: "sans" },
    vars: {
      dark: {
        "--screen-bg": "#08080f",
        "--screen-panel": "rgba(255,255,255,0.06)",
        "--screen-panel-strong": "rgba(255,255,255,0.11)",
        "--screen-line": "rgba(255,255,255,0.13)",
      },
      light: {
        "--screen-bg": "#f6f6fa",
        "--screen-panel": "rgba(12,12,28,0.045)",
        "--screen-panel-strong": "rgba(12,12,28,0.08)",
        "--screen-line": "rgba(12,12,28,0.12)",
      },
    },
    page: { hero: "banner", posts: "grid", board: "inline", stats: "strip" },
  },
  {
    id: "ledger",
    label: "Ledger",
    blurb: "Printed standings. Rules, numerals and no decoration at all.",
    kind: "single",
    ownsBackground: false,
    defaults: { mode: "light", accent: "slate", font: "display" },
    vars: {
      light: {
        "--screen-bg": "#fbf9f3",
        "--screen-panel": "rgba(24,21,16,0.035)",
        "--screen-panel-strong": "rgba(24,21,16,0.07)",
        "--screen-ink": "#181510",
        "--screen-muted": "rgba(24,21,16,0.58)",
        "--screen-line": "rgba(24,21,16,0.18)",
      },
      dark: {
        "--screen-bg": "#12110d",
        "--screen-panel": "rgba(244,239,226,0.045)",
        "--screen-panel-strong": "rgba(244,239,226,0.08)",
        "--screen-ink": "#f4efe2",
        "--screen-muted": "rgba(244,239,226,0.56)",
        "--screen-line": "rgba(244,239,226,0.20)",
      },
    },
    page: { hero: "stack", posts: "list", board: "inline", stats: "hidden" },
  },
  {
    id: "broadcast",
    label: "Broadcast",
    blurb: "A news desk. Content up top, the board running along the bottom.",
    kind: "sequence",
    ownsBackground: true,
    defaults: { mode: "dark", accent: "sky", font: "display" },
    vars: {
      dark: {
        "--screen-bg": "#04070d",
        "--screen-panel": "rgba(130,185,255,0.09)",
        "--screen-panel-strong": "rgba(130,185,255,0.15)",
        "--screen-ink": "#eef4ff",
        "--screen-muted": "rgba(238,244,255,0.60)",
        "--screen-line": "rgba(140,190,255,0.20)",
      },
      light: {
        "--screen-bg": "#f3f7fd",
        "--screen-panel": "rgba(6,30,70,0.05)",
        "--screen-panel-strong": "rgba(6,30,70,0.09)",
        "--screen-ink": "#0a1730",
        "--screen-muted": "rgba(10,23,48,0.60)",
        "--screen-line": "rgba(6,30,70,0.14)",
      },
    },
    page: { hero: "split", posts: "tiles", board: "rail", stats: "tiles" },
  },
  {
    id: "beacon",
    label: "Beacon",
    blurb: "Enormous type and one enormous code. Readable from the back of a hall.",
    kind: "sequence",
    ownsBackground: false,
    defaults: { mode: "dark", accent: "emerald", font: "mono" },
    vars: {
      dark: {
        "--screen-bg": "#030f0b",
        "--screen-panel": "rgba(180,255,222,0.06)",
        "--screen-panel-strong": "rgba(180,255,222,0.11)",
        "--screen-ink": "#eafff5",
        "--screen-muted": "rgba(234,255,245,0.58)",
        "--screen-line": "rgba(120,255,200,0.18)",
      },
      light: {
        "--screen-bg": "#f1fcf7",
        "--screen-panel": "rgba(0,48,32,0.045)",
        "--screen-panel-strong": "rgba(0,48,32,0.08)",
        "--screen-ink": "#052018",
        "--screen-muted": "rgba(5,32,24,0.60)",
        "--screen-line": "rgba(0,48,32,0.14)",
      },
    },
    page: { hero: "stack", posts: "tiles", board: "hidden", stats: "strip" },
  },
];

export function templateById(id: ScreenTemplateId | undefined): ScreenTemplate {
  return SCREEN_TEMPLATES.find((t) => t.id === id) ?? SCREEN_TEMPLATES[0];
}
