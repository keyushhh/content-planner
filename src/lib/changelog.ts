
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
    date: "2026-08-06",
    summary:
      "The screen is the only public surface now, and every post can show you which of its versions is actually earning.",
    entries: [
      {
        kind: "new",
        title: "See which version of a post is winning",
        detail:
          "A post can carry variations, and the QR hands them out at random, so the product was already running a test on every post and throwing the result away. Each post in a campaign now opens a report: what it earned, then its versions ranked against each other on likes, shares and comments, each showing the wording it used and how far ahead of the primary post it is. Underneath sits the share ledger the numbers are built from, one row per person, naming the version they were given, and it downloads as CSV. A version needs four shares before it can be crowned, because with random assignment a lead off two shares is the draw talking rather than the copy.",
        commit: "a34a112",
      },
      {
        kind: "new",
        title: "Links and QR codes for a post",
        detail:
          "The public link and one link per platform the post goes out on, each with a QR code that is generated from the URL rather than drawn to look like one, downloadable as PNG or SVG. The code is shown, not just offered, so you can see what you are about to print. The per-platform link still routes through the landing page instead of jumping straight to the platform, because that page is where a version gets assigned and the share gets counted.",
        commit: "a34a112",
      },
      {
        kind: "improved",
        title: "There is no shareable page any more, only the live screen",
        detail:
          "Screen Setup and Appearance each had a preview toggle between a shareable page and the live screen, which meant designing two surfaces and explaining the difference. The page is gone. Opening a campaign link lands on the live screen, and the previews show that and nothing else.",
        commit: "a34a112",
      },
      {
        kind: "improved",
        title: "The campaign posts table lost its duplicate action",
        detail:
          "Duplicating a post belongs in the Repository, where posts are made. Inside a campaign it sat next to actions about a live post's performance and read as a way to fork something already running. It is still in the Repository, untouched.",
        commit: "a34a112",
      },
    ],
  },
  {
    date: "2026-08-05",
    entries: [
      {
        kind: "new",
        title: "A locked-down build for the dev hand-off",
        detail:
          "The Repository → Campaign draft flow is design-complete, so this build restricts itself to exactly that: no Classic mode, brand guidelines forced on, and the in-progress Campaign section (Go Live, ROI, Screen Setup, campaign creation) hidden from the UI and from ⌘K. The README is now the full spec: the six screens, the data model, the API contract we recommend, and what's safe to reuse.",
        commit: "6174211",
      },
      {
        kind: "fixed",
        title: "The post readiness bar filled in the wrong order",
        detail:
          "Each segment was tied to a specific field's fixed position (copy, then assets, then tags), so finishing them out of order looked like the bar was filling from the right. It now fills left to right by how many are done, whichever fields they are.",
        commit: "6174211",
      },
      {
        kind: "fixed",
        title: "AI Assist's generated draft is now editable before you use it",
        detail: "It used to be read-only text until you clicked Use; you can now edit it directly first.",
        commit: "6174211",
      },
      {
        kind: "fixed",
        title: "Adding a variation as an alternate returns you to the variations table",
        detail: "It used to leave you stranded on that variation's own screen instead.",
        commit: "6174211",
      },
    ],
  },
  {
    date: "2026-08-04",
    entries: [
      {
        kind: "new",
        title: "Delete several posts at once",
        detail:
          "Selecting rows already let you send a batch to a campaign together. Clearing out stale drafts meant deleting them one at a time until now; select them and delete the batch, behind the same confirmation a single delete already asks for.",
        commit: "25be6c3",
      },
      {
        kind: "new",
        title: "Taking a campaign live now leads somewhere",
        detail:
          "It used to just fire a toast. A modal now hands you the public link plus two next steps (invite advocates or estimate its ROI), and the campaign page keeps speaking once it's live or ended instead of going quiet. The journey strip carries the story two beats further too: advocates sharing it, and seeing what it earned.",
        commit: "8b174c1",
      },
      {
        kind: "fixed",
        title: "The post editor now closes when you jump to a campaign from the send confirmation",
        detail: "It used to stay open over the campaign page, hiding the very campaign you asked to see.",
        commit: "ad4c2bd",
      },
      {
        kind: "new",
        title: "The pipeline strip is now a status filter, with live counts",
        detail:
          "It used to just name the four stages a post travels through. Its pills now show how many posts are in each stage and filter the table when clicked, so it teaches the model and gets you to the posts you need in one click.",
        commit: "947115d",
      },
      {
        kind: "improved",
        title: "Select every matching post at once when building a campaign",
        detail:
          "Step 2 of the wizard listed your posts with a checkbox each, so starting a campaign from a dozen drafts meant a dozen clicks. There is a select-all now, and it acts on whatever your search has narrowed the list to rather than on everything.",
        commit: "59f6553",
      },
      {
        kind: "new",
        title: "A campaign page you can run the campaign from",
        detail:
          "It was a header and a table. It now opens on four stat cards, a performance chart that stays folded away because the posts table is what the page is actually for, and a settings panel that says what each toggle does instead of naming it. The post-type mix hides itself when there is only one type, because a bar reading “Image 100%” tells you nothing. Row actions inside a campaign moved into their own column; the hover overlay floats above the row, and in a narrower table it was landing on top of the cells it is meant to sit beside. Tables elsewhere are untouched.",
        commit: "85605c6",
      },
      {
        kind: "new",
        title: "Pause, resume and stop a campaign",
        detail:
          "A live campaign had one exit: wait for its end date. You can pause one and put it back, or stop it early behind a confirmation that spells out the difference: a stopped campaign cannot be reopened, so pause it if you only need a break. Stopping records itself separately rather than back-dating the end date, so ending a campaign early never rewrites the schedule it was planned against. Both public pages follow: a paused campaign shows a holding page, and a hidden post says so rather than breaking.",
        commit: "b0fb7e4",
      },
      {
        kind: "new",
        title: "Screen Setup decides what the public screen actually shows",
        detail:
          "The old sheet was a placeholder. It is a page now: the link and QR to hand out, and every post on the screen with a switch, drag-to-reorder, and its own menu. Turning a post off takes it off the screen without removing it from the campaign, and that choice is per-campaign; the same post can show in one and be hidden in another.",
        commit: "c81bc58",
      },
      {
        kind: "new",
        title: "Themes, and a second screen built for a projector",
        detail:
          "Colour scheme, accent, font and a backdrop, with the preview beside them showing the result as you go; that preview is no longer an impression of the page, it is the page itself at a smaller scale, so it cannot drift from what visitors get. There is a second surface too, a full-screen version that plays Welcome, Posts, a featured video, the prize and a thank-you on a loop, with space and arrow keys so whoever is running the room can hold a slide when a speaker overruns.",
        commit: "e0ace76",
      },
      {
        kind: "new",
        title: "Contest settings, a leaderboard, and an embed that works",
        detail:
          "The leaderboard is real: a podium for the top three and a ranked list below, or a flat list of everyone when you would rather not show scores. Contest settings covers the call to action, what the QR opens, the language scores are formatted in, and the two closing messages for winners announced or still pending. Clearing the board asks first and can be rebuilt afterwards, so it is not a one-way door. Embed gives you an iframe that genuinely runs (whole screen or leaderboard only) rather than a snippet you have to trust.",
        commit: "a6f9610",
      },
      {
        kind: "improved",
        title: "See the campaign page full size while you are still writing it",
        detail:
          "The preview in the campaign form is a narrow card in a sidebar, which is a hard place to judge whether your header image and description sit well together. Expand opens the same preview inside a laptop, big enough to read, with nothing cut off and nothing to scroll.",
        commit: "d8b3961",
      },
    ],
  },
  {
    date: "2026-08-03",
    summary:
      "A repository that explains itself \u2014 a walkthrough, a hands-on first post, and a campaign page you can work from",
    entries: [
      {
        kind: "fixed",
        title: "\u201cReady\u201d means one thing now, everywhere",
        detail:
          "Three parts of the app disagreed about what a finished post is. The composer tracked copy, a visual and tags and told you \u201cReady to send\u201d once all three were in; the actual gate only ever checked copy; and the greyed-out Approved option asked for an image it never really wanted. So you could tick all three and find no Send button, or approve and send a post with no visual at all. There is a single rule now \u2014 copy and a visual are required, tags are worth adding but never block you, and a Reshare needs no visual because it keeps the original\u2019s. The readiness line, the Approve gate and the reason it gives you all read from that one rule.",
        commit: "55474d8",
      },
      {
        kind: "fixed",
        title: "The reason a button is greyed out is finally readable",
        detail:
          "Staged, \u201cUp to date\u201d, \u201cApprove to update\u201d, \u201cNot ready\u201d, Take it live, the send sheet and a locked post\u2019s status \u2014 every one of them explained itself through a tooltip that could not physically appear, because a disabled control does not register the hover. The explanations were written and unreachable. They show up now, and the greyed-out Approved option puts its reason on screen as plain text instead of hiding it behind a hover.",
        commit: "55474d8",
      },
      {
        kind: "improved",
        title: "How a post gets from draft to live stays learnable",
        detail:
          "The Write \u2192 Approve \u2192 Send row was the clearest explanation of the whole model and it vanished the moment you made your first post. It is a strip under the header now \u2014 with the fourth beat, the campaign going live, spelled out \u2014 which you can dismiss, and which steps aside on its own once you have a few posts. Every status badge also tells you what its stage means and what unlocks the next one, so you can ask on row four hundred as easily as row one.",
        commit: "55474d8",
      },
      {
        kind: "improved",
        title: "Selecting posts in bulk tells you what it left out",
        detail:
          "The bulk bar only mentioned how many were ready when that number happened to differ from your selection, so the idea that readiness mattered stayed hidden until the maths disagreed. It now always shows the split and names the reason \u2014 how many need approval, how many are already out and unchanged. The table footer also owns up when your selection runs past the page you are looking at.",
        commit: "55474d8",
      },
      {
        kind: "new",
        title: "Keyboard shortcuts, written down at last",
        detail:
          "J and K to move between rows, X to tick one, shift-X for everything up to it, Enter to open, \u2318S to save, \u2318\u21b5 to send. All of it already worked and none of it was written anywhere. There is a sheet in the ? menu now. Hover-only row actions also appear when you tab to them, so Duplicate and Delete exist for the keyboard too \u2014 and Duplicate now admits it makes a fresh draft without the original\u2019s campaigns.",
        commit: "55474d8",
      },
      {
        kind: "fixed",
        title: "Small things the app was saying that were not true",
        detail:
          "The guided tutorial told you a post type could be changed later; it cannot. The tour described a fourth post stage that does not exist \u2014 going live is something a campaign does. A post\u2019s status trigger read \u201cwip\u201d in lowercase beside badges reading \u201cWIP\u201d, and its Approved dot was a hardcoded green that turned dead grey under the brand layer. Filtering to a status with no matches blamed your tags. Staged posts were counted as \u201cwaiting for approval\u201d, which is a different thing entirely. And five items in the campaign menu \u2014 Copy link, Settings, Duplicate, Export, Delete \u2014 looked clickable and did nothing; Copy link works now and the rest are gone.",
        commit: "55474d8",
      },
      {
        kind: "improved",
        title: "The campaign page stops keeping secrets",
        detail:
          "A campaign has six things its public page needs \u2014 a logo, a name, a header image, a description, a thank-you message and an end date \u2014 and the app tracked all six while never mentioning them. They are listed now when any are missing, with a way straight to the editor. A campaign holding five staged posts no longer reports \u201c0 posts\u201d, the placeholder reach and share figures are labelled as sample data rather than passing for real reporting, and the NEW chip stamped on every new campaign is gone.",
        commit: "55474d8",
      },
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
        kind: "improved",
        title: "The post type picker says when to reach for each format",
        detail:
          "Image, Frames, PDF and Reshare used to describe only what they are. They now say what each one is for, because the choice is fixed once you start \u2014 which the picker is also clearer about. The type you picked shows under the post title while you write.",
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
        title: "The readiness line colours itself in as you go",
        detail:
          "Copy, asset and tags each sit under the post title in amber until they are there, then turn green with a tick \u2014 so you can see what is left at a glance instead of reading a sentence. Clicking one jumps to that field and puts your cursor in it. Hints on the toolbar and the row actions are real tooltips now rather than the browser\u2019s, so they appear straight away and read like the rest of the app \u2014 including the reasons a disabled button is disabled, which used to be unreachable at the one moment they mattered.",
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
        detail: "A suggestion menu opens at your cursor as soon as you type \"@\"; arrow keys to move, Enter to insert. It works in the main copy, in variations, and in AI drafts. Handles you type or paste yourself now count as tags too, so the post's tagged list always matches what it actually says.",
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
          "Add post sits in the campaign's header and creates the post already attached to that campaign, so it lands in its staged drafts instead of unattached in the repository; approve it and submit, as usual. Share, Calculate ROI and Screen Setup joined the header too; the quieter actions live behind the ⋯ menu so the row stays legible.",
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
          "Enter what the campaign cost and what a share or a click is worth, and it works out earned reach, estimated value and ROI against the campaign's own figures. Nothing is saved; it's a scratchpad for sizing a campaign up. Screen Setup is in the menu but isn't wired up yet.",
        commit: "e187355",
      },
      {
        kind: "improved",
        title: "The campaign stat graphs were rebuilt, and they now read correctly in light mode",
        detail:
          "Total shares and Est. reach sit in stat tiles: label and value on the left, a small sharp-edged graph on the right. The shape is a seeded random walk rather than twelve unrelated samples, so it trends the way the percentage beside it claims instead of sawtoothing, and the line keeps its weight whatever the tile's width. Their colours previously only worked against the dark surface; they now follow the theme in both modes.",
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
          "The campaign you're looking at arrives pre-selected and marked \"Current\", and committing sends the post to it outright instead of leaving a draft you then had to submit by hand. Picking a different campaign is still one click; the pre-selection is a head start, not a decision, so the list never gets skipped. Any other campaign you tick still receives the post as a draft for its own owner to look over, and sending from the repository works exactly as before.",
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
  "6e5a77e": "Corrects fdae347 before release; its entries describe the shipped behaviour.",
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
