import type { Platform } from "./types";

export interface MentionAccount {
  id: string;
  handle: string;
  name: string;
  kind: "brand" | "person";
  platforms: Platform[];
  followers: number;
}

export const mentionAccounts: MentionAccount[] = [
  {
    id: "m-northwind",
    handle: "northwindlabs",
    name: "Northwind Labs",
    kind: "brand",
    platforms: ["linkedin", "x"],
    followers: 48200,
  },
  {
    id: "m-meridian",
    handle: "meridian.co",
    name: "Meridian Co",
    kind: "brand",
    platforms: ["linkedin", "instagram"],
    followers: 21400,
  },
  {
    id: "m-havenstudio",
    handle: "havenstudio",
    name: "Haven Studio",
    kind: "brand",
    platforms: ["instagram", "facebook"],
    followers: 15900,
  },
  {
    id: "m-lumen",
    handle: "lumenmade",
    name: "Lumen Made",
    kind: "brand",
    platforms: ["instagram"],
    followers: 9300,
  },
  {
    id: "m-sarah",
    handle: "sarahtaylor",
    name: "Sarah Taylor",
    kind: "person",
    platforms: ["linkedin"],
    followers: 7600,
  },
  {
    id: "m-john",
    handle: "johnmakes",
    name: "John M.",
    kind: "person",
    platforms: ["linkedin", "x"],
    followers: 4100,
  },
  {
    id: "m-priya",
    handle: "priya.designs",
    name: "Priya R.",
    kind: "person",
    platforms: ["instagram", "linkedin"],
    followers: 12800,
  },
  {
    id: "m-diego",
    handle: "diegoalvarez",
    name: "Diego Alvarez",
    kind: "person",
    platforms: ["linkedin"],
    followers: 3300,
  },
];

export const MENTION_KIND_LABEL: Record<MentionAccount["kind"], string> = {
  brand: "Brand",
  person: "Person",
};

export const MENTION_GROUP_LABEL: Record<MentionAccount["kind"], string> = {
  brand: "Organizations",
  person: "People",
};

export type MentionTab = "all" | "orgs" | "people";

export const MENTION_TABS: { id: MentionTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "orgs", label: "Orgs" },
  { id: "people", label: "People" },
];

const TAB_KINDS: Record<MentionTab, MentionAccount["kind"][]> = {
  all: ["brand", "person"],
  orgs: ["brand"],
  people: ["person"],
};

const KIND_ORDER: MentionAccount["kind"][] = ["brand", "person"];

export function accountsForTab(tab: MentionTab, accounts: MentionAccount[]) {
  const kinds = TAB_KINDS[tab];
  return accounts.filter((a) => kinds.includes(a.kind));
}

export function groupByKind(accounts: MentionAccount[]) {
  return KIND_ORDER.map((kind) => ({
    kind,
    label: MENTION_GROUP_LABEL[kind],
    accounts: accounts.filter((a) => a.kind === kind),
  })).filter((group) => group.accounts.length > 0);
}

export function accountsByIds(ids: string[], accounts = mentionAccounts) {
  const set = new Set(ids);
  return accounts.filter((a) => set.has(a.id));
}

export function formatFollowers(count: number) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return String(count);
}

export function searchMentions(query: string, accounts = mentionAccounts) {
  const q = query.trim().toLowerCase().replace(/^@/, "");
  if (!q) return accounts;
  return accounts.filter(
    (a) => a.handle.toLowerCase().includes(q) || a.name.toLowerCase().includes(q),
  );
}

/**
 * The `@token` the caret is currently sitting inside, or null. Requires whitespace (or the
 * start of the text) before the `@` so an email address never opens the picker.
 */
export function activeMentionToken(text: string, caret: number) {
  const at = Math.max(0, Math.min(caret, text.length));
  const match = text.slice(0, at).match(/(^|\s)@([A-Za-z0-9._]*)$/);
  if (!match) return null;
  const query = match[2];
  return { query, start: at - query.length - 1 };
}

export function mentionsIn(text: string) {
  const found = new Set<string>();
  for (const match of text.matchAll(/@([A-Za-z0-9._]+)/g)) {
    found.add(match[1].toLowerCase());
  }
  return mentionAccounts.filter((a) => found.has(a.handle.toLowerCase()));
}

export function stripMention(text: string, handle: string) {
  const escaped = handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text
    .replace(new RegExp(`[ \\t]?@${escaped}(?![A-Za-z0-9._])`, "gi"), "")
    .replace(/[ \t]{2,}/g, " ");
}

export function insertMention(text: string, caret: number, handle: string) {
  const at = Math.max(0, Math.min(caret, text.length));
  const before = text.slice(0, at);
  const after = text.slice(at);
  const partial = before.match(/@[A-Za-z0-9._]*$/);
  const start = partial ? at - partial[0].length : at;
  const lead = start > 0 && !/\s$/.test(text.slice(0, start)) ? " " : "";
  const token = `${lead}@${handle}`;
  const trail = /^[\s.,!?]/.test(after) ? "" : " ";
  return {
    text: `${text.slice(0, start)}${token}${trail}${after}`,
    caret: start + token.length + trail.length,
  };
}
