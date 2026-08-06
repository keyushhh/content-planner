---
name: wozku-context
description: Load essential Wozku product and codebase context. Use at the start of ANY task touching the Wozku platform, the admin panel, the repository or campaign apps, contests, the live screen, or advocacy features. Also use when the user mentions Wozku, advocates, sharing, leaderboards, or asks what this product is. Prevents acting on wrong assumptions about vocabulary, mocked data, or what is actually built.
---

# Wozku context

Load this before doing anything else in the Wozku codebase. It exists to stop three specific and expensive mistakes: using the wrong vocabulary, treating mocked data as real, and assuming a feature works because its UI exists.

## What Wozku is

A B2B advocacy engine. It takes content a company wants distributed, hands it to people who already trust that company (customers, employees, event attendees, partners), makes sharing a two-tap action instead of a writing task, and gamifies sharing so people actually do it.

The bet: a recommendation travelling through a trusted person's network converts far better than paid advertising, because B2B purchases are complex, high-value, and made on trust.

**The growth loop:** company content goes to an audience, the audience shares into their own networks, those networks click through because a trusted peer recommended it, new people arrive and become the next audience. The loop closes on itself.

**Why people do not share, and how the product answers it.** Every feature maps to one of these three. If a proposed feature does not, question it.

1. No call to action, answered by a QR code at the moment of impact
2. Effort, answered by pre-written on-brand copy and variations
3. No incentive, answered by leaderboards, prizes, recognition, or charitable donations

**The real output** is not reach. It is identifying super-advocates: the few people whose shares drive disproportionate downstream action.

## Vocabulary traps, read before acting on any brief

| If someone says | The code actually has |
| --- | --- |
| "Post" | The type is `Session` in `src/lib/types.ts`. Session means Post. |
| "Contest mode and Campaign mode" | **One** `Campaign` entity. Contest is `campaign.contest`, campaign-mode features are `campaign.settings`. There are not two entities. |
| Theme "Aura Live" | Template id `relay` |
| Theme "Grid Gallery" | Template id `mosaic` |
| "Legacy theme" | Does not exist. `classic` is an app mode, not a theme. |
| "Points" or "scoring" | No points model exists. Scoring is `shares * random_weight` from a PRNG. |
| "Credits" | No credit, metering, or billing entity exists anywhere. |
| "AI content generation" | String templating with a fake delay. No model, no network call. |

## What is real and what is fabricated

**Every number a user or visitor sees in this prototype is generated.** The root is `src/lib/mock-engagement.ts`, a deterministic hash PRNG. It feeds:

- `src/lib/leaderboard.ts`: a roster of 12 hardcoded people, 6 to 12 shown per board, invented scores
- `src/lib/post-engagement.ts`: all share events, likes, clicks, reach, **and the CSV export**
- `src/lib/mock-data.ts`: the entire seed state, 2 campaigns, 4 posts, 7 assets all with empty URLs
- `src/components/repository/campaign-performance-card.tsx` and `roi-sheet.tsx`
- `src/components/public/qr-glyph.tsx`: a decorative grid. **The screen QR does not scan.**

**Never present output from these as real data.** If a task involves analytics, state plainly that the figures are simulated.

**Genuinely real:** the post lifecycle and readiness gating, campaign state derivation, the composer including rich text and mentions and platform limits, the design token system, all six screen templates, post type media rules.

## Architecture in one breath

Next.js 16 App Router, React 19, TypeScript 5, Tailwind v4 CSS-first with no config file, `@base-ui/react` primitives (not Radix), `lucide-react`, npm.

**There is no backend.** No API routes, no database, no auth, no `fetch()` anywhere in `src`. All state is `useState` in `src/app/page.tsx`, roughly 1,864 lines holding every screen behind one conditional. Persistence is `localStorage` under a `cp_` prefix.

Treat visible behaviour as the specification and the storage mechanism as throwaway. Do not use `page.tsx` as an architectural reference.

## The largest known gap

`/p/[id]` and `/c/[id]/screen` read `localStorage` with `ssr: false`. They only render in the browser that authored the data. **They are not public links.** The core scan-share-leaderboard mechanic does not work across devices. If a task assumes it does, say so before proceeding.

Related: `src/components/public/share-button.tsx` has no `onClick`. The terminal action of the product loop does nothing.

## Where to look next

| Need | Read |
| --- | --- |
| Full product and system truth | `docs/WOZKU.md` |
| Coding conventions, hand-off zip rules | `/CLAUDE.md` |
| The Repository to Campaign flow spec and the recommended backend API | `/README.md` |
| Domain rules, lifecycles, contests, screen templates | skill `wozku-campaign-build` |
| UI conventions and design tokens | skill `wozku-admin-design` |

## Working rules

1. Audit before editing. Report findings and blast radius first, per `/CLAUDE.md`.
2. Never assert without checking the file. This context can go stale; the code cannot.
3. Distinguish product intent from shipped reality in every answer.
4. No em dashes anywhere, per repo convention.
