---
name: wozku-admin-design
description: UI and design system conventions for building or modifying Wozku admin panel screens and components. Use when writing or editing any React component, styling anything, adding a screen or panel or modal or table, adjusting layout, or reviewing UI code in this repo. Covers design tokens, the brand theme layer, component patterns, accessibility baselines, and the naming and formatting rules.
---

# Wozku admin panel design conventions

Authority for anything visual in this repo. The actual source of truth is `src/app/globals.css` (627 lines). This skill is the working summary. When they disagree, the CSS wins.

## Stack constraints

- Tailwind CSS v4, **CSS-first config. There is no `tailwind.config.*` and you must not create one.** Tokens are declared in `globals.css` via `@theme` and `@theme inline`.
- Headless primitives are `@base-ui/react`, **not Radix**. shadcn style is `base-nova`, base colour `neutral`, icon library `lucide`.
- Motion via `motion` v12.
- `<html>` is hardcoded `className="dark"` in `layout.tsx`. The app is dark by default.

## The three theme layers

1. **Base**: shadcn oklch neutral tokens under `:root` and `.dark`.
2. **`.wozku`**: the brand layer. **Remaps the entire `violet-*` ramp to emerald**, neutralises `emerald-*` to greys, sets all radii to `0px`, flattens shadows and speculars, sets `--press: 1`.
3. **`.wozku.wozku-light`**: light variant, re-darkens a dozen chip ramps so they stay legible on white.

**The rule this produces:** write accent colour as `violet-*` and let the brand layer remap it. Never hardcode a brand green. Never hardcode a hex value.

## Token set

| Group | Tokens | How to use |
| --- | --- | --- |
| Ink | `--ink` (`#ffffff`), `--sink` | The most-used token. Fills and borders are ink at low alpha: `bg-(--ink)/[0.06]`, `inset-ring-(--ink)/[0.09]` |
| Radii | `--r-inner` 10px, `--r-float` 14px, `--r-surface` 24px, `--r-pill` | **Radius tracks elevation, not element size.** A small floating thing gets `--r-float`, not a small radius. |
| Surfaces | `--surface-canvas`, `-raised`, `-panel`, `-float`, `-dialog`, `-well` | A six-step elevation ladder. Pick by depth. |
| Elevation | `--lift-sm`, `-md`, `-lg`, `-accent`, `-destructive`, `-edge` | Never raw `shadow-*` utilities. |
| Specular | `--specular`, `--specular-v`, `--specular-dim` | Hairline highlights. The depth language is translucent light over a dark page. |
| Motion | `--press` 0.96, `--press-lg` 0.985 | Used as `active:scale-(--press)`. Forced to 1 under reduced motion. |
| Washes | `--wash-page`, `-neutral`, `-success`, `-center` | Page-level radial gradients. |
| Live ramp | `--color-live-100` through `-500` | A bespoke green scale. Exists because neither emerald nor violet is green in every theme. Use for Live and Approved signalling. |
| Focus | `--focus-ring` | Already applied globally, do not re-implement. |

## Hard rules

These come from `/CLAUDE.md` and consistent practice. Violating them will fail review.

1. **All conditional classNames go through `cn()`** from `src/lib/utils.ts` (a `clsx` plus `tailwind-merge` wrapper). Never template literals, never manual concatenation.
2. **Design tokens only.** No raw hex, no one-off Tailwind colour or spacing values for anything themeable. If a value is missing, add a token to `globals.css` rather than inlining it.
3. **Borders are `inset-ring-1 inset-ring-(--ink)/[alpha]`**, essentially never `border`. Typical alphas run 0.09 to 0.20.
4. **Business logic lives in `src/lib/*.ts`** as plain framework-free functions. Components import it. Never recompute readiness, campaign state, or lifecycle rules inline in JSX.
5. **Named exports only** (`export function ComponentName`), except `page.tsx` and `layout.tsx` where the App Router demands a default.
6. **Filenames kebab-case. Components and types PascalCase.**
7. **All hooks before any early return.**
8. **State mode checks explicitly**: `mode !== "off"`, `brandMode === "light"`. Never rely on implicit truthiness.
9. **No em dashes anywhere.** Code, comments, docs, commit messages, chat.
10. **Avoid comments.** If one is genuinely needed, single line only, never a block.

## Component portability

Components should be copy-pasteable into another project with minimal changes.

- No hardcoded API calls, env vars, or app-specific global state inside a reusable component. Pass data via props.
- Avoid depending on project-specific context providers. If one is required, note it in a single-line comment at the top of the file.
- Do not assume shared utilities exist in the target project. Inline small helpers or flag the dependency.
- Exception: components explicitly tied to this app's routing or state.

## Established patterns to reuse rather than reinvent

| Need | Use |
| --- | --- |
| Buttons | `SECONDARY_ACTION` / `PRIMARY_ACTION` and their `_SM` and `_MD` variants in `src/lib/button-styles.ts`. Heights cluster at h-7, h-8, h-9. |
| Entry animation | `Stagger` from `src/components/content-planner/session-composer.tsx` |
| Rail cards, chips, banners, limit meters | Also exported from `session-composer.tsx`. That file is the shared composer toolkit, not just one layout. |
| Confirmations | `confirm-dialog.tsx` |
| Right-hand panels | `ui/sheet.tsx` |
| Deterministic colour from a string | `avatarTint()`, `tagTint()`, `tagDot()` in `src/lib/utils.ts` |
| Relative and bucketed time | `relativeTime()`, `timeBucket()` in `utils.ts` |
| Scroll edge fades | `useScrollEdges()` in `src/lib/scroll-edges.ts` |

## Typography

Font access is through an indirection layer, never directly: `--app-font-sans`, `--app-font-heading`, `--app-font-display`, `--app-font-mono`, `--font-label`.

Under `.wozku`: sans becomes Satoshi (local woff2 in `src/app/fonts/`), heading and display become Space Grotesk, mono becomes JetBrains Mono, and `--font-label` becomes JetBrains Mono for small uppercase labels.

Observed convention: type sizes are usually arbitrary bracketed values (`text-[13px]`, `text-[12.5px]`, `text-[11.5px]`) rather than `text-sm` or `text-xs`. Match surrounding code.

## Accessibility baseline, already implemented, do not regress

`globals.css` handles all of these. Do not re-implement, and do not write anything that defeats them.

- `prefers-reduced-motion`: zeroes enter and exit transforms, sets `*:active { scale: 1 }`
- `prefers-reduced-transparency`: kills every `backdrop-filter`
- `prefers-contrast: more`: strengthens muted foreground, border, and input
- A global `:where(...)` rule gives every interactive role a 2px focus ring at 2px offset with inherited radius

If you add a custom interactive element, make sure it carries a role or is a real element so the global focus rule applies.

## Live screen templates are a special case

Anything under `src/components/public/templates/` renders on a projector at an event.

- **Size everything in container-query units (`cqw`, `cqh`).** Never fixed pixels. A template must render identically in a 200px admin preview and on a 4K wall.
- Screen tokens are separate from app tokens: `--screen-bg`, `--screen-panel`, `--screen-ink`, `--screen-accent`, `--screen-font`, set at runtime by `screenThemeVars()` in `src/lib/screen-theme.ts`.
- Legibility from ten metres beats visual density. `beacon` is the reference for how far that can be pushed.

## Workflow, per `/CLAUDE.md`

1. **Audit first.** Scan the relevant files and report issues, dependencies, and blast radius without editing.
2. **Propose a targeted fix**, scoped narrowly. No drive-by refactors.
3. **Wait for approval** unless the change is trivial.
4. **Confirm after every change.** Run `npm run build` and report pass or fail before moving on.
