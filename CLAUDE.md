# CLAUDE.md

Project-level instructions for Claude Code / Claude in IDE. This file is auto-loaded as context whenever Claude works in this workspace.

## Stack
- Next.js 16 (App Router), React 19, TypeScript 5
- Tailwind CSS v4, CSS-first config (no `tailwind.config.*`), `@base-ui/react` for headless primitives, `lucide-react` for icons
- State: plain React `useState` lifted to `src/app/page.tsx`, persisted to `localStorage`. No Redux/Zustand/Context store.
- No backend: no API routes, no database, no auth. This is a prototype; treat visible behavior as the spec, not the storage mechanism.
- Package manager: npm

## Hand-off zip control

`wozku-repository-dev-handoff.zip` at the repo root is a separate deliverable for the dev team, built from a locked-down snapshot of this app. It is not the same thing as this working directory, and the two must not be conflated.

**Never modify, rebuild, or delete `wozku-repository-dev-handoff.zip` unless explicitly asked to.** Normal development in this directory (features, fixes, refactors) must never touch it as a side effect. If a task doesn't explicitly mention the hand-off zip, leave it alone completely, don't even re-verify it.

The lockdown is controlled by a single flag: `src/lib/handoff.ts` exports `HANDOFF_MODE`, which must always rest at `false` in this working directory. When `false`, the app behaves exactly as it does for normal design work: Classic mode, the Dev Panel (`Ctrl+Shift+D`), brand guidelines toggle, and full Campaign section (Go Live, ROI, Screen Setup, campaign creation/editing) are all present.

When `true`, several files gate behind it to restrict the app to just the Repository → Campaign draft flow (no Classic mode, brand guidelines forced on, Dev Panel hidden, Campaign section actions hidden). Search for `HANDOFF_MODE` to see every gated call site before changing any of that logic.

**Only when explicitly asked to refresh the hand-off zip**, follow this exact sequence:
1. Flip `HANDOFF_MODE` to `true` in `src/lib/handoff.ts`.
2. `rm -rf .next && npx tsc --noEmit -p tsconfig.json` then `npm run build`; confirm both are clean.
3. Delete the old zip, `rsync` the working tree into a temp folder excluding `.git`, `node_modules`, `.next`, `out`, `build`, `coverage`, `.vercel`, `*.tsbuildinfo`, `.DS_Store`, `.claude`, and the zip itself, then zip that temp folder.
4. Verify: no `.git/` entries inside the zip, `HANDOFF_MODE` reads `true` inside the zipped `src/lib/handoff.ts`, and a fresh unzip + `npm install` + `npm run build` succeeds standalone.
5. Flip `HANDOFF_MODE` back to `false` in this working directory, re-run typecheck to confirm it's clean.
6. Clean up any temp folders used during the process.

Never use `git archive`/`git bundle` for this export and never include `.git` in the zip; the dev team must see no commit history or author metadata in the file they receive.

## Tone & Communication
- Be direct, no fluff. Skip generic praise or hedging ("great question", "you're right to ask").
- Give honest technical assessments, not reassurance. If something is a bad idea, say so and explain why.
- Keep explanations concise. Don't over-explain basic concepts unless asked.

## Workflow
1. **Audit first.** Before making changes, scan the relevant files and report what you find (issues, dependencies, blast radius) without editing anything.
2. **Propose a targeted fix.** Describe the specific change you intend to make, scoped narrowly to the issue at hand, no drive-by refactors.
3. **Wait for approval** before editing, unless the task is trivial (typo, single obvious one-line fix).
4. **Confirm after every change.** Run the build/lint/test command after each edit and report pass/fail before moving to the next task.

## Component Portability
- Build components to be portable/drop-in: a component should be copy-pasteable into another project and work with minimal changes.
- No hardcoded API calls, env vars, or app-specific global state inside a reusable component. Pass data via props.
- Avoid dependency on project-specific context/providers unless the provider itself is also meant to be copied along with it. If a provider is required, note that clearly at the top of the component file (single-line comment, per the rule below).
- Prefer self-contained styling (Tailwind utility classes or scoped styles) over relying on global CSS specific to this project.
- Don't assume shared utility functions exist in the target project. Either inline small helpers or clearly flag the dependency.
- This applies by default to all components unless a component is explicitly app-specific (e.g. tightly wired to this project's routing or store).

## Formatting Rules
- Never use em dashes in any content, anywhere: code, comments, docs, chat responses, commit messages.
- Avoid code comments by default. Only add one if genuinely necessary for clarity.
- If a comment is used, it must be a single line, max. Never multi-line comment blocks.

## Coding Conventions

- State mode/theme checks explicitly (e.g. `mode !== "off"`, `brandMode === "light"`) rather than relying on implicit truthy/falsy defaults.
- All React hooks must be called before any early `return` statements.
- Design tokens (colors, radii, shadows, surfaces) come from CSS custom properties defined in `src/app/globals.css` (e.g. `--r-pill`, `--ink`, `--surface-raised`), not raw Tailwind color/spacing utilities or hardcoded hex values. Reuse the existing token set; add a new token to `globals.css` rather than inlining one-off values.
- All conditional className composition goes through the `cn()` helper in `src/lib/utils.ts` (a `clsx` + `tailwind-merge` wrapper), never template literals or manual string concatenation.
- Business logic (readiness gating, campaign state derivation, draft/submit lifecycle) lives in `src/lib/*.ts` as plain, framework-free TypeScript functions, and components import from there rather than recomputing the same logic inline in JSX.
- Feature/mode flags (see `HANDOFF_MODE`) are a single exported boolean constant in `src/lib/`, gated inline at each call site with a plain conditional, not wrapped in a separate config object or context provider.
- Components are named exports (`export function ComponentName(...)`), never default exports, except where the Next.js App Router itself requires a default export (`page.tsx`, `layout.tsx`).
- Filenames are kebab-case; component and type names are PascalCase.
- (Add more as they come up: import order, error handling patterns, testing conventions, etc.)

## Notes
- Keep this file updated as conventions solidify; treat it as a living document, not a one-time setup.
