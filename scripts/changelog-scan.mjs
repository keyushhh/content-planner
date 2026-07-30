#!/usr/bin/env node
/**
 * Keeps src/lib/changelog.ts in step with git.
 *
 *   npm run changelog          show what is missing, write nothing
 *   npm run changelog:write    insert the missing entries
 *   npm run changelog:check    exit code only, for a hook or CI
 *
 * Exits 1 when something is unlogged, so it can gate a push.
 *
 * The copy problem
 * ----------------
 * A commit subject says what the code did ("refactor: derive composer style
 * from mode"); the changelog has to say what changed for the person looking at
 * the screen. No script knows that. So there are two ways in:
 *
 *   1. A `Changelog:` trailer in the commit body. That prose IS the entry, and
 *      the entry is final.
 *   2. Nothing. The subject is used, and the entry is marked `draft: true`, so
 *      the modal shows it with a DRAFT tag until someone rewrites it.
 *
 * Either way the change is IN the list from the moment it ships, which is the
 * whole point: an unpolished entry beats a missing one.
 *
 * Trailers
 * --------
 *   Changelog: Export a campaign to CSV
 *     Includes the custom columns, and respects the current filter.
 *   Changelog-Kind: fixed
 *   Changelog-Skip: build tooling only, nothing visible
 *
 * The trailer's first line is the title; any further lines are the detail.
 * Changelog-Kind overrides the kind guessed from the commit prefix.
 * Changelog-Skip records the commit in CHANGELOG_OMITTED instead of listing it.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHANGELOG_PATH = join(root, "src/lib/changelog.ts");

const quiet = process.argv.includes("--quiet");
const write = process.argv.includes("--write");

/* ANSI codes built from a \u001b escape rather than a literal ESC byte, so
   the source stays greppable and survives an editor that strips control
   characters. */
const ESC = "\u001b";
const BOLD = `${ESC}[1m`;
const DIM = `${ESC}[2m`;
const YELLOW = `${ESC}[33m`;
const GREEN = `${ESC}[32m`;
const OFF = `${ESC}[0m`;

/** Record separators, so a multi-line commit body survives the round trip. */
const REC = "\u001e";
const FIELD = "\u001f";

/** Conventional-commit prefix to a changelog kind. A guess, always overridable. */
function guessKind(subject) {
  const type = subject.match(/^(\w+)(\([^)]*\))?!?:/)?.[1]?.toLowerCase();
  if (type === "feat") return "new";
  if (type === "fix" || type === "revert") return "fixed";
  if (type === "refactor" || type === "style" || type === "perf") return "improved";
  // chore/docs/test/build are usually invisible to the user, so they are omitted
  // rather than listed. "Usually" is not "always" though: the webpack pin was a
  // chore and it was the thing that unbroke the dev server, which is why a
  // `Changelog:` trailer overrides this.
  if (type === "chore" || type === "docs" || type === "test" || type === "build") {
    return null;
  }
  return "improved";
}

/** Strips the conventional prefix; the kind already carries that information. */
function titleFrom(subject) {
  const stripped = subject.replace(/^\w+(\([^)]*\))?!?:\s*/, "");
  return stripped.charAt(0).toUpperCase() + stripped.slice(1).replace(/\.$/, "");
}

/**
 * Pulls a trailer's value out of a commit body, including any continuation
 * lines, which are the ones indented under it or simply not starting a new
 * trailer of their own.
 */
function trailer(body, key) {
  const lines = body.split("\n");
  const at = lines.findIndex((l) => new RegExp(`^${key}:`, "i").test(l.trim()));
  if (at === -1) return null;

  const first = lines[at].trim().slice(key.length + 1).trim();
  const rest = [];
  for (const line of lines.slice(at + 1)) {
    // Stops at a blank line or at the next trailer key, so two trailers in a
    // row cannot bleed into each other.
    if (!line.trim()) break;
    if (/^[A-Za-z][A-Za-z-]*:/.test(line.trim())) break;
    rest.push(line.trim());
  }
  return { first, rest: rest.join(" ") };
}

/** A TS string literal, correctly escaped, whatever the prose contains. */
const lit = (value) => JSON.stringify(value);

const source = readFileSync(CHANGELOG_PATH, "utf8");

// Every sha the changelog accounts for: the ones it lists (`commit: "..."`) and
// the ones it deliberately omits (a sha as a key in CHANGELOG_OMITTED). Both are
// decisions, so both count as handled. Matched as a PREFIX of the full sha
// below, so this keeps working if git's abbreviation length ever changes.
const recorded = [
  ...[...source.matchAll(/commit:\s*"([0-9a-f]{7,40})"/g)].map((m) => m[1]),
  ...[...source.matchAll(/^\s*"([0-9a-f]{7,40})":/gm)].map((m) => m[1]),
];

const log = execFileSync(
  "git",
  ["log", `--pretty=format:%H${FIELD}%h${FIELD}%ad${FIELD}%s${FIELD}%b${REC}`, "--date=short"],
  { cwd: root, encoding: "utf8" },
)
  .split(REC)
  .map((r) => r.trim())
  .filter(Boolean)
  .map((record) => {
    const [full, short, date, subject, body = ""] = record.split(FIELD);
    return { full, short, date, subject, body };
  });

const missing = log.filter((c) => !recorded.some((sha) => c.full.startsWith(sha)));

/** Everything the writer needs, decided before anything is printed or written. */
const planned = missing.map((commit) => {
  const skip = trailer(commit.body, "Changelog-Skip");
  const prose = trailer(commit.body, "Changelog");
  const kindOverride = trailer(commit.body, "Changelog-Kind")?.first?.toLowerCase();
  const guessed = guessKind(commit.subject);

  if (skip) {
    return { ...commit, action: "omit", reason: skip.first || "No visible change." };
  }
  // A trailer is an explicit decision to list this, so it beats the prefix
  // heuristic that would otherwise drop a chore.
  if (!prose && guessed === null) {
    return {
      ...commit,
      action: "omit",
      reason: `${commit.subject.split(":")[0]} commit, nothing visible changed.`,
    };
  }

  const validKind = ["new", "improved", "fixed"].includes(kindOverride);
  return {
    ...commit,
    action: "list",
    kind: validKind ? kindOverride : (guessed ?? "improved"),
    title: prose ? prose.first : titleFrom(commit.subject),
    detail: prose ? prose.rest || null : null,
    draft: !prose,
  };
});

if (missing.length === 0) {
  if (!quiet) {
    console.log(`${GREEN}✓${OFF} Changelog is current. All ${log.length} commits accounted for.`);
  }
  process.exit(0);
}

if (quiet) {
  console.error(
    `✗ ${missing.length} commit(s) missing from src/lib/changelog.ts. Run: npm run changelog:write`,
  );
  process.exit(1);
}

/* ---------------------------------------------------------------- reporting */

if (!write) {
  console.log(
    `${missing.length} commit(s) not in the changelog.\n` +
      `Run ${BOLD}npm run changelog:write${OFF} to insert them, or add a\n` +
      `${BOLD}Changelog:${OFF} trailer to a commit first to control its wording.\n`,
  );

  for (const p of planned) {
    if (p.action === "omit") {
      console.log(`${DIM}  ${p.short}  omit   ${p.subject}\n         ${p.reason}${OFF}`);
      continue;
    }
    const tag = p.draft ? `${YELLOW}draft${OFF}` : `${GREEN}final${OFF}`;
    console.log(`  ${p.short}  ${tag}  ${BOLD}${p.kind}${OFF}  ${p.title}`);
    if (p.detail) console.log(`${DIM}         ${p.detail}${OFF}`);
  }

  const drafts = planned.filter((p) => p.action === "list" && p.draft).length;
  if (drafts > 0) {
    console.log(
      `\n${DIM}${drafts} would be written from the commit subject and tagged DRAFT\n` +
        `in the modal. Rewrite them in changelog.ts, or add a Changelog: trailer\n` +
        `when you commit and they arrive final.${OFF}`,
    );
  }
  process.exit(1);
}

/* ------------------------------------------------------------------ writing */

let next = source;

/** Inserts `text` immediately after the first occurrence of `anchor`. */
function insertAfter(haystack, anchor, text) {
  const at = haystack.indexOf(anchor);
  if (at === -1) throw new Error(`changelog.ts: could not find anchor ${lit(anchor)}`);
  const cut = at + anchor.length;
  return haystack.slice(0, cut) + text + haystack.slice(cut);
}

const toList = planned.filter((p) => p.action === "list");
const toOmit = planned.filter((p) => p.action === "omit");

// Oldest first, because each insert goes to the TOP of its array. Newest-first
// order plus top-insertion would come out exactly reversed.
for (const p of [...toList].reverse()) {
  const fields = [
    `        kind: ${lit(p.kind)},`,
    `        title: ${lit(p.title)},`,
    ...(p.detail ? [`        detail: ${lit(p.detail)},`] : []),
    `        commit: ${lit(p.short)},`,
    ...(p.draft ? ["        draft: true,"] : []),
  ];
  const entry = `\n      {\n${fields.join("\n")}\n      },`;

  const dayAnchor = `    date: "${p.date}",`;
  if (next.includes(dayAnchor)) {
    // The day exists: find ITS entries array, not the first one in the file.
    const dayAt = next.indexOf(dayAnchor);
    const entriesAt = next.indexOf("entries: [", dayAt);
    if (entriesAt === -1) throw new Error(`changelog.ts: no entries array for ${p.date}`);
    const cut = entriesAt + "entries: [".length;
    next = next.slice(0, cut) + entry + next.slice(cut);
  } else {
    // A new day block, at the top of CHANGELOG. No summary: that line is
    // editorial, and the type makes it optional for exactly this reason.
    const block = `\n  {\n    date: ${lit(p.date)},\n    entries: [${entry}\n    ],\n  },`;
    next = insertAfter(next, "export const CHANGELOG: ChangelogDay[] = [", block);
  }
}

for (const p of [...toOmit].reverse()) {
  next = insertAfter(
    next,
    "export const CHANGELOG_OMITTED: Record<string, string> = {",
    `\n  ${lit(p.short)}: ${lit(p.reason)},`,
  );
}

writeFileSync(CHANGELOG_PATH, next);

console.log(`${GREEN}✓${OFF} Updated src/lib/changelog.ts`);
for (const p of toList) {
  console.log(`  + ${p.short}  ${p.draft ? `${YELLOW}draft${OFF}` : `${GREEN}final${OFF}`}  ${p.title}`);
}
for (const p of toOmit) {
  console.log(`${DIM}  · ${p.short}  omitted: ${p.reason}${OFF}`);
}

const drafts = toList.filter((p) => p.draft).length;
if (drafts > 0) {
  console.log(
    `\n${drafts} entr${drafts === 1 ? "y" : "ies"} tagged DRAFT in the modal. ` +
      `Rewrite the title and\ndetail in changelog.ts, then drop the draft flag.`,
  );
}
