
export type ChangeKind = "new" | "improved" | "fixed";

export type ChangeEntry = {
  kind: ChangeKind;
  title: string;
  detail?: string;
  commit: string;
  draft?: boolean;
};

export type ChangelogDay = {
  date: string;
  summary?: string;
  entries: ChangeEntry[];
};

export const CHANGELOG: ChangelogDay[] = [
  {
    date: "2026-08-03",
    summary:
      "A repository that explains itself \u2014 a walkthrough, a hands-on first post, and a campaign page you can work from",
    entries: [
      {
        kind: "new",
        title: "Show me around \u2014 a walkthrough you can take more than once",
        detail:
          "A ? in the top bar walks you through the repository: what lives here, where posts get made, what Status gates, and how a post reaches a campaign. It dims and blurs everything except the part it is talking about rather than ringing it, and it is re-openable whenever you want it \u2014 useful the fiftieth time as much as the first. On a fresh install you get a small nudge beside the ?, never a dialog in your face. Steps that depend on table rows drop out when the repository is empty, so the count never promises a step it will not show.",
        commit: "fdae347",
      },
      {
        kind: "new",
        title: "Walk me through a post \u2014 you make a real one, step by step",
        detail:
          "Offered when the walkthrough ends, or from the ? menu. It waits for you to actually do each thing \u2014 click New post, choose a format, write some copy, attach a visual, add a tag \u2014 rather than clicking Next through screenshots. Change your mind and close the format picker and it rewinds a step; it never blocks you and Skip is always there. The post stays hidden while you work and at the end you decide whether to keep it as a real draft or clear it away.",
        commit: "fdae347",
      },
      {
        kind: "new",
        title: "Post types can be changed after you have started",
        detail:
          "The picker now says when to reach for each format instead of only what it is, and the footer no longer implies the choice is permanent, because it is not: a type chip under the post title reopens the picker. Your copy is kept, and anything attached that the new format cannot carry comes off.",
        commit: "fdae347",
      },
      {
        kind: "improved",
        title: "The empty repository teaches the journey",
        detail:
          "Instead of one line of text it shows the three steps a post moves through \u2014 write it, get it approved, send it to a campaign \u2014 with the buttons to start or to take the walkthrough. It is where a new person actually lands, and it disappears on its own once you have made something.",
        commit: "fdae347",
      },
      {
        kind: "improved",
        title: "Dev controls left the top bar",
        detail:
          "Seed 450, the demo-state switch, the brand layer and the version picker now live in a panel behind Ctrl+Shift+D with a DEV badge on it, so the top bar is just the app. Resetting the first-run nudge is in there too, which means testing it no longer means clearing storage and losing every post.",
        commit: "fdae347",
      },
      {
        kind: "improved",
        title: "\u201cNeeds copy, an asset, tags\u201d became clickable",
        detail:
          "Each missing item under the post title now jumps to the field it is talking about and puts your cursor in it. Hints on the toolbar and the row actions are real tooltips now rather than the browser\u2019s, so they appear straight away and read like the rest of the app \u2014 including the reasons a disabled button is disabled, which used to be unreachable at the one moment they mattered.",
        commit: "fdae347",
      },
      {
        kind: "fixed",
        title: "More greens that washed out under the brand guideline",
        detail:
          "Synced to Wozku, Ready to send, the ready-to-go-live banner and success dialogs were all still using the neutralised green, so they rendered grey with the brand layer on. They follow the theme now, like the campaign statuses already did. A brand-new post also said its last editor was \u201cUnknown\u201d; it says \u201cNot edited yet\u201d.",
        commit: "fdae347",
      },
      {
        kind: "fixed",
        title: "Live and Approved stay green with the brand guideline on",
        detail: "They were washing out to grey, which made a live campaign look inactive. Status colour now follows whichever theme you're in, in the campaigns list, on the campaign page, and on the post status badge.",
        commit: "8589063",
      },
      {
        kind: "new",
        title: "Type @ to tag someone, without leaving the keyboard",
        detail: "A suggestion menu opens at your cursor as soon as you type \"@\" — arrow keys to move, Enter to insert. It works in the main copy, in variations, and in AI drafts. Handles you type or paste yourself now count as tags too, so the post's tagged list always matches what it actually says.",
        commit: "8c6d55d",
      },
      {
        kind: "new",
        title: "Communities are gone from the mention picker",
        detail: "The picker is down to All, Orgs and People. Community accounts are no longer suggested when you tag.",
        commit: "0a15072",
      },
      {
        kind: "new",
        title: "You can write a post from inside a campaign",
        detail:
          "Add post sits in the campaign's header and creates the post already attached to that campaign, so it lands in its staged drafts instead of unattached in the repository — approve it and submit, as usual. Share, Calculate ROI and Screen Setup joined the header too; the quieter actions live behind the ⋯ menu so the row stays legible.",
        commit: "e187355",
      },
      {
        kind: "new",
        title: "Total shares and Est. reach now show on the campaign page itself",
        detail:
          "The stat tiles were only on a campaign's public page, so you had to open the shared link to see them. Both pages now render the same component, which means the figures can't drift apart. They appear once a campaign has something submitted.",
        commit: "e187355",
      },
      {
        kind: "new",
        title: "Calculate ROI estimates what a campaign returned",
        detail:
          "Enter what the campaign cost and what a share or a click is worth, and it works out earned reach, estimated value and ROI against the campaign's own figures. Nothing is saved — it's a scratchpad for sizing a campaign up. Screen Setup is in the menu but isn't wired up yet.",
        commit: "e187355",
      },
      {
        kind: "improved",
        title: "The campaign stat graphs were rebuilt, and they now read correctly in light mode",
        detail:
          "Total shares and Est. reach sit in stat tiles — label and value on the left, a small sharp-edged graph on the right. The shape is a seeded random walk rather than twelve unrelated samples, so it trends the way the percentage beside it claims instead of sawtoothing, and the line keeps its weight whatever the tile's width. Their colours previously only worked against the dark surface; they now follow the theme in both modes.",
        commit: "800adde",
      },
      {
        kind: "improved",
        title: "The QR panel on a campaign's public page is split into even halves",
        detail:
          "The copy column was a fixed width against a flexible white panel, so the white side took up roughly two thirds of the card. Both halves are now equal, and the placeholder reads as an actual QR grid rather than an icon of one.",
        commit: "800adde",
      },
      {
        kind: "new",
        title: "Sending a post from inside a campaign no longer means staging a draft first",
        detail:
          "The campaign you're looking at arrives pre-selected and marked \"Current\", and committing sends the post to it outright instead of leaving a draft you then had to submit by hand. Picking a different campaign is still one click — the pre-selection is a head start, not a decision, so the list never gets skipped. Any other campaign you tick still receives the post as a draft for its own owner to look over, and sending from the repository works exactly as before.",
        commit: "800adde",
      },
    ],
  },
  {
    date: "2026-07-31",
    summary: "Public campaign links, structured mentions, and a required header image",
    entries: [
      {
        kind: "new",
        title: "Taking a campaign live now gives you a real link to share",
        detail:
          "A confirmation toast and a copyable landing page link appear on the campaign page, plus per-post \"view\" links in the repository table. New public pages render the campaign or an individual post the way a recipient would see it, with a participants panel alongside.",
        commit: "5361e5a",
      },
      {
        kind: "new",
        title: "Mentions are now a real, structured list instead of text parsed out of the copy",
        detail: "Tagging inserts the @handle and adds the account to a stored list at the same time, so the post and each variation carry their own independent set. The picker gained a Communities tab and stays anchored to whatever field it's tagging instead of floating as one global modal. AI Assist now works on the main post with a simpler one-draft flow, new variations start from the primary post's copy, and picking every draft surfaces one clear \"add as alternates\" action instead of leaving per-draft Use buttons around to be ambiguous.",
        commit: "5ce8eb0",
      },
      {
        kind: "new",
        title: "Redesigned the campaign wizard's step header and made header image a required field",
        detail: "The three steps now stay visible with their names rather than collapsing into a bare progress bar, and brand guideline mode correctly forces sharp corners on the form. Header image is now validated and flagged like every other required field, and the campaigns list state filter no longer truncates \"All campaigns\".",
        commit: "26cfe66",
      },
    ],
  },
  {
    date: "2026-07-30",
    summary: "Motion, accessibility, and this list",
    entries: [
      {
        kind: "improved",
        title: "The campaign end date is a calendar popover, not a native input",
        detail: "Built on react-day-picker, so it matches the app's own styling instead of the browser's default date control.",
        commit: "0c9dafb",
      },
      {
        kind: "fixed",
        title: "Ensure native date pickers respect dark mode",
        commit: "1b26fd0",
      },
      {
        kind: "new",
        title: "Turned campaign creation into a 3-step wizard with shared components and lifted state.",
        commit: "83958b9",
      },
      {
        kind: "new",
        title: "Build the page people land on, and watch it as you type",
        commit: "e6fdb72",
      },
      {
        kind: "new",
        title: "Campaigns are a place now, not just a destination",
        commit: "aff965d",
      },
      {
        kind: "new",
        title: "Look at a post before you send it, and let the campaign approve it",
        commit: "01a46ee",
      },
      {
        kind: "new",
        title: "Pick the drafts you want, edit them in place, and mention accounts",
        commit: "af9304b",
      },
      {
        kind: "improved",
        title: "The content table reads the way you work",
        detail: "A Campaign column now says where each post lives, the old Campaign column is called Actions, and the row buttons float above the table so extra columns can scroll along behind them.",
        commit: "bc8eba1",
      },
      {
        kind: "new",
        title: "The session panel can be dragged closed",
        detail: "It tracks the pointer one to one, carries the momentum of a flick so a short fast throw dismisses it, and rubber-bands instead of stopping dead at its edge. Opening and closing became springs, so the motion can be interrupted and reversed mid-flight rather than having to finish.",
        commit: "3858ab8",
      },
      {
        kind: "new",
        title: "The system's accessibility settings are honoured",
        detail:
          "Reduce motion turns travel and press-shrink into plain fades and stops the caret blinking. Reduce transparency drops the frosted blur. Increase contrast strengthens the hairlines and muted text, which at 6 to 10 percent alpha were the first things to disappear.",
        commit: "3858ab8",
      },
      {
        kind: "fixed",
        title: "Brand mode reaches the small uppercase labels",
        detail:
          "Fifteen of them were still rendering in Geist with the brand layer on, because the mono treatment had never made it into this build. Every other font role was already correct: Geist with the brand off, Satoshi and Space Grotesk with it on.",
        commit: "3858ab8",
      },
      {
        kind: "improved",
        title: "The top bar lines up with the table",
        detail:
          "Its contents now sit in the same column as the content below, so the breadcrumb, the search field and the table's left edge share one line. On a wide screen the breadcrumb had been sitting about 328px to the left of the thing it labels.",
        commit: "3858ab8",
      },
      {
        kind: "improved",
        title: "Edges, hit areas, and a lighter touch on transitions",
        detail:
          "Uploaded images and PDF previews carry a faint outline so a pale photo cannot bleed into the surface. Small toolbar controls answer to a 40px hit area without growing. Table rows arrive staggered on a page change, headings wrap more evenly, and scroll edges fade only where content is genuinely hidden. Seven transitions that animated every property now animate only what changes.",
        commit: "3858ab8",
      },
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

export const CHANGELOG_OMITTED: Record<string, string> = {
  "ad3c4f0": "Merge commit. The work is logged under fdae347.",
  "cb3103c": "docs commit, nothing visible changed.",
  "c085c49": "docs commit, nothing visible changed.",
  "53558f4": "chore commit, nothing visible changed.",
  "e25e348": "Changelog copy only. Nothing in the product changed.",
  "58314f7": "Comment rewording only. No behaviour and nothing visible changed.",
  "dd31dfc": "README only. Its content is folded into the webpack entry.",
};

export const CHANGELOG_TOTAL = CHANGELOG.reduce(
  (sum, day) => sum + day.entries.length,
  0,
);

export const CHANGELOG_LATEST = CHANGELOG[0]?.date ?? "";
