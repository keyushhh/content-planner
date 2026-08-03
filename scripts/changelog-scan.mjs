#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHANGELOG_PATH = join(root, "src/lib/changelog.ts");

const quiet = process.argv.includes("--quiet");
const write = process.argv.includes("--write");

const ESC = "\u001b";
const BOLD = `${ESC}[1m`;
const DIM = `${ESC}[2m`;
const YELLOW = `${ESC}[33m`;
const GREEN = `${ESC}[32m`;
const OFF = `${ESC}[0m`;

const REC = "\u001e";
const FIELD = "\u001f";

function guessKind(subject) {
  const type = subject.match(/^(\w+)(\([^)]*\))?!?:/)?.[1]?.toLowerCase();
  if (type === "feat") return "new";
  if (type === "fix" || type === "revert") return "fixed";
  if (type === "refactor" || type === "style" || type === "perf") return "improved";
  if (type === "chore" || type === "docs" || type === "test" || type === "build") {
    return null;
  }
  return "improved";
}

function titleFrom(subject) {
  const stripped = subject.replace(/^\w+(\([^)]*\))?!?:\s*/, "");
  return stripped.charAt(0).toUpperCase() + stripped.slice(1).replace(/\.$/, "");
}

function trailer(body, key) {
  const lines = body.split("\n");
  const at = lines.findIndex((l) => new RegExp(`^${key}:`, "i").test(l.trim()));
  if (at === -1) return null;

  const first = lines[at].trim().slice(key.length + 1).trim();
  const rest = [];
  for (const line of lines.slice(at + 1)) {
    if (!line.trim()) break;
    if (/^[A-Za-z][A-Za-z-]*:/.test(line.trim())) break;
    rest.push(line.trim());
  }
  return { first, rest: rest.join(" ") };
}

const lit = (value) => JSON.stringify(value);

const source = readFileSync(CHANGELOG_PATH, "utf8");

const recorded = [
  ...[...source.matchAll(/commit:\s*"([0-9a-f]{7,40})"/g)].map((m) => m[1]),
  ...[...source.matchAll(/^\s*"?([0-9a-f]{7,40})"?\s*:/gm)].map((m) => m[1]),
];

const log = execFileSync(
  "git",
  [
    "log",
    "--no-merges",
    `--pretty=format:%H${FIELD}%h${FIELD}%ad${FIELD}%s${FIELD}%b${REC}`,
    "--date=short",
  ],
  { cwd: root, encoding: "utf8" },
)
  .split(REC)
  .map((r) => r.trim())
  .filter(Boolean)
  .map((record) => {
    const [full, short, date, subject, body = ""] = record.split(FIELD);
    return { full, short, date, subject, body };
  });

const missing = log.filter(
  (c) =>
    !recorded.some((sha) => c.full.startsWith(sha)) &&
    !trailer(c.body, "Changelog-Skip"),
);

const planned = missing.map((commit) => {
  const skip = trailer(commit.body, "Changelog-Skip");
  const prose = trailer(commit.body, "Changelog");
  const kindOverride = trailer(commit.body, "Changelog-Kind")?.first?.toLowerCase();
  const guessed = guessKind(commit.subject);

  if (skip) {
    return { ...commit, action: "omit", reason: skip.first || "No visible change." };
  }
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

let next = source;

function insertAfter(haystack, anchor, text) {
  const at = haystack.indexOf(anchor);
  if (at === -1) throw new Error(`changelog.ts: could not find anchor ${lit(anchor)}`);
  const cut = at + anchor.length;
  return haystack.slice(0, cut) + text + haystack.slice(cut);
}

const toList = planned.filter((p) => p.action === "list");
const toOmit = planned.filter((p) => p.action === "omit");

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
    const dayAt = next.indexOf(dayAnchor);
    const entriesAt = next.indexOf("entries: [", dayAt);
    if (entriesAt === -1) throw new Error(`changelog.ts: no entries array for ${p.date}`);
    const cut = entriesAt + "entries: [".length;
    next = next.slice(0, cut) + entry + next.slice(cut);
  } else {
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
