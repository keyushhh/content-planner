# Wozku: Source of Truth

**Status:** Living document. Version 1.0.
**Verified against:** commit `c196e1d` on `main`, 2026-08-06.
**Repo:** `wozku-combined-contentplanner` (Next.js prototype of the Wozku admin panel and public surfaces).

---

## 0. How to use this document

This file is written to be **self-contained and pasteable**. Drop it into Claude, GPT, Gemini, Cursor, or any agent with no other context and it should know what Wozku is, what is built, what is fake, what the rules are, and what to do next.

**If you are an AI agent reading this, four rules govern everything below:**

1. **Distinguish product intent from shipped reality.** Sections 1 to 7 describe what Wozku *is*. Sections 8 to 13 describe what the code *currently does*. These are not the same. Section 10 lists exactly which parts are fabricated. Never present mocked output as real data.
2. **Verify before you assert.** Every claim here is anchored to a file path. If a claim matters to your task, open the file and check it. This document can go stale; the code cannot.
3. **This repo is a prototype, and its visible behaviour is the specification.** The storage mechanism (`localStorage`), the state shape (one giant `useState` tree), and the seed data are throwaway. The screens, the gating rules, and the lifecycle are the product.
4. **Follow the repo's own conventions**, defined in `/CLAUDE.md`. They are not optional and they are not restated in full here.

**Reading order if you are new:** Section 1, then Section 7 (glossary), then Section 8 (domain model), then Section 13 (what is actually built). Skip the rest until you need it.

**Related documents in this repo:**

| File | What it covers | Overlap with this doc |
| --- | --- | --- |
| `/CLAUDE.md` | Coding conventions, stack, hand-off zip control, tone | Authoritative on conventions. This doc defers to it. |
| `/README.md` | Dev hand-off spec for the Repository to Campaign draft flow, plus a recommended backend API contract | Authoritative on that one flow and the API design. This doc covers the whole product around it. |
| `docs/WOZKU.md` | This file. Product context, full glossary, whole-system map, current state, roadmap | The only doc that explains *why* any of this exists. |

---

## 1. What Wozku is, in one paragraph

Wozku is a B2B advocacy engine. It takes content a company wants distributed, hands it to the people who already trust that company (customers, employees, event attendees, partners), makes sharing it a two-tap action instead of a writing task, and gamifies the act of sharing so that people actually do it. The bet is that a recommendation travelling through a trusted person's network converts at a rate paid advertising cannot approach, because in B2B the buying decision is complex, high-value, and made on trust rather than impulse. Wozku is the pipe that carries a brand's message through other people's credibility.

**The one-line version:** Wozku turns a company's existing network into its distribution channel.

---

## 2. The problem Wozku solves

### 2.1 The market problem

B2B buyers of marketing tooling are, in the platform's own framing, **problem unaware and solution unaware**. They do not wake up believing "our advocacy motion is broken." They believe their ad spend is underperforming, which is a different diagnosis with a different, usually wrong, remedy (spend more).

This shapes everything about the product. Wozku cannot be sold as a better version of a thing people already buy. It has to demonstrate a mechanism they have not considered.

### 2.2 The behavioural problem

People do not share content about companies they like. Not because they are unwilling, but for three specific and fixable reasons:

| Reason | What it looks like | How Wozku answers it |
| --- | --- | --- |
| **No call to action** | Nobody ever asked them to share, at a moment when sharing made sense | A QR code on the screen in front of them, at the moment they are impressed |
| **Effort** | Writing a post about a vendor is work, and risky to their own reputation | Pre-written, on-brand copy with variations; the sharer picks, does not compose |
| **No incentive** | There is nothing in it for them | A leaderboard, a prize, recognition, or a charitable donation made in their name |

Every major feature in the platform maps back to one of these three rows. If you are proposing a feature and it does not remove a call-to-action gap, an effort cost, or an incentive gap, question whether it belongs.

### 2.3 Why B2B advocacy is not B2C influencer marketing

This distinction matters because it determines who the sharer is and why they share.

| | B2C influencer | B2B advocate |
| --- | --- | --- |
| Who | Paid celebrity or creator | Peer, colleague, customer, practitioner |
| Motivation | Payment | Authenticity, recognition, professional standing |
| Decision it drives | Impulse purchase | Complex, high-value, committee-approved purchase |
| Reach model | One large audience | Many small, highly relevant, high-trust audiences |

Wozku is built for the right column. A design or copy decision that would make sense for a paid-influencer product is usually wrong here, because it damages the authenticity the whole mechanism depends on.

---

## 3. The Wozku Growth Loop

The core mechanic. Everything in the admin panel exists to configure or measure some part of this cycle.

```
        A company has content and an audience
                        |
                        v
        Wozku hands that audience a ready-made post
                        |
                        v
        The audience shares it into their own networks
                        |
                        v
        Their networks see a trusted person's recommendation,
        not an ad, and click through
                        |
                        v
        New people arrive: register, attend, convert
                        |
                        v
        Those new people are now the audience
                        |
                        +-----> back to the top
```

The loop closes because the people recruited by a share become the next generation of sharers. This is why Wozku measures shares, clicks, and downstream conversions as one connected chain rather than as separate funnel metrics.

**The strategic consequence:** the single most valuable output of the platform is not reach, it is the identification of **super-advocates**, the small number of people whose shares consistently produce disproportionate downstream action. Those people get moved into an always-on advocacy programme. A campaign is a one-off; a super-advocate is an asset.

---

## 4. The canonical use case: events

Events are the beachhead use case because they compress the whole loop into 72 hours and produce a number the customer can compare against their existing ad spend. The product is not events-only, but if you need a mental model for a feature, use this one.

### 4.1 Pre-event

**Goal:** net-new registrations that the marketing team did not pay for.

**Mechanism:** a contest is placed on the registration confirmation page. Someone who has just registered is at peak enthusiasm and has a reason to want their peers there. They are shown a pre-written post and an incentive to share it. Their network clicks the link and registers. Those new registrants hit the same confirmation page.

This is the loop in its purest form and it is the highest-leverage moment in the entire product.

### 4.2 During the event

**Goal:** buzz, hashtag dominance, and booth traffic.

**Mechanism:** QR codes on screens, at booths, on badges. Attendees scan and share in seconds. Observed engagement patterns:

| Tactic | Mechanic | Why it works |
| --- | --- | --- |
| **Donate a post, plant a tree** | Sharing triggers a charitable donation made in the sharer's name | Gives senior people, who will not chase a prize draw, a dignified reason to participate |
| **Treasure hunt** | QR codes hidden at specific booths | Converts a social mechanic into physical foot traffic at the booths that matter commercially |
| **Social check-in** | Branded "I am here" post at a large industry event | Lets a smaller vendor colonise a hashtag owned by a bigger event |

### 4.3 Post-event

**Goal:** identify the super-advocates and start the always-on programme.

**Mechanism:** every share, click, and downstream action is attributed to a person. The leaderboard was the incentive during the event; afterwards it is a ranked list of the most influential people in that company's network. That list is the durable asset.

---

## 5. Who buys it, and the expansion strategy

**Immediate buyer:** the B2B marketing team, usually field marketing or demand generation, usually with an event budget and a registration target.

**Expansion thesis:** the same engine serves several departments inside one enterprise, each with its own budget line.

| Department | Their version of the same mechanic |
| --- | --- |
| Marketing | Event registrations, campaign amplification, pipeline |
| Sales | Advocate-sourced warm introductions |
| HR / Talent | Employee advocacy for recruiting, employer brand |
| CSR | Cause campaigns, donation-linked sharing |
| Internal comms | Company-wide announcement amplification |

The commercial goal is therefore not "win the marketing team," it is "land in marketing, expand to four more departments in the same logo." This has a direct product consequence: **multi-tenancy, sub-accounts, and per-department permissioning are load-bearing architecture, not a later nice-to-have.** See Appendix A, item 11.

**On platform complexity:** the platform is deliberately deep, and that depth is treated as a moat. That is a defensible strategic position, but it is a statement about the *feature set*, not about the *interface*. Depth of capability and clarity of interface are independent variables. Nothing in this strategy licenses a confusing admin panel. See Appendix A, item 14.

---

## 6. The product surfaces

Three distinct surfaces. They have different users and different design constraints.

### 6.1 The admin panel (internal, `/`)

Who uses it: the customer's marketing operations person. Dense, keyboard-driven, information-rich. This is a professional tool and should behave like one.

Two top-level sections:

- **Repository:** every post the company has, across every campaign. Write, review, approve, tag, search.
- **Campaigns:** the containers that posts get sent into, and where a campaign is configured, taken live, and measured.

### 6.2 The public share page (`/p/[id]`)

Who uses it: an advocate who just scanned a QR code, on a phone, at an event, in under thirty seconds. Single-purpose: show the post, make sharing one tap.

This surface has the least code and the most commercial importance. See Section 13.

### 6.3 The live screen (`/c/[id]/screen`)

Who uses it: nobody directly. It is projected on a wall or a booth monitor at an event. Read from ten metres away. Rotates through moments (welcome, posts, leaderboard, prize, thanks). Six visual templates.

Design constraint that follows from this: all typography and layout on the live screen is sized in container-query units (`cqw` / `cqh`) so a template renders identically in a 200px admin preview and on a 4K projector. Do not introduce fixed pixel sizing into screen templates.

---

## 7. Glossary, and the meeting-to-code translation table

**This is the highest-value section of this document.** The vocabulary used in sales conversations, in internal meetings, and in the codebase has drifted apart. Most confusion about this product traces back to one of the rows below.

### 7.1 Canonical terms

| Term | Definition |
| --- | --- |
| **Post** | A single piece of shareable content: copy, media, hashtags, mentions, platform targets. **In the code this type is called `Session`.** See 7.2. |
| **Campaign** | A container that posts are sent into, with its own public page, live screen, theme, contest settings, and lifecycle. The unit a customer buys and runs. |
| **Repository** | The library of all posts across all campaigns. The default admin view. |
| **Staged / draft in a campaign** | A post has been sent to a campaign but not yet submitted. Reviewable, withdrawable. |
| **Submitted** | A post is live in a campaign and eligible to appear on the public screen. |
| **Advocate** | A person who shares. Not a user of the admin panel. |
| **Super-advocate** | An advocate whose shares produce disproportionate downstream action. The programme's real output. |
| **Moment** | One slide in the live screen rotation: `welcome`, `posts`, `leaderboard`, `featured`, `prize`, `thanks`. |
| **Template** | A visual design for the live screen. Six exist: `blade`, `relay`, `mosaic`, `ledger`, `broadcast`, `beacon`. |
| **Hold and Fire** | Collect sharing permission from many people in advance, then publish all their posts simultaneously at a set time to manufacture a coordinated spike. |
| **Multi-post automation** | Collect permission once, then auto-publish a series of posts on that person's behalf over time. |
| **Readiness** | The rule that decides whether a post can be approved: needs copy, and at least one asset unless it is a Reshare. |

### 7.2 Translation table: meeting vocabulary to code reality

Read this before you act on any verbal or written brief about this product.

| Said in meetings | What the code actually has | Reconciliation |
| --- | --- | --- |
| "Post" | The TypeScript type is **`Session`**, in `src/lib/types.ts` | Historical naming. `Session` means Post everywhere. `README.md` already concedes this. Recommend renaming, Appendix A item 2. |
| "Two modes: Contest and Campaign" | **One** `Campaign` entity. Contest behaviour is `campaign.contest: ContestSettings`. Campaign-mode behaviour is `campaign.settings: CampaignSettings` (`holdAndFire`, `multiPostIntervals`, `sendToAdvocates`, `communityInvitation`) | There are not two entities. There is one campaign with two feature clusters. Treat "Contest mode" and "Campaign mode" as **presets over one entity**, not as separate objects. This is the single most misleading term in the product vocabulary. |
| Theme "Aura Live", the racetrack one | Template id **`relay`** in `src/lib/screen-templates.ts` | Renamed at some point, undocumented. `relay` is the racetrack. |
| Theme "Grid Gallery" | Template id **`mosaic`** | Renamed. `mosaic` is the tile wall. |
| "Rename Legacy theme to Classic" | No theme named `Legacy` or `Classic` exists. `classic` is an **app mode** (`AppVersion` in `src/lib/versions.ts`), not a screen theme | This action item appears superseded by the template rewrite. Confirm before acting on it. |
| "Points" / scoring | `src/lib/leaderboard.ts` computes `score = shares * random_weight`, both values from a seeded PRNG | **There is no points model.** Not a naming bug, a missing feature. Appendix A item 10. |
| "Credits, one credit equals one share" | No credit, metering, or billing entity exists anywhere in the codebase | Entirely unbuilt. Appendix A item 3. |
| "PDF carousel post type" | `PostType` includes `"PDF"`, limited to exactly 1 asset (`src/lib/media.ts`) | Present as a type. Carousel rendering behaviour is not implemented on the public surfaces. |
| "AI content generation" | `src/components/content-planner/variation-generator.tsx` is **string templating with an artificial delay**. No model, no network call | Fake. Appendix A item 9. |
| "QR code" | `src/components/public/qr-glyph.tsx` draws a decorative, non-scannable grid. Real QR encoding exists only in the admin links panel | The screen QR does not scan. Appendix A item 8. |

---

## 8. The domain model

Source of truth in code: `src/lib/types.ts`. Quoted verbatim below where it matters.

### 8.1 Core enumerations

```ts
export type SessionStatus = "draft" | "wip" | "approved";
export type Platform      = "linkedin" | "x" | "slack" | "facebook" | "instagram";
export type PostType      = "Image" | "Frames" | "Reshare" | "PDF";
export type CampaignState = "draft" | "live" | "paused" | "ended";
export type FeedbackStatus = "open" | "in_progress" | "done" | "discarded";
export type MediaAssetType = "image" | "embed" | "pdf";
```

### 8.2 The post (`Session`)

```ts
export interface Session {
  id: string;
  tutorial?: boolean;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastEditedBy: User | null;
  status: SessionStatus;
  postType: PostType;
  platforms: Platform[];
  visualAssetIds: string[];
  copy: string;
  variations: PostVariation[];
  mentionedAccountIds: string[];
  hashtags: string;
  draftCampaignIds: string[];
  sentToCampaignIds: string[];
  sentAt: string | null;
  tags: string[];
  feedback: Feedback[];
  history: HistoryEntry[];
}
```

### 8.3 The campaign

```ts
export interface Campaign {
  id: string;
  name: string;
  tag: string;
  inWozku: boolean;
  paused: boolean;
  stopped: boolean;
  hiddenSessionIds: string[];
  endDate: string;
  platforms: Platform[];
  sessionIds: string[];
  logoUrl: string;
  headerUrl: string;
  headerPosition?: number;
  description: string;
  thankYou: string;
  redirectUrl: string;
  linkedInCompanyId?: string;
  settings: CampaignSettings;
  theme: ScreenTheme;
  contest: ContestSettings;
}
```

Notable: `sessionIds` is **ordered**, and that order *is* the public screen display order. `hiddenSessionIds` is per-campaign, so the same post can be visible in one campaign and hidden in another.

### 8.4 Contest settings

```ts
export type QrTarget = "share" | "quiz" | "form";

export interface ContestSettings {
  leaderboardTitle: string;
  ranked: boolean;
  ctaText: string;
  locale: string;
  qrTarget: QrTarget;
  qrUrl: string;
  endHeading: string;
  endMessageAnnounced: string;
  endMessagePending: string;
  winnersAnnounced: boolean;
  leaderboardCleared: boolean;
}
```

Defaults from `blankContest()`: `ranked: true`, `ctaText: "Scan. Share. Win."`, `locale: "en-GB"`, `qrTarget: "share"`.

**There is no prize entity.** "Prize" exists only as a live-screen moment (`ScreenTheme.moments.prize`) with an image and a duration, rendered with hardcoded copy. No prize name, tier, value, or winner assignment exists anywhere in the model.

### 8.5 Campaign settings

```ts
export interface CampaignSettings {
  multiPostIntervals: boolean;
  holdAndFire: boolean;
  sendToAdvocates: boolean;
  communityInvitation: boolean;
  jobRoles: string[];
}
```

These four booleans are **stored and toggleable in the UI but have no behaviour attached.** `holdAndFire` and `multiPostIntervals` are the two headline Campaign-mode features and neither is implemented. See Section 13.

### 8.6 The two lifecycles, and the trap

**This is the number one source of bugs in this product. Read it twice.**

There are two things called "draft" and they are unrelated.

**1. Post status `"draft"`** is a property of a post on its own, independent of any campaign. Every post starts here. It means "not yet approved for sending."

**2. "Staged as a draft in campaign X"** is a *relationship* between a post and a campaign.

They interact as follows: **a post must reach status `"approved"` before it can be staged into any campaign.** So a post can simultaneously be status-approved and campaign-draft. A post can be staged in campaign A, submitted in campaign B, and irrelevant to campaign C, all at once.

Model this as **one post status plus one relationship row per (post, campaign) pair.** Never as a single flat status field.

**Post status transitions:**

```
  new post ──► draft ──any edit──► wip ──readiness met + approve──► approved
                                    ▲                                   │
                                    └───────────any edit────────────────┘
```

Approval gate lives in `src/lib/readiness.ts`: copy is required; at least one asset is required except for `Reshare`; tags are optional. `updateSession` in `src/app/page.tsx` automatically demotes `approved` back to `wip` on any edit.

**Per (post, campaign) transitions:**

```
  none ──stage──► staged ──submit──► submitted
            ▲          │
            └─withdraw─┘
```

`submitted` is terminal. There is no unsubmit.

**Derived post state:** `isSessionLocked()` in `src/lib/utils.ts` adds a fourth, computed state: sent AND approved AND not edited since `sentAt` means locked. `sessionNeedsResend()` means sent but edited since.

### 8.7 Campaign state derivation

`campaignState()` in `src/lib/campaigns.ts`. **Derived, never stored.** Precedence matters:

```
ended    if stopped === true OR endDate is in the past
draft    else if inWozku === false
paused   else if paused === true
live     otherwise
```

`canGoLive(campaign, sessions)` requires state `draft` AND at least one submitted post.

`CAMPAIGN_REQUIRED` lists the six fields a campaign needs before it can be published: logo, name, header image, page description (rich text, non-empty), thank-you message, end date.

### 8.8 Recommended production schema

The prototype stores campaign membership as two string arrays on the post. **Do not port that to a database.** `README.md` specifies the replacement and it is correct:

```
campaign_posts
  campaign_id   FK
  post_id       FK
  state         enum('staged', 'submitted')
  position      integer      -- submission order, drives public screen order
  staged_at     timestamp
  submitted_at  timestamp null
  UNIQUE (campaign_id, post_id)
```

Full endpoint contract is in `README.md` under "API contract". It is the most complete backend spec that exists. Do not re-derive it.

---

## 9. Architecture as built

### 9.1 Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16, App Router |
| UI | React 19, TypeScript 5 |
| Styling | Tailwind CSS v4, **CSS-first config, no `tailwind.config.*`** |
| Primitives | `@base-ui/react` (not Radix), shadcn style `base-nova` |
| Icons | `lucide-react` |
| Motion | `motion` v12 |
| Fonts | Satoshi (local), Geist, Space Grotesk, JetBrains Mono |
| Package manager | npm |
| Dev server | `next dev --webpack` (Turbopack panics in this setup; the flag is deliberate) |

### 9.2 There is no backend

No API routes. No database. No auth. No server actions. No `fetch()` anywhere in `src`. No `.env`. This is stated plainly in `/CLAUDE.md` and it is true.

### 9.3 State

Everything lives in `useState` inside `src/app/page.tsx`, a single client component of roughly 1,864 lines holding every screen behind one conditional and about 30 to 40 hooks. There is no store, no Redux, Zustand, or Jotai, and no app-level data context. Mutations are plain functions defined in `page.tsx` and passed down as props.

The only shared-state mechanism in the codebase is two small `useSyncExternalStore` wrappers over `localStorage`: `useTourSeen()` in `src/lib/tour.ts` and `useLifecycleStrip()` in `src/lib/lifecycle.ts`.

**Do not treat `page.tsx` as an architectural reference.** It was the fastest way to prototype the whole product at once. It was never meant to be extended.

### 9.4 Persistence

`localStorage` only, under a `cp_` prefix.

| Key | Contents |
| --- | --- |
| `cp_sessions` | Full `Session[]` JSON |
| `cp_campaigns` | Full `Campaign[]` JSON |
| `cp_custom_columns` | User-defined table columns |
| `cp_custom_cells` | Custom cell values |
| `cp_version` | `"classic"` or `"repository"` |
| `cp_tour_seen`, `cp_lifecycle_dismissed` | Dismissal flags |

Plus a few UI-preference keys under other prefixes (`wozku:campaigns-view`, `content-planner:composer-layout`).

Two on-load migration functions tolerate older persisted shapes: `migrateSession` in `page.tsx` and `migrateCampaign` in `src/lib/campaigns.ts`. These exist only because there is no real persistence layer. Do not carry them forward.

### 9.5 Routes

| Path | File | Rendering |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Client. The entire admin app. |
| `/c/[id]` | `src/app/c/[id]/page.tsx` | Server. Pure redirect to `/c/[id]/screen`. |
| `/c/[id]/screen` | `src/app/c/[id]/screen/live-screen-page.tsx` | Client, `ssr: false` |
| `/p/[id]` | `src/app/p/[id]/public-post.tsx` | Client, `ssr: false` |

**The `ssr: false` on both public routes is not stylistic.** Those pages read `localStorage` synchronously at mount. That means `/p/[id]` and `/c/[id]/screen` only render for the browser that authored the data. **They are not public links.** This is the most consequential gap between the product story and the build. See Appendix A item 1.

### 9.6 Feature flags

`HANDOFF_MODE` in `src/lib/handoff.ts` is a single exported boolean, currently `false`, gated inline at roughly 15 call sites. When `true` it strips the app back to the Repository to Campaign draft flow for external hand-off. `/CLAUDE.md` documents the zip-refresh procedure; follow it exactly and do not touch the hand-off zip as a side effect of unrelated work.

`AppVersion` in `src/lib/versions.ts` forks the entire app between `classic` and `repository` UIs. `repository` is the real product. `classic` is legacy, reachable only through the Dev Panel. See Appendix A item 6.

---

## 10. What is real and what is fabricated

**Every number a visitor or an admin sees in this prototype is generated.** This section exists so no agent, and no person preparing a demo or a customer conversation, mistakes seeded output for measurement.

### 10.1 The fabrication chain

`src/lib/mock-engagement.ts` is the root. It implements a deterministic FNV-1a hash PRNG: `mockCount(seed, min, max)`, `mockTrendPercent()`, `mockSeries()`. Deterministic means the same campaign id always produces the same numbers, which makes demos stable and makes the fiction convincing.

Everything below draws from it:

| File | What it fabricates | Blast radius |
| --- | --- | --- |
| `src/lib/leaderboard.ts` | A roster of 12 hardcoded people, of which a mocked 6 to 12 appear per board; `score = shares * random_weight` | The entire contest leaderboard, every template |
| `src/lib/post-engagement.ts` | 5 to 34 fake share events per post: likes, comments, clicks, reach, timestamps | All post analytics, the A/B variant winner, **and the CSV export** |
| `src/lib/mock-data.ts` | 1 current user, 6 sub-accounts, 8 media folders, 7 assets (**all with `url: ""`**), 2 campaigns, 4 posts | The entire seed state |
| `src/lib/mentions.ts` | 8 mention accounts with invented follower counts | The @-mention directory |
| `src/components/repository/roi-sheet.tsx` | Default inputs chosen so demo ROI is positive | The ROI calculator |
| `src/components/repository/campaign-performance-card.tsx` | Every stat and the whole chart | Campaign performance view |
| `src/components/public/qr-glyph.tsx` | A decorative 21x21 grid that looks like a QR code | The live screen QR. **It does not scan.** |
| `src/app/p/[id]/public-post.tsx` | Social proof count and names | The public share page |
| `src/lib/platforms.ts` | `GRANTED_PLATFORMS = ["linkedin"]` hardcoded | Stands in for a real connection check |
| `seedDemoContent()` in `page.tsx` | 450 synthetic posts on demand | Dev Panel only |

### 10.2 What is genuinely real

Short list, and worth knowing:

- The post lifecycle and readiness gating (`readiness.ts`, `campaigns.ts`, `utils.ts`). Real logic, framework-free, portable to a server.
- Campaign state derivation. Real.
- The composer: rich text, sanitisation, mentions parsing, character limits per platform. Real.
- The design token system and all six screen templates. Real rendering.
- Post type media rules (`media.ts`): PDF max 1 asset, Reshare 0, Image and Frames unlimited. Real.

---

## 11. Design system contract

Full detail lives in `src/app/globals.css`, which is 627 lines and is the actual authority. Summary of the rules that constrain new work:

### 11.1 Three theme layers

1. **Base**: standard shadcn oklch neutral tokens, `:root` and `.dark`. `<html>` is hardcoded `className="dark"`. The app is dark by default.
2. **`.wozku`**: the brand layer. **Remaps the entire `violet-*` ramp to emerald**, neutralises `emerald-*` to greys, sets all radii to `0px`, flattens shadows and speculars. This is why the primary button is written as `bg-violet-600` and renders green.
3. **`.wozku.wozku-light`**: light variant, re-darkens a dozen chip ramps so they stay legible on white.

**Consequence for any new component:** never hardcode a brand colour. Use `violet-*` for accent and let the brand layer remap it.

### 11.2 The token set that matters

| Token group | Examples | Rule |
| --- | --- | --- |
| Ink | `--ink` (`#ffffff`), `--sink` | The most-used token. Borders and fills are `--ink` at low alpha, e.g. `inset-ring-(--ink)/[0.09]` |
| Radii | `--r-inner` 10px, `--r-float` 14px, `--r-surface` 24px, `--r-pill` | **Radius tracks elevation, not element size** |
| Surfaces | `--surface-canvas` through `--surface-well` | A six-step elevation ladder |
| Elevation | `--lift-sm/md/lg/accent/destructive/edge` | Never raw `shadow-*` |
| Motion | `--press` 0.96 | Used as `active:scale-(--press)`, forced to 1 under reduced motion |
| Live ramp | `--color-live-100..500` | A bespoke green scale, because neither emerald nor violet is green in every theme |

### 11.3 Non-negotiable conventions

These come from `/CLAUDE.md` and from consistent practice in the codebase:

- All conditional classNames go through `cn()` in `src/lib/utils.ts`. Never template literals.
- Design tokens from `globals.css`, never raw hex or one-off Tailwind colour utilities. Add a token rather than inlining a value.
- Borders are `inset-ring-1 inset-ring-(--ink)/[alpha]`, essentially never `border`.
- Business logic lives in `src/lib/*.ts` as framework-free functions. Components import; they do not recompute.
- Named exports only, except where the App Router demands a default (`page.tsx`, `layout.tsx`).
- Filenames kebab-case, types and components PascalCase.
- All hooks before any early return.
- Screen templates size everything in `cqw` / `cqh`.
- **No em dashes anywhere**: code, comments, docs, commit messages.
- Comments are avoided by default; when necessary, single line only.

### 11.4 Accessibility baseline already in place

`globals.css` implements `prefers-reduced-motion` (zeroes transforms and `*:active { scale: 1 }`), `prefers-reduced-transparency` (kills all `backdrop-filter`), and `prefers-contrast: more` (strengthens muted foreground, border, input). A `:where(...)` rule gives every interactive role a 2px focus ring at 2px offset. **Do not regress these.**

---

## 12. Admin panel map

What each surface is, so an agent can navigate without reading 12,000 lines.

### 12.1 Repository section

| File | Lines | Responsibility |
| --- | --- | --- |
| `repository/repository-shell.tsx` | 645 | The all-content screen: header, search, status filter, sort, tag filter, bulk action bar, table. Has a legacy `classic` render branch. |
| `content-planner/sessions-table.tsx` | 2,019 | The workhorse table, reused by Repository, campaign pages, and Classic. Sortable, paginated, shift-range selection, inline-editable custom columns (max 2), per-row menu, empty and loading states. About 30 props, the widest surface in the app. |
| `content-planner/session-detail-pane.tsx` | 377 | Controller between the two composer layouts. Owns local drafts and the autosave state machine (idle, saving, saved, 1200ms). |
| `content-planner/session-canvas.tsx` | 691 | The modern composer layout. Readiness checklist with jump-to-field, mentions, media grid, tags. |
| `content-planner/session-composer.tsx` | 1,247 | The split composer layout, **plus** the shared composer toolkit both layouts import (`Stagger`, `RailCard`, `Chip`, limit meters, shortcuts hooks). |
| `content-planner/post-type-modal.tsx` | 170 | Type picker: Image, Frames, Reshare, PDF. |
| `content-planner/variations-view.tsx` | 883 | A/B copy variation manager, max 3 assets per variation. |
| `content-planner/send-to-campaign-sheet.tsx` | 524 | Two-step send flow (pick, then preview). Encodes the key rule: the campaign you are standing inside gets submitted outright, all others are staged. |
| `content-planner/media-library-view.tsx` | 249 | Folder sidebar, asset grid, type restriction per post type. |

### 12.2 Campaigns section

| File | Lines | Responsibility |
| --- | --- | --- |
| `campaigns/campaigns-view.tsx` | 434 | Campaign index. Four view modes: cards, gallery, list, table. |
| `campaigns/campaign-create-wizard.tsx` | 542 | Three steps: Setup, Posts, Complete. Note the campaign is created at the **end of step 1**, not at the end of the wizard. |
| `campaigns/campaign-form.tsx` | 734 | The real form. Sections: Identity, The page, Post-share behaviour, Schedule. Live landing preview alongside. |
| `repository/campaign-page.tsx` | 1,030 | Single-campaign admin view: stats, post mix, performance, staged drafts, submitted table, right rail with settings and quick actions. |
| `repository/screen-setup-page.tsx` | 555 | Live screen configuration: distribution, posts, moments, contest, embed. Template grid plus theme panel plus live preview. |
| `repository/contest-panel.tsx` | 402 | Contest section (CTA text, leaderboard title, ranked toggle, QR target, locale, clear leaderboard) and Embed section (iframe snippet). |
| `repository/roi-sheet.tsx` | 292 | ROI calculator. Inputs are real, all underlying metrics are mocked, nothing is saved. |

### 12.3 Live screen templates

All in `src/components/public/templates/`. Registered in `templates/index.ts`.

| Template | Kind | Default accent | Visual |
| --- | --- | --- | --- |
| `blade` | sequence | violet | The neutral all-rounder. One full-bleed centred card at a time. |
| `relay` | single | amber | A race: up to 8 lanes with avatar pucks running toward a chequered finish. |
| `mosaic` | single | rose | A 4x3 tile wall; the busiest post takes the big cell. |
| `ledger` | single, **light** | slate | Printed standings on warm paper, 12 ranked names in two columns. |
| `broadcast` | sequence, owns background | sky | News desk: blinking LIVE badge, scrolling standings ticker locked to the bottom. |
| `beacon` | sequence | emerald | Maximum legibility. Enormous uppercase mono, one huge QR. Readable from the back of a hall. |

Moment sequence: `welcome`, `posts`, `leaderboard`, `featured`, `prize`, `thanks`. `posts` is fixed and always enabled. Only `posts` is on by default.

---

## 13. Current state: what is actually built

Honest inventory. Four buckets.

### Built and working

- Repository: full CRUD on posts, search, filter, sort, tags, bulk selection, custom columns
- Composer: two layouts, rich text with sanitisation, mentions, hashtags, per-platform character limits, media attachment with type rules
- Readiness gating and post status lifecycle
- Feedback threads and post history
- A/B copy variations
- Send-to-campaign flow, end to end, including the standing-inside-a-campaign submit rule
- Campaign creation wizard, campaign form, four campaign index views
- Campaign state derivation, go-live, pause, stop
- Screen Setup: all six templates, theme controls, moment configuration, embed snippet
- Live screen rendering with moment rotation and keyboard control
- Command palette, guided tour, changelog, keyboard shortcuts
- Full design token system, three theme layers, accessibility baseline

### Built as UI only, with no behaviour behind it

- `CampaignSettings`: `holdAndFire`, `multiPostIntervals`, `sendToAdvocates`, `communityInvitation`. Four toggles, stored, zero implementation. **Two of these are headline Campaign-mode features.**
- Invite advocates modal. Goes nowhere.
- `ShareButton` on `/p/[id]`. **No `onClick`. The single most important action in the product does nothing.**
- Platform selection. Labels only, no publishing integration.
- Coupon distribution and quizzes, discussed as capabilities, not present in this codebase.

### Simulated

Everything in Section 10.1.

### Not started

- Any backend: API, database, auth, multi-tenancy, sub-accounts, RBAC
- Real media storage (currently `URL.createObjectURL`, dies on reload)
- Credit metering or billing
- Real QR generation on the live screen
- A points model
- Cross-device public links
- Tests, CI, error tracking, analytics instrumentation

---

## Appendix A: Proposed changes and corrections

Ranked by consequence. Items 1 to 4 are, in my assessment, the difference between a demo and a product.

### 1. Make the public URLs actually public. Highest priority by a wide margin.

`/p/[id]` and `/c/[id]/screen` read `localStorage` with `ssr: false`. An advocate who scans a QR code on their own phone sees nothing, because the data lives in the marketer's browser. The entire mechanism described in Sections 3 and 4 (scan, share, leaderboard, loop) is non-functional across devices.

Nothing else on this list matters until this is fixed, because everything else is a refinement of a loop that cannot currently close. This requires the backend from `README.md` plus server-rendered public routes.

### 2. Rename `Session` to `Post`.

`README.md` already concedes the type means Post. Every document, every new engineer, and every AI agent pays a tax on this indefinitely. The rename is mechanical. There are 123 TypeScript files under `src`, and the subset referencing `Session` is large but almost entirely type references and imports. The cost only grows. Do it before the codebase doubles.

Note the collision risk: `session-*` component filenames would also move (`session-canvas.tsx` to `post-canvas.tsx`), and `sessionIds` on `Campaign` becomes `postIds`. Plan it as one atomic change, not incrementally.

### 3. There is no credit, metering, or billing model.

The commercial model is understood to be usage-based on shares. Nothing in the codebase counts anything, and the entity that would need to (a share event tied to a person, a campaign, and an account) does not exist. This is a prerequisite for commercial launch and it has schema implications that are cheaper to design now than to retrofit.

### 4. "Contest mode vs Campaign mode" is a fiction the code does not support.

Presenting these as two modes to customers is fine. Modelling them as two things internally will cause damage, because the code has one `Campaign` with two feature clusters hanging off it. Recommend: formalise them as **named presets** that set `contest` and `settings` defaults on a single campaign, expose them in the create wizard as a first-step choice, and keep exactly one entity underneath. Document the preset definitions in this file.

### 5. Define a real, explainable points model.

Current scoring is `shares * random_weight` from a PRNG. A customer running a prize draw needs a rule they can defend to a participant who disputes the outcome. Recommend an explicit, configurable weighted sum, for example `points = (w_share * shares) + (w_click * clicks) + (w_engagement * (likes + comments))`, with weights stored per contest and visible in the admin panel. Whatever the formula, it must be deterministic, auditable, and displayable.

This also resolves the "points naming" defect noted in the source meeting, which is not a naming problem.

### 6. Delete Classic mode.

`AppVersion` forks the entire application. Classic is reachable only through the Dev Panel, hidden in hand-off mode, and keeps three files and one large render branch alive: `post-type-modal-classic.tsx`, `campaign-sidebar.tsx`, and the `classic` branch of `repository-shell.tsx`, plus the `SessionComposer` split layout. Every change to the real product must be considered against it.

Unless there is a customer commitment to Classic, deleting it removes a permanent tax. Confirm before acting.

### 7. `lifecycle-strip.tsx` is dead code with an apparently inverted condition.

The component is never imported. Its visibility guard reads `if (dismissed && postCount < 3) return null`, which means it survives dismissal for anyone with three or more posts. The intent stated in its own comment is to teach new users and then get out of the way, which implies `if (dismissed || postCount >= 3) return null`. Either fix and wire it up, or delete it. Leaving unreferenced code with a probable logic bug is the worst of the three options.

### 8. The live screen QR code does not scan.

`qr-glyph.tsx` draws a decorative grid. The `qrcode` package is already a dependency and is already used correctly in the admin post-links panel. At an event, the QR *is* the product. This is a small fix with outsized consequence.

### 9. The AI content generation is string templating.

`variation-generator.tsx` extracts a subject from existing copy and slots it into canned sentence patterns, with an artificial spinner delay. It is presented as AI generation. Two honest paths: wire it to a real model, or rename it to what it is (a template library) in the UI. The current state is a demo liability if anyone looks closely.

### 10. `ShareButton` has no click handler.

`src/components/public/share-button.tsx` renders and does nothing. Trivially small, and it is the terminal action of the entire product loop.

### 11. Multi-tenancy is load-bearing, not deferrable.

The expansion strategy in Section 5 sells the same platform to five departments in one enterprise. That requires an organisation entity, sub-accounts, and per-department permissioning from the first schema draft. `SubAccount` exists as a type and the invite modal goes nowhere. Retrofitting tenancy is one of the most expensive migrations in software; design it into the initial schema.

### 12. `README.md` has a stale line.

It states `HANDOFF_MODE` is "currently `true`". The working tree has `false`. The README was written against the zip snapshot. One-line fix, but it currently misleads anyone reading the hand-off doc.

### 13. `CLAUDE.md` forbids em dashes; `README.md` uses them throughout.

A convention nobody follows is worse than no convention, because it trains agents to treat the rules file as advisory. Either enforce it (this document follows the rule) or drop it.

### 14. Complexity as a moat is a claim about capability, not interface.

Depth of feature set and clarity of interface are independent. Treating admin panel complexity as a competitive advantage risks rationalising friction that costs activation and expansion. The moat is the mechanism, the network effects, and the accumulated advocate data. Recommend an explicit north star for the admin panel: **a marketer should be able to launch their first campaign in under ten minutes without training.** Measure against it.

---

## Appendix B: Open questions requiring a decision

Carried forward from `README.md` and extended. None block starting work; each will surface as an ambiguity partway through if left unresolved.

### Product

1. **Can a submitted post be withdrawn from a campaign?** Currently `submitted` is terminal.
2. **Can an already-submitted post be edited?** Today editing silently demotes it to `wip` with no check on whether it is live somewhere. Options: block, version, or require re-submission.
3. **Does a paused or ended campaign block new shares into it?** Not enforced. You can stage into an ended campaign today.
4. **What happens to screen `position` when a post is withdrawn after later posts were submitted?** Not exercised.
5. **What is the definitive prize model?** Name, tier, quantity, eligibility rule, winner selection, notification. None of it exists.
6. **Is a "super-advocate" a computed status or an assigned one?** This determines whether it is a query or an entity.
7. **What counts as a share when a platform gives no callback?** Attribution currently has no defined source of truth.

### Technical

8. **Multi-user concurrency.** One hardcoded user, no locking. What happens when two people edit the same post?
9. **Where does media live?** Object storage choice, CDN, image transformation pipeline.
10. **How is a share verified?** Trusting the client is exploitable in any contest with a prize attached.
11. **Do we keep the prototype's React components or rebuild?** `README.md` has a component-by-component recommendation. Decide once, globally.
12. **Test strategy.** There is currently none, and the domain logic in `src/lib/` is pure, framework-free, and unusually easy to test. Start there.

---

## Appendix C: Keeping this document alive

A source of truth that drifts is worse than none, because it is trusted and wrong. Five mechanisms, in order of cost.

### C1. Anchor every claim to a path

Done throughout. An agent that doubts a statement can open the file named next to it and check in seconds. Preserve this when editing: **no assertion without a file path.**

### C2. Fence what is unverified

This document deliberately excludes performance figures, pricing, and case study results. They belong in sales material, not in a document AI agents will treat as fact and repeat in customer-facing output. If they are ever added here, fence them explicitly as unverified claims with a source and a date.

### C3. Same-PR updates, with a trigger list

Update this document in the same change that alters any of the following:

- `src/lib/types.ts` (the domain model)
- `src/lib/campaigns.ts`, `readiness.ts`, `contest.ts` (the rules)
- Route structure under `src/app/`
- The token layer in `src/app/globals.css`
- Anything that moves an item between the four buckets in Section 13

### C4. Automate the reminder

`scripts/changelog-scan.mjs` already proves this team will maintain an automated docs check. Extend the pattern: a `docs:check` script that fails if a commit touches a file on the C3 trigger list without touching `docs/WOZKU.md`. Wire it to the same pre-push hook.

### C5. Version and date the header

The header carries a version, a commit SHA, and a date. Bump all three on every substantive edit. When a reader sees a SHA fifty commits behind `main`, they know to verify rather than trust.

### C6. On AI-specific durability

This document is structured for machine consumption on purpose: tables over prose, explicit enumerations, quoted type definitions, one idea per section, and an explicit instruction block at the top. That structure survives model changes better than tone or formatting tricks. Keep it. When adding a section, ask: **could an agent act on this without asking a follow-up question?** If not, it is not specific enough.

---

## Appendix D: Recommended build order

Sequenced by dependency, not by effort. Each phase is only startable once the previous one exists.

### Phase 0: Decisions (blocking, days not weeks)

Resolve Appendix B items 1, 2, 3, 5, and 11. These change the schema. Deciding them after Phase 1 means migrations.

### Phase 1: Make the loop close

Nothing else matters first.

1. Backend per the `README.md` API contract: the `campaign_posts` join table, the six endpoints, server-side readiness validation
2. Real object storage for media
3. Auth, organisations, sub-accounts, RBAC (Appendix A item 11)
4. Server-render `/p/[id]` and `/c/[id]/screen` from real data (Appendix A item 1)
5. Real QR generation on the live screen (item 8)
6. Wire `ShareButton` and record a real share event (item 10)

**Exit criterion:** a person who is not the campaign author can scan a code on their own phone, share a post, and see the leaderboard change.

### Phase 2: Make it truthful

7. Real share, click, and engagement attribution replacing `mock-engagement.ts`
8. A defensible points model (item 5)
9. Real analytics on the campaign page and post reports, replacing fabricated figures
10. Credit metering (item 3)

**Exit criterion:** every number shown to a customer is measured, not generated.

### Phase 3: Deliver the promised features

11. `holdAndFire`: collect permission, schedule, fire simultaneously
12. `multiPostIntervals`: collect permission once, publish a series
13. `sendToAdvocates` and `communityInvitation`
14. Real platform publishing integrations, starting with LinkedIn
15. Prize model and winner selection (Appendix B item 5)

**Exit criterion:** the four `CampaignSettings` toggles do what their labels say.

### Phase 4: Consolidate

16. Rename `Session` to `Post` (item 2)
17. Delete Classic mode (item 6)
18. Decompose `page.tsx`
19. Formalise contest and campaign presets over one entity (item 4)
20. Test suite, starting with the pure logic in `src/lib/`
21. Resolve items 7, 9, 12, 13

### Phase 5: Widen

22. Non-event use cases: always-on advocacy, employee advocacy, CSR
23. Department-specific onboarding paths (Section 5)
24. Quizzes, coupon distribution, treasure hunt as first-class configurable mechanics
25. Super-advocate identification and the always-on programme

---

## Document control

| | |
| --- | --- |
| Version | 1.0 |
| Verified against | `c196e1d`, `main`, 2026-08-06 |
| Sources | Codebase audit; `/CLAUDE.md`; `/README.md`; internal platform demo, 2026-08-06 |
| Excluded by decision | Pricing, credit tier figures, case study performance data. See Appendix C2. |
| Companion skills | `docs/skills/wozku-context`, `docs/skills/wozku-admin-design`, `docs/skills/wozku-campaign-build` |
