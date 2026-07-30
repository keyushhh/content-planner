/**
 * The changelog. Entries are added by scripts/changelog-scan.mjs and worded by
 * hand, because a commit subject says what the code did, not what changed for
 * the person looking at the screen. Newest first, by day and within a day.
 */

/** Three kinds: a change either arrived, got better, or was broken. */
export type ChangeKind = "new" | "improved" | "fixed";

export type ChangeEntry = {
  kind: ChangeKind;
  /** What changed, as the person who asked for it would say it. */
  title: string;
  /** The part you'd forget in a week: why, or what it means in practice. */
  detail?: string;
  /** Short sha, so a line can always be traced back to its diff. */
  commit: string;
  /**
   * Worded by the scanner from the commit subject, so the modal can say the copy
   * is machine-written. An unpolished entry beats a missing one. A commit with a
   * `Changelog:` trailer is never a draft, since that prose IS the copy.
   */
  draft?: boolean;
};

export type ChangelogDay = {
  /** ISO date. Sorts and formats without a parser. */
  date: string;
  /** The day in one line. Optional: it is the one field no script can write, so
      an auto-created day has none rather than a placeholder. */
  summary?: string;
  entries: ChangeEntry[];
};

export const CHANGELOG: ChangelogDay[] = [
  {
    date: "2026-07-30",
    summary: "This list, and the job of keeping it honest",
    entries: [
      {
        kind: "new",
        title: "The changelog keeps itself current",
        detail:
          "Every commit without an entry gets one automatically, so a change cannot quietly go missing. Add a `Changelog:` trailer when you commit and that wording becomes the entry; leave it out and the commit subject stands in, tagged DRAFT until someone rewrites it. A push can be made to fail while anything is still unlogged.",
        commit: "6ffdfa5",
      },
      {
        kind: "new",
        title: "What's new, from ⌘K",
        detail:
          "Every change since the first commit, grouped by the day it shipped, reachable only from the search bar. A dot appears on the row when something in here postdates the last time you opened it.",
        commit: "5fefbfb",
      },
    ],
  },
  {
    date: "2026-07-29",
    summary: "Two models separated, and the brand layer",
    entries: [
      {
        kind: "new",
        title: "Post type modal in Classic",
        detail:
          "Classic now asks what you're posting before the composer opens, in its own bordered dialect of the dialog rather than Repository's floating sheet.",
        commit: "34a3fe4",
      },
      {
        kind: "fixed",
        title: "Asset copy no longer promises video",
        detail: "Nothing in the product accepts a video, so nothing offers one.",
        commit: "23e784f",
      },
      {
        kind: "new",
        title: "Multi-select and bulk send",
        detail:
          "Tick several posts in the table and send them to campaigns in one pass. The selection clears after a send, so the same batch can't go out twice.",
        commit: "ffcf848",
      },
      {
        kind: "new",
        title: "AI variation generator",
        detail:
          "Generate variations of a post from the composer. The Length column came out of the table in the same pass, because it was measuring something nobody was deciding on.",
        commit: "a8dd465",
      },
      {
        kind: "fixed",
        title: "Seeded posts land in the campaign you have open",
        detail: "In Classic they were being attached to the wrong campaign.",
        commit: "04209e5",
      },
      {
        kind: "fixed",
        title: "Dev server runs on webpack",
        detail:
          "Turbopack was failing on this project, so `next dev` is pinned to webpack until that's resolved. Written up in the README.",
        commit: "695870e",
      },
      {
        kind: "improved",
        title: "Pagination and search bar sizing",
        detail:
          "The pagination band got a real background, and the search field a maximum width. At full bleed it read as a page, not a control.",
        commit: "99bd876",
      },
      {
        kind: "new",
        title: "Wozku brand layer in Repository",
        detail:
          "A header toggle re-skins Repository in the Wozku design system: emerald accent, square corners, three type families, hairlines instead of shadows, flat surfaces. Dark and light both. Purely additive: with it off, nothing about the original look changes.",
        commit: "7aa4629",
      },
      {
        kind: "new",
        title: "Split composer pane in Classic",
        detail: "Copy on one side, everything the post needs on the other.",
        commit: "a473e9c",
      },
      {
        kind: "improved",
        title: "A gradient behind the version preview",
        detail:
          "The switch dialog widened to give the two previews room to be compared rather than glanced at.",
        commit: "90b3566",
      },
      {
        kind: "new",
        title: "Layout previews when choosing a version",
        detail:
          "Both models now draw a miniature of their own layout, so the choice is made by looking rather than by reading two labels.",
        commit: "4733a50",
      },
      {
        kind: "improved",
        title: "Version dialogs rebuilt on the shared primitives",
        detail:
          "They inherit focus handling, backdrop and motion from every other dialog instead of restating it.",
        commit: "2f41746",
      },
      {
        kind: "new",
        title: "The version is chosen on load",
        detail:
          "Asked once on first open and remembered after that. Only the chosen model renders, so the other one costs nothing.",
        commit: "6217d87",
      },
      {
        kind: "improved",
        title: "Current is now called Classic",
        detail:
          "And the two models are genuinely separate in code, so a change to one can no longer leak into the other.",
        commit: "fd9c59f",
      },
      {
        kind: "improved",
        title: "Repository shell simplified",
        detail:
          "Campaign-specific views came out, and the model flags in the detail pane say what they actually mean.",
        commit: "1bbfaad",
      },
      {
        kind: "improved",
        title: "Composer style follows the mode",
        detail:
          "One layout deriving its dialect from the active model, instead of two layouts kept in sync by hand. The deprecated repository components went with it.",
        commit: "cd5b3ef",
      },
    ],
  },
  {
    date: "2026-07-28",
    summary: "Uploads, toasts, and a visual overhaul",
    entries: [
      {
        kind: "new",
        title: "Search everything with ⌘K",
        detail:
          "One field over posts, campaigns, tags and actions. Deliberately not a fuzzy matcher, because subsequence matching finds everything, which is the same as finding nothing.",
        commit: "7b67887",
      },
      {
        kind: "improved",
        title: "Visual polish pass across the app",
        detail:
          "The depth language settled here: translucent light layered over a dark page, a specular hairline on anything raised, and radius tracking elevation rather than size. Post titles now fly between the table row and the pane they open into.",
        commit: "7b67887",
      },
      {
        kind: "new",
        title: "File uploads in the media library",
        detail:
          "Plus a confirmation modal after a post is submitted, and toasts for everything that used to happen silently.",
        commit: "357a534",
      },
      {
        kind: "improved",
        title: "Tag filtering moved into a dropdown",
        detail:
          "A row of tag chips was spending the width of the toolbar to filter something you filter twice a day.",
        commit: "03b1b32",
      },
      {
        kind: "improved",
        title: "Variations grouped into bands",
        detail:
          "The primary post pins to the top, the rest group under headings, and moving between them is a visible affordance rather than a scroll.",
        commit: "5ce1c41",
      },
    ],
  },
  {
    date: "2026-07-27",
    summary: "The composer, the canvas, and feedback",
    entries: [
      {
        kind: "new",
        title: "Feedback replaces discussion panels",
        detail:
          "Comments became feedback with a state of its own, so a note can be resolved rather than just replied to. Custom table columns arrived in the same pass.",
        commit: "1ed5410",
      },
      {
        kind: "new",
        title: "PDF post type",
        detail:
          "Swiped as pages, with the library filtered to what the type can actually carry.",
        commit: "910be35",
      },
      {
        kind: "improved",
        title: "Byline spacing",
        detail: "It was colliding with the save chip.",
        commit: "28f6544",
      },
      {
        kind: "new",
        title: "Post type is asked before the composer opens",
        detail:
          "The type decides which fields you get, so it can't be a field inside them. The composer's limit indicators now move as you write.",
        commit: "ced92fa",
      },
      {
        kind: "fixed",
        title: "Comment counts were wrong",
        detail:
          "Fixed alongside refined suggestion rows, which now collapse instead of pushing the copy down the screen.",
        commit: "82c00f6",
      },
      {
        kind: "new",
        title: "Classic and Canvas variants",
        detail:
          "The first split into two models of the same product, with a tag filter bar and a much heavier sessions table behind it.",
        commit: "c707e8f",
      },
      {
        kind: "new",
        title: "Comments anchor to the field they're about",
        detail:
          "A note on the copy stays with the copy. Feedback on a specific field no longer arrives as a paragraph describing which field it meant.",
        commit: "9bd271f",
      },
      {
        kind: "improved",
        title: "Locked state on the canvas",
        detail:
          "A post that's live reads as locked, and readiness is stated rather than implied.",
        commit: "4926254",
      },
      {
        kind: "new",
        title: "Composer and canvas",
        detail:
          "The two writing surfaces the whole planning flow runs through.",
        commit: "3003700",
      },
    ],
  },
  {
    date: "2026-07-24",
    summary: "Comments that thread, and a table you can shape",
    entries: [
      {
        kind: "new",
        title: "Custom columns in the sessions table",
        detail: "Alongside a redesigned confirmation dialog.",
        commit: "125a45a",
      },
      {
        kind: "new",
        title: "Threaded comments, kept between visits",
        detail:
          "State persists to local storage, and status transitions got stricter about what can follow what.",
        commit: "4df4dd6",
      },
    ],
  },
  {
    date: "2026-07-23",
    summary: "The repository takes shape",
    entries: [
      {
        kind: "improved",
        title: "Media library and upload popover restyled",
        detail: "Violet accent, and a layout consistent with everything around it.",
        commit: "bc18a6d",
      },
      {
        kind: "new",
        title: "History, hashtags, and campaigns from the shell",
        detail:
          "Session history is tracked, the activity log can be cleared, hashtags are suggested as you write, and a campaign can be created without leaving the repository.",
        commit: "13dd88b",
      },
      {
        kind: "new",
        title: "Global invite modal",
        detail:
          "Moved to the shell, because inviting someone is about the workspace, not about whichever post happened to be open.",
        commit: "d00c89c",
      },
      {
        kind: "new",
        title: "Search in the media library",
        detail: "With consistent status badges and asset tiles.",
        commit: "1cc23fa",
      },
      {
        kind: "improved",
        title: "Side panel rebuilt on Sheet",
        detail:
          "A custom implementation replaced by the shared primitive, plus duplicate-session and keyboard shortcuts.",
        commit: "66500f0",
      },
      {
        kind: "new",
        title: "Collapsible sidebar with profile",
        detail:
          "Platform details in the session pane now only appear when there's a platform to talk about.",
        commit: "179c825",
      },
      {
        kind: "new",
        title: "Content Planner",
        detail:
          "Posts and campaigns as a two-way repository: a post lives in one place and is sent to many, rather than being copied into each.",
        commit: "ce10f6a",
      },
      {
        kind: "new",
        title: "Project set up",
        commit: "6e6c1e2",
      },
    ],
  },
];

/**
 * Commits deliberately left out, and why. The scanner counts these as handled,
 * so the check can reach green, and "missed or skipped?" has an answer later.
 */
export const CHANGELOG_OMITTED: Record<string, string> = {
  // Committed as `feat:`, so the scanner would have listed it. Use
  // `Changelog-Skip:` for the next one.
  "e25e348": "Changelog copy only. Nothing in the product changed.",
  "58314f7": "Comment rewording only. No behaviour and nothing visible changed.",
  "dd31dfc": "README only. Its content is folded into the webpack entry.",
};

export const CHANGELOG_TOTAL = CHANGELOG.reduce(
  (sum, day) => sum + day.entries.length,
  0,
);

/** The newest date in the log, which is what "unread" is measured against. */
export const CHANGELOG_LATEST = CHANGELOG[0]?.date ?? "";
