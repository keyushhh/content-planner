---
name: wozku-campaign-build
description: Domain rules for Wozku posts, campaigns, contests, and the live screen. Use when building or debugging anything involving post status, the approval or readiness gate, sending posts to campaigns, staged versus submitted state, campaign lifecycle, going live, contest and leaderboard configuration, screen templates and moments, or the public share page. Also use when designing a backend schema or API for any of this.
---

# Wozku campaign and post domain rules

The behavioural rules that govern posts, campaigns, contests, and screens. Getting these wrong produces bugs that look like UI problems but are not. Source of truth in code: `src/lib/types.ts`, `campaigns.ts`, `readiness.ts`, `contest.ts`, `utils.ts`.

## The one trap that causes most bugs

**There are two unrelated things called "draft."**

1. **Post status `"draft"`** is a property of a post on its own, independent of any campaign. Every post starts here. It means "not yet approved for sending."
2. **"Staged as a draft in campaign X"** is a *relationship* between a post and a campaign.

They interact in a way that is easy to get backwards: **a post must reach status `"approved"` before it can be staged into any campaign.** So a post can be status-approved and campaign-draft at the same time. A post can be staged in campaign A, submitted in campaign B, and irrelevant to campaign C, simultaneously.

**Model this as one post status plus one relationship row per (post, campaign) pair. Never as a single flat status field.** If you find yourself adding a campaign-related value to `SessionStatus`, stop.

## Post lifecycle

```
new post ──► draft ──any edit──► wip ──readiness met + approve──► approved
                                  ▲                                  │
                                  └──────────any edit────────────────┘
```

- `SessionStatus = "draft" | "wip" | "approved"`
- Any field edit automatically demotes `approved` back to `wip`. This lives in `updateSession` in `src/app/page.tsx`.
- The type is called `Session` for historical reasons. It means **Post**.

### The readiness gate

`src/lib/readiness.ts`. This is the single rule that decides whether a post can be approved.

| Item | Required |
| --- | --- |
| Copy | Yes, always |
| At least one asset | Yes, **except when `postType === "Reshare"`** (a reshare inherits the original's media) |
| Tags | No, recommended only |

`canApprove(items)`, `missingRequired(items)`, and `blockedReason(items)` are the API. Never recompute this rule inline. If you are building a backend, validate it server-side and do not trust the client.

### Derived post state

`src/lib/utils.ts` adds computed states on top of status:

- `isSessionSent()`: submitted somewhere
- `isSessionLocked()`: sent AND approved AND not edited since `sentAt`
- `sessionNeedsResend()`: sent but edited since

## Per (post, campaign) lifecycle

```
none ──stage──► staged ──submit──► submitted
          ▲          │
          └─withdraw─┘
```

- **none to staged**: the post is sent to that campaign via the send sheet
- **staged to submitted**: "Submit" on the campaign page, or automatically when sent from inside that campaign
- **staged to none**: "Withdraw"
- **submitted is terminal.** There is no unsubmit today.

### The send rule that surprises everyone

**If you are standing inside campaign X and you send a post to a set of campaigns that includes X, then X is submitted outright and every other selected campaign is staged.**

This is why the primary button copy changes:

| Context | Button reads |
| --- | --- |
| Outside any campaign | "Add as draft", or "Add as draft to N" |
| Inside campaign X, X selected | "Send" |
| Inside campaign X, X plus others selected | "Send + N drafts" |

Encoded in `src/components/content-planner/send-to-campaign-sheet.tsx` via `directCampaignId`.

**Staging is idempotent.** Sending a post to a campaign it is already staged in is a no-op, not a duplicate and not an error.

**Creating a post while inside a campaign auto-stages it** into that campaign. No send flow needed.

## Campaign state

`campaignState()` in `src/lib/campaigns.ts`. **Derived, never stored.** Precedence matters and is easy to get wrong:

```
ended    if stopped === true OR endDate is in the past
draft    else if inWozku === false
paused   else if paused === true
live     otherwise
```

- `stopped` and `endDate` are kept separate on purpose, so stopping a campaign early does not rewrite the schedule it was planned against.
- `canGoLive(campaign, sessions)` requires state `draft` AND at least one submitted post.
- `"TBD"` as an `endDate` is treated as no date, not as a past date.

### Six required fields before publishing

`CAMPAIGN_REQUIRED` in `campaigns.ts`: logo, campaign name, header image, page description (rich text, non-empty per `isRichTextEmpty`), thank-you message, end date. `missingFields(campaign)` returns what is outstanding.

### Membership queries

Use these, do not reimplement: `isDraftIn`, `isSubmittedIn`, `campaignDrafts`, `campaignSubmitted`, `campaignMembers`, `campaignNamesFor`.

Note `isSubmittedIn` checks **both** `session.sentToCampaignIds` and `campaign.sessionIds`. Two sources of truth is a prototype artefact. See the schema note below.

### Screen ordering

`campaign.sessionIds` is **ordered, and that order is the public screen display order.** Append order equals screen order. `screenPosts()` sorts by index in that array; `publicScreenPosts()` additionally filters out `hiddenSessionIds`.

`hiddenSessionIds` is per-campaign, so the same post can show in one campaign and be hidden in another.

## Contests

`src/lib/contest.ts`. One `ContestSettings` object nested on the campaign.

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

Defaults: `ranked: true`, `ctaText: "Scan. Share. Win."`, `locale: "en-GB"`, `qrTarget: "share"`.

`ranked: false` switches the UI from ranks and scores to a flat starred list.

### Three things about contests you must know

1. **"Contest mode" and "Campaign mode" are not two entities.** There is one `Campaign`. Contest behaviour is `campaign.contest`; campaign-mode behaviour is `campaign.settings`. If a brief describes them as separate objects, reconcile before building.
2. **There is no points model.** `src/lib/leaderboard.ts` computes `score = shares * random_weight`, both from a seeded PRNG, keyed off campaign and person id. Nothing counts real shares. Any task touching scoring is designing a new feature, not fixing a bug.
3. **There is no prize entity.** "Prize" is only a live-screen moment with an image, a duration, and hardcoded copy. No name, tier, value, quantity, eligibility, or winner assignment exists anywhere.

## The live screen

`/c/[id]/screen`, rendered by `src/components/public/live-screen.tsx`.

**Moments** (`MomentId`): `welcome`, `posts`, `leaderboard`, `featured`, `prize`, `thanks`. Each has an enabled flag and a duration in seconds. `posts` is fixed and always enabled. Only `posts` is on by default.

Sequence templates auto-advance through enabled moments. Within the `posts` moment they step through posts before advancing. Single-view templates never change layout but still rotate their post slot.

**Six templates**, registered in `src/components/public/templates/index.ts`:

| id | Kind | Visual |
| --- | --- | --- |
| `blade` | sequence | Neutral all-rounder. One full-bleed centred card at a time. |
| `relay` | single | A race. Up to 8 lanes, avatar pucks running toward a chequered finish. |
| `mosaic` | single | A 4x3 tile wall. The busiest post takes the big cell. |
| `ledger` | single, light | Printed standings on warm paper. 12 ranked names in two columns. |
| `broadcast` | sequence, owns background | News desk. Blinking LIVE badge, scrolling ticker locked to the bottom bar. |
| `beacon` | sequence | Maximum legibility. Enormous uppercase mono, one huge QR. |

Controls: Space toggles play and pause, arrow keys step moments. `?only=<momentId>` pins a single moment and hides the controls, used by the admin preview and the embed snippet.

`momentRenderer()` falls back to the `blade` renderer for any moment a sequence template does not override.

## Public surfaces, and their two blocking defects

`/p/[id]` (public share page) and `/c/[id]/screen` both read `localStorage` with `ssr: false`.

**They only render in the browser that authored the data. They are not public links.** The core scan-share-leaderboard mechanic does not work across devices. Flag this before starting any task that assumes it does.

Second: `src/components/public/share-button.tsx` has **no `onClick`**. The terminal action of the entire product loop does nothing.

Also note `src/components/public/qr-glyph.tsx` draws a decorative grid. The screen QR does not scan. Real QR encoding via the `qrcode` package exists only in the admin post-links panel.

## If you are designing a backend

**Do not port `draftCampaignIds` and `sentToCampaignIds` into a database.** Two arrays means two places to check "is this submitted," and neither can record when a specific (post, campaign) pairing happened.

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

`/README.md` has the full endpoint contract including the composite `POST /campaigns/:id/share` that the send sheet actually needs, and it is correct. **Read it rather than re-deriving it.**

Two deliberate improvements on prototype behaviour that the README specifies: submitting an unstaged post should return an explicit error rather than silently no-op, and the composite share call must be one transaction rather than two unrolled-back client updates.

## Open questions, unresolved. Ask rather than assume.

1. Can a submitted post be withdrawn? Currently terminal.
2. Can an already-submitted post be edited? Today it silently demotes to `wip` with no check on whether it is live.
3. Does a paused or ended campaign block new shares into it? Not enforced today.
4. What happens to screen `position` when a post is withdrawn after later posts were submitted?
5. How is a share verified? Trusting the client is exploitable when a prize is attached.
