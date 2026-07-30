import type { Platform } from "./types";

export interface MentionAccount {
  id: string;
  handle: string;
  name: string;
  kind: "brand" | "person" | "community";
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
  {
    id: "m-buildersroom",
    handle: "buildersroom",
    name: "The Builders Room",
    kind: "community",
    platforms: ["x", "linkedin"],
    followers: 63500,
  },
  {
    id: "m-craftweekly",
    handle: "craftweekly",
    name: "Craft Weekly",
    kind: "community",
    platforms: ["x"],
    followers: 28700,
  },
  {
    id: "m-orbitcollective",
    handle: "orbitcollective",
    name: "Orbit Collective",
    kind: "community",
    platforms: ["instagram", "facebook"],
    followers: 34100,
  },
  {
    id: "m-signalclub",
    handle: "signal.club",
    name: "Signal Club",
    kind: "community",
    platforms: ["linkedin"],
    followers: 11200,
  },
];

export const MENTION_KIND_LABEL: Record<MentionAccount["kind"], string> = {
  brand: "Brand",
  person: "Person",
  community: "Community",
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
};

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
