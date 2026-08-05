# Repository → Campaign draft hand-off

A design-complete flow, prototyped in Next.js/React, that we're handing to dev to build for real. It covers:

**Repository → create post → share post to campaign(s) → select campaign(s) → review post → share as draft → campaign receives post as draft.**

That's it. Six screens, six functions on the backend side. The rest of the app — Screen Setup, themes, the live public screen, contest/leaderboard, ROI, campaign creation/editing — is the **Campaign** section, and it is still being actively designed. Don't build against it yet, and don't treat anything in [`src/components/repository/campaign-page.tsx`](src/components/repository/campaign-page.tsx) beyond the "Staged, not submitted" section as final. This build has those actions hidden from the UI for exactly that reason — see "Hand-off lockdown" below before you go looking for them.

Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4.

## How to run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — ideally in an incognito window, so there's no leftover `localStorage` from anyone else's testing. It opens straight into the Repository view with the Wozku brand guidelines applied; there's no version chooser and no way to reach the older Classic mode in this build.

Seed data (2 campaigns, 4 posts) comes from [`src/lib/mock-data.ts`](src/lib/mock-data.ts). To reset to a clean slate, clear `localStorage` keys starting with `cp_` in devtools, or open a fresh incognito window.

> [!NOTE]
> Next.js 15+ defaults to Turbopack, which may crash with a `Next.js package not found` panic in this specific setup. The predefined `dev` script in `package.json` already runs with `--webpack` to avoid this — don't "fix" that.

### Build verification

```bash
npm run build
```

## Hand-off lockdown

This build has a `HANDOFF_MODE` flag ([`src/lib/handoff.ts`](src/lib/handoff.ts), currently `true`) that intentionally restricts what's visible, so you're only ever looking at the flow above:

- **No Classic mode, no brand-guidelines-off look.** Both were only reachable through an internal Dev Panel (`Ctrl+Shift+D`), which doesn't render in this build.
- **A Dark/Light toggle** sits in the top bar — the only thing it changes is which brand-guideline variant you're looking at. There's no "off" state.
- **A Live/Empty/Loading toggle** sits next to it. The repository table (and the campaign posts table) has real empty and loading states in the code — use this to see all three without needing a real backend wired up yet.
- **On a campaign page**, Take it live, Pause/Resume/Stop, Invite advocates, Calculate ROI, Screen Setup, and Edit page are all hidden — along with the campaign settings panel, live-link chip, and performance card. Only the campaign name, "Add post," the staged-drafts section, and the submitted-posts table remain.
- **"New campaign" is hidden** everywhere (the campaigns list and the send sheet's inline shortcut) — the two seeded campaigns are enough to exercise the full flow, and campaign creation/editing isn't finalized yet.
- **Invite and changelog commands are removed from the ⌘K command palette** — they're accessible from nowhere else in this build.

If you're poking around the source and find a button or a state that isn't reachable from the UI, that's why — it's part of the in-progress Campaign section, not part of this hand-off.

## Read this in order

1. **[Flow spec](#flow-spec)** — the six screens: what they are, how to click through to each one, what states they can be in, and the exact gating rules.
2. **[Data model](#data-model)** — the fields involved and, most importantly, why "draft" means two different things.
3. **[API contract](#api-contract)** — for backend: the endpoints to build and the schema we recommend (not a straight port of the prototype's data shape).
4. **[Component map](#component-map)** — optional, only if you're reusing the React components as-is: what to copy, what to rewire, what to throw away.
5. **[Open questions](#open-questions)** — things the prototype doesn't answer; decide these before you build.

## The prototype is a spec, not a codebase

This is the most important thing to understand before opening any file. **There is no backend.** No API routes, no database, no auth, no `fetch()` calls anywhere. Every screen and every piece of state lives in one 1800-line React component ([`src/app/page.tsx`](src/app/page.tsx)), persisted only to `localStorage`.

That's fine — it did its job, which was to let us design and validate the flow fast. But it means: **treat the visible behaviour as the authoritative spec, and treat the storage/state mechanism as throwaway.** Don't port `localStorage` calls, don't port the two-array data model as-is (more on this in [Data model](#data-model)), and don't go looking for a server to extend, because there isn't one.

### Three traps

1. **"Draft" means two unrelated things** — a post's own status (`draft`/`wip`/`approved`) and a post's staged-in-this-campaign relationship. Conflate them and you'll build the wrong gating logic. Full explanation in [Data model](#data-model).
2. **Don't read `page.tsx` top to bottom.** It's ~40 `useState` hooks and every screen in the app behind one conditional. Everything you need from it is already extracted into the sections below with exact line references — use those instead of re-deriving them from the file.
3. **Don't port the two string arrays (`draftCampaignIds`, `sentToCampaignIds`) into your database schema.** They work in React state but can't record *when* a post was staged into a *specific* campaign, and they create two places to check "is this submitted." [API contract](#api-contract) has the join-table schema we recommend instead.

---

## Flow spec

Each screen: what it is, how to reproduce it in the running prototype, what states it has, and the rules that govern it. No screenshots — the app is quick to click through, and behaviour is easier to verify live than to read off a static image.

### Screen A — Repository list

**What:** The main post table with search, filters, and a bulk-action bar.
**See it:** Land on `/`. This is the default view.
**Source:** [`repository-shell.tsx`](src/components/repository/repository-shell.tsx), [`sessions-table.tsx`](src/components/content-planner/sessions-table.tsx)

- Selecting one or more rows reveals a bulk bar with a **"Send to campaigns"** action.
- That action is only enabled when every selected post is `status: "approved"` and not locked. If any selected post isn't approved, the button is disabled with a reason (see gating rule below).
- Each row also has its own inline send affordance in the campaign cell, independent of selection.
- The table has real **empty** and **loading** states in the code (`SessionsTable`'s `emptyState`/`loading` props) — in the prototype these are only driven by the Live/Empty/Loading toggle in the top bar (there's no real backend to trigger them naturally). Build your loading/empty UI to match what that toggle shows; don't skip it just because the seeded data always renders "filled."

### Screen B — Create post

**What:** Post-type picker, then the composer.
**See it:** Click "New post" on Screen A → pick a type (Image / Frames / Reshare / PDF) → composer opens in a side sheet.
**Source:** [`post-type-modal.tsx`](src/components/content-planner/post-type-modal.tsx), [`session-detail-pane.tsx`](src/components/content-planner/session-detail-pane.tsx), [`session-canvas.tsx`](src/components/content-planner/session-canvas.tsx)

- A new post starts as `status: "draft"`, with no campaigns attached.
- Any edit after that bumps it to `status: "wip"` automatically.
- **Readiness gate:** before a post can be marked `"approved"`, it needs copy and at least one asset. Reshare posts are exempt from the asset requirement — they inherit the original post's media. Tags are recommended but not required. See [`readiness.ts`](src/lib/readiness.ts).
- The composer shows what's missing via a blocked-reason message (e.g. "Add copy and an asset first") until the post can be approved.
- **Exception:** if you create a post while standing inside a specific campaign page, it's staged into that campaign automatically on creation — you don't have to go through the send flow.

### Screen C — Pick campaigns

**What:** The first step of the send sheet — choose which campaign(s) to send to.
**See it:** On an **approved** post, click "Send to campaigns" (from the row, the bulk bar, or the composer header button). Sheet opens on the right, on the "pick" step.
**Source:** [`send-to-campaign-sheet.tsx`](src/components/content-planner/send-to-campaign-sheet.tsx)

- Lists all campaigns as checkable rows. If there are more than 6, a search box appears.
- Campaigns the post is already sent to render in a separate, non-selectable "already sent" group.
- If you got here in bulk (multiple posts selected), the sheet says so and applies the same campaign selection to all of them.
- A "New campaign" option normally lets you create one on the fly without leaving the sheet — **it's hidden in this build** (see "Hand-off lockdown" above); the two seeded campaigns are enough to exercise the flow.
- The primary button's label depends on selection (see button-copy rule below) and does **not** submit yet — it only advances to Screen D.

### Screen D — Review post

**What:** Second step of the same sheet — a preview of the post(s) as they'll appear, plus a "going to" list of the campaigns picked in Screen C.
**See it:** Press the primary button on Screen C.
**Source:** same file, plus [`post-preview.tsx`](src/components/content-planner/post-preview.tsx)

- Shows every post being sent (one or many) with its copy/media/platforms as a preview card.
- Pressing the primary button here **commits** the send — this is the two-press pattern: first press advances pick → preview, second press actually shares.
- A back arrow returns to Screen C without losing the selection.

### Screen E — Confirm / success

**What:** A confirmation modal after the send commits.
**See it:** Press the primary button on Screen D.
**Source:** [`send-success-modal.tsx`](src/components/content-planner/send-success-modal.tsx)

- Confirms the post(s) were staged as drafts in the chosen campaign(s).
- Offers a "Review in campaign" shortcut that jumps straight to the campaign page (Screen F).

### Screen F — Campaign receives the draft

**What:** The receiving side — a "Staged, not submitted" section on the campaign page.
**See it:** Open a campaign (from the Campaigns tab, or via the "Review in campaign" link on Screen E).
**Source:** [`campaign-page.tsx`](src/components/repository/campaign-page.tsx) — `DraftCard`, and the "Staged, not submitted" section. **This is the only part of that file that's final** — everything else on the page (Go Live, Pause/Resume/Stop, Invite, ROI, Screen Setup, settings, edit) is hidden in this build because it isn't.

- Every staged post shows as a card with **Edit**, **Withdraw**, and **Submit** actions.
- A header bar offers "Submit all N" to submit every staged post at once.
- Submitting moves the post out of "Staged, not submitted" and into the "In the campaign" table below.
- A count badge ("N waiting") shows on the campaign's card in the campaign list, and on the top-level tab, wherever campaigns are listed.

### Gating rules (apply across screens)

- **A post must be `approved` before it can be sent.** This is enforced on the row action, the bulk bar action, and the composer's send button — all three read the same readiness check.
- **Button copy changes based on context**, and this reflects real behaviour, not just wording:
  - Outside any campaign page: **"Add as draft"** (or **"Add as draft to N"** for multiple campaigns).
  - If you are currently standing inside campaign X, and X is among your selected campaigns: the button reads **"Send"** (or **"Send + N drafts"** if other campaigns are also selected) — because X gets submitted outright, the others still land as drafts. See [Data model](#data-model) and [API contract](#api-contract) for why.
- **Staging into a campaign is idempotent.** Sending the same post to a campaign it's already staged in doesn't duplicate anything.
- **Submitting requires the post to already be staged in that campaign.** A post that was never staged silently can't be submitted in the prototype — see [API contract](#api-contract) for how we recommend the real API should differ (reject with an error instead of no-op).

---

## Data model

Source of truth in the prototype: [`src/lib/types.ts`](src/lib/types.ts).

### The post (`Session`)

Named `Session` in the code for historical reasons — think of it as **Post**.

| Field | Type | Relevant to this flow? | Notes |
|---|---|---|---|
| `id` | string | core | |
| `title` | string | used elsewhere | |
| `status` | `"draft" \| "wip" \| "approved"` | **core** | gates whether the post can be sent at all — see below |
| `postType` | `"Image" \| "Frames" \| "Reshare" \| "PDF"` | used elsewhere | affects the readiness check (Reshare skips the asset requirement) |
| `platforms` | Platform[] | used elsewhere | labels only, no publishing integration exists |
| `copy` | string | core | required for readiness |
| `visualAssetIds` | string[] | core | required for readiness (except Reshare) |
| `tags` | string[] | core (soft) | optional readiness item |
| `draftCampaignIds` | string[] | **core** | campaigns this post is currently staged in |
| `sentToCampaignIds` | string[] | **core** | campaigns this post has been submitted to |
| `sentAt` | string \| null | core | last submit time — **global to the post, not per campaign** (see limitation below) |
| `history` | HistoryEntry[] | used elsewhere | audit trail, includes a "submitted this post to X" entry |
| `feedback`, `variations`, `mentionedAccountIds`, `hashtags`, `lastEditedBy` | — | used elsewhere | not part of this flow |
| `tutorial` | boolean? | prototype-only | flags posts created by the guided walkthrough — has no real-world equivalent |

### The campaign (`Campaign`)

| Field | Type | Relevant to this flow? | Notes |
|---|---|---|---|
| `id`, `name` | string | core | |
| `sessionIds` | string[] | **core** | submitted post IDs, in submission order — this order **is** the public screen's display order |
| `inWozku`, `paused`, `stopped` | boolean | used elsewhere | derive `CampaignState` (draft/live/paused/ended); Campaign section, not this flow |
| `hiddenSessionIds` | string[] | used elsewhere | per-campaign screen visibility toggle |
| everything else (`theme`, `contest`, `settings`, `logoUrl`, …) | — | used elsewhere | Campaign section, still being designed |

### Why "draft" means two different things

This is the single most important thing to get right, and the prototype's own naming doesn't make it obvious.

**1. Post status `"draft"`** is a property of the post by itself, independent of any campaign. Every post starts here. It has nothing to do with campaigns — it just means "not yet approved for sending."

**2. "Staged as a draft in campaign X"** is a *relationship* between a post and a campaign — membership in that post's `draftCampaignIds` array. This is what Screen F's "Staged, not submitted" section shows.

These interact in a specific, slightly confusing way: **a post must have status `"approved"` before it can become a staged draft in any campaign.** So a post that is `status: "approved"` and staged in Campaign X is simultaneously "approved" (post-level) and "a draft" (campaign-level, in X). If you build a `status` enum that includes `"draft"` and *also* try to represent campaign staging as one more post-level status, you'll conflate the two and break the flow — a post can be staged in campaign A, submitted in campaign B, and still not-yet-approved for campaign C, all at once. Model it as **one post status** + **one relationship per (post, campaign) pair**, not as a single flat status.

### Lifecycle per (post, campaign) pair

```
none ──stage──► staged ──submit──► submitted
          ▲         │
          └─withdraw┘
```

- **none → staged:** happens when a post is sent to that campaign (Screen C/D/E).
- **staged → submitted:** happens via "Submit" on Screen F, or automatically when the post is sent directly into the campaign page you're currently standing in (see [API contract](#api-contract), `shareSessions`).
- **staged → none:** "Withdraw" on Screen F.
- **submitted** is terminal for this flow — the prototype has no "unsubmit."

### One more prototype limitation worth naming

`sentAt` lives on the post, not on the (post, campaign) relationship — so if a post is submitted to two campaigns, the prototype can't tell you which submission happened when. The recommended schema in [API contract](#api-contract) fixes this by putting the timestamp on the join row instead.

---

## API contract

This is the backend spec. It's derived from six functions that currently live client-side in [`src/app/page.tsx`](src/app/page.tsx) — each is transcribed below as a plain-English contract, not as code to port.

Read [Data model](#data-model) first — specifically "why draft means two different things" — before implementing any of this.

### Recommended schema

The prototype represents campaign membership as two string arrays on the post (`draftCampaignIds`, `sentToCampaignIds`). **Don't port that into a database.** Two arrays means two places to check "is this post submitted," and neither array can record *when* a specific (post, campaign) pairing happened. Use a join table instead:

```
campaign_posts
  campaign_id   FK
  post_id       FK
  state         enum('staged', 'submitted')
  position      integer        -- submission order; drives public screen order
  staged_at     timestamp
  submitted_at  timestamp null
  UNIQUE (campaign_id, post_id)
```

Everything the prototype's arrays did becomes a query against this table:

| Prototype array/field | Query equivalent |
|---|---|
| `post.draftCampaignIds` | `campaign_posts WHERE post_id = ? AND state = 'staged'` |
| `post.sentToCampaignIds` | `campaign_posts WHERE post_id = ? AND state = 'submitted'` |
| `campaign.sessionIds` (and its order) | `campaign_posts WHERE campaign_id = ? AND state = 'submitted' ORDER BY position` |
| `post.sentAt` | `campaign_posts.submitted_at` (now per-campaign, which the prototype couldn't do) |

### Endpoints

#### `POST /posts`
Creates a post. `status` starts at `"draft"`. If the request is made from within a campaign context, also create a `staged` row in `campaign_posts` for that campaign (mirrors the prototype's auto-stage-on-create-inside-a-campaign behaviour).

#### `PATCH /posts/:id`
Updates post fields (copy, assets, tags, platforms, etc.). Any field edit moves `status` from `"approved"` back to `"wip"` automatically — mirrors `page.tsx`'s update logic. Setting `status` to `"approved"` directly should be validated server-side against the readiness rule (copy required; at least one asset unless `postType === "Reshare"`) — don't trust the client to have already checked this.

#### `POST /campaigns/:id/drafts`
Body: `{ postIds: string[] }`. Stages posts into the campaign. Requires every post to be `status: "approved"` — reject with a clear error otherwise (the prototype's UI already blocks this, but the API shouldn't rely on that). **Idempotent**: staging an already-staged post is a no-op, not an error and not a duplicate.

#### `POST /campaigns/:id/submit`
Body: `{ postIds: string[] }`. For each post:
- Requires the post to currently be `staged` in this campaign.
- **Prototype behaviour to deliberately improve on:** the current client code silently skips any post that isn't staged. Don't replicate that — return an explicit error naming which post IDs weren't staged, so a bad client call fails loudly instead of quietly doing nothing.
- On success: flip that row's state to `submitted`, stamp `submitted_at`, assign the next `position` value for the campaign (append order = display order), and append a history entry ("submitted this post to \<campaign name\>").

#### `DELETE /campaigns/:id/drafts/:postId`
Withdraws a staged post (staged → removed). Only valid while `state = 'staged'`; withdrawing a submitted post isn't defined by the prototype — see [Open questions](#open-questions).

#### `POST /campaigns/:id/share` (the composite the UI actually calls)
This is the one real endpoint the send sheet (Screens C–E) needs — it should be one transactional call, not the client chaining the three endpoints above itself.

Body: `{ postIds: string[], campaignIds: string[], currentCampaignId?: string }`.

Behaviour, mirroring the prototype's `shareSessions`:
1. Stage every post into every campaign in `campaignIds` (idempotent union — same rule as the standalone stage endpoint).
2. **If** `currentCampaignId` is present and included in `campaignIds`, immediately submit those posts into that one campaign only. The rest of `campaignIds` remain staged.
3. All of this in one transaction — if step 2 fails, step 1 should not have partially committed. (The prototype does this as two separate client-side state updates with no rollback; don't inherit that.)

Return the resulting per-campaign state for each post so the client can render Screen E / Screen F without a refetch.

### Out of scope for this endpoint set

Not part of this hand-off, even though the prototype has UI stubs for them:

- **Auth / permissions** — the prototype has one hardcoded `currentUser` and no login.
- **Real media upload** — the prototype uses `URL.createObjectURL`, i.e. uploads vanish on reload. Needs real object storage.
- **Actual social publishing** — `platforms` (LinkedIn, X, etc.) are labels with no posting integration.
- **Campaign-level settings, themes, contest, live screen, campaign creation/editing** — all part of the in-progress Campaign section.

---

## Component map

**Only relevant if the frontend team is reusing the existing React/Tailwind components rather than rebuilding the UI from scratch.** If you're rebuilding in a different stack, skip this — [Flow spec](#flow-spec) already has everything behaviour-wise.

### Copy as-is

Self-contained, driven entirely by props — no hidden dependency on the rest of the app's state:

- [`send-to-campaign-sheet.tsx`](src/components/content-planner/send-to-campaign-sheet.tsx) — Screens C & D
- [`post-preview.tsx`](src/components/content-planner/post-preview.tsx) — the preview card used on Screen D
- [`send-success-modal.tsx`](src/components/content-planner/send-success-modal.tsx) — Screen E
- [`post-type-modal.tsx`](src/components/content-planner/post-type-modal.tsx) — Screen B's type picker
- [`src/components/ui/*`](src/components/ui) — shadcn/base-ui primitives (sheet, dialog, tooltip, rich-text-editor, toast, etc.)

### Copy, but rewire the state

These currently pull from the giant state object in `page.tsx` via props — keep the component, replace what feeds it:

- [`repository-shell.tsx`](src/components/repository/repository-shell.tsx) — Screen A shell (filters, bulk bar)
- [`sessions-table.tsx`](src/components/content-planner/sessions-table.tsx) — Screen A table
- [`session-detail-pane.tsx`](src/components/content-planner/session-detail-pane.tsx) + [`session-canvas.tsx`](src/components/content-planner/session-canvas.tsx) — Screen B composer
- [`campaign-page.tsx`](src/components/repository/campaign-page.tsx) — Screen F. **Only reuse the "Staged, not submitted" section and `DraftCard`.** The rest of this file (settings, theme, contest, ROI) belongs to the in-progress Campaign section and isn't final — and is hidden in this build for that reason.

### Pure logic — portable to the server too

No React in these — plain TypeScript, safe to reuse as the basis for backend validation logic or share as-is:

- [`campaigns.ts`](src/lib/campaigns.ts) — the `isDraftIn` / `isSubmittedIn` / `campaignDrafts` / `campaignSubmitted` helpers
- [`readiness.ts`](src/lib/readiness.ts) — the approval-gate rule
- [`utils.ts`](src/lib/utils.ts) — `isSessionLocked` / `isSessionSent` / `sessionNeedsResend`
- [`types.ts`](src/lib/types.ts) — the type definitions referenced in [Data model](#data-model)

### Design system — copy as a unit

- [`globals.css`](src/app/globals.css) — the entire token layer (Tailwind v4, CSS-first config, no `tailwind.config.*`). Includes the `.wozku` brand layer that remaps violet tokens to green — keep that mapping, since the brand guidelines are meant to stay on.
- `src/app/fonts/` — Satoshi woff2 files referenced by the font tokens in `globals.css`.

### Do not carry over

Prototype scaffolding with no real-world equivalent:

- All `localStorage` read/write effects and every `migrate*` function (`migrateSession`, `migrateCampaign`, etc.) — these exist only because there's no real persistence layer.
- [`mock-data.ts`](src/lib/mock-data.ts), [`mock-engagement.ts`](src/lib/mock-engagement.ts), [`leaderboard.ts`](src/lib/leaderboard.ts) — fabricated data.
- `dev-panel.tsx` + `seedDemoContent()` — internal demo tooling (disabled in this build; see "Hand-off lockdown").
- [`tour.ts`](src/lib/tour.ts) + `walkthrough.tsx` — the guided tutorial.
- [`changelog.ts`](src/lib/changelog.ts) + `changelog-modal.tsx` — internal changelog, not product.
- `invite-modal.tsx` — invites go nowhere in the prototype.
- The "Synced to Wozku" label in `repository-shell.tsx` — a static string, not a real sync indicator.

### About `page.tsx`

[`src/app/page.tsx`](src/app/page.tsx) is ~1800 lines and holds every screen in the app behind one conditional, plus ~40 `useState` hooks. It exists in that shape because it was the fastest way to prototype the whole product in one sitting — it was never meant to be extended. Don't try to refactor it in place or use it as an architectural reference. The ~6 functions relevant to this flow (`stageDrafts`, `submitDrafts`, `withdrawDraft`, `shareSessions`, `createBlankSession`, `updateSession`) are already fully specified in [API contract](#api-contract) — pull the *behaviour* from there, not the file structure.

---

## Open questions

Things the prototype doesn't answer, or answers in a way that's a shortcut rather than a real decision. Resolve these before or during build — none of them are blockers to starting, but each one will surface as an ambiguity partway through if left unaddressed.

### Needs a decision

- **Can a submitted post be withdrawn from a campaign?** The prototype only supports withdrawing a *staged* draft. Submitted is currently terminal.
- **Can an approved, already-submitted post be edited?** The prototype allows editing (which bumps status back to `wip`) with no check on whether the post is live anywhere. Decide whether editing a submitted post should be blocked, versioned, or require re-submission.
- **Does a campaign's own state (paused / ended) block new shares into it?** Not enforced today — you can stage or submit into an ended campaign in the prototype.
- **Multi-user / concurrency.** The prototype has exactly one hardcoded user ([`mock-data.ts`](src/lib/mock-data.ts), `currentUser`) and no locking. Real usage will have multiple people editing/sharing concurrently — the API contract above should be checked against real concurrent-write behaviour once auth exists.
- **What happens to `position` (screen order) when a post is withdrawn after other posts were submitted after it?** Not exercised by the prototype.

### Known shortcuts (not decisions, just things that were never built)

- **The public pages** (`/c/[id]`, `/c/[id]/screen`, `/p/[id]`) read the same browser's `localStorage` — they only "work" in the tab that authored the content. Not a real multi-client experience. Out of scope for this hand-off but worth knowing before anyone demos it to a customer.
- **Media uploads use `URL.createObjectURL`** — object URLs that die on page reload. No real file storage exists yet.
- **Platforms are labels only.** Selecting LinkedIn/X/etc. on a post does nothing beyond storing the string; there's no publishing integration.
- **"Synced to Wozku"** in the repository shell is a static string with no backing sync process.
