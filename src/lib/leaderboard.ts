import { mockCount } from "./mock-engagement";
import type { Campaign, Session } from "./types";

export interface LeaderboardEntry {
  id: string;
  name: string;
  shares: number;
  score: number;
  rank: number;
}

const PEOPLE = [
  "Priya Raghavan",
  "John Mercer",
  "Sarah Taylor",
  "Aiko Nakamura",
  "Diego Alvarez",
  "Mei Lin",
  "Tom Okafor",
  "Hannah Weiss",
  "Kenji Watanabe",
  "Nadia Haddad",
  "Lucas Moreau",
  "Ruth Adeyemi",
].map((name, i) => ({ id: `p-${i}`, name }));

export function leaderboardFor(
  campaign: Campaign,
  posts: Session[],
): LeaderboardEntry[] {
  if (campaign.contest.leaderboardCleared) return [];
  if (posts.length === 0) return [];

  const size = mockCount(`board-${campaign.id}`, 6, PEOPLE.length);

  return PEOPLE.slice(0, size)
    .map((person) => {
      const shares = mockCount(`share-${campaign.id}-${person.id}`, 1, 24);
      return {
        id: person.id,
        name: person.name,
        shares,
        score: shares * mockCount(`weight-${campaign.id}-${person.id}`, 8, 40),
        rank: 0,
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

export function formatScore(score: number, locale: string) {
  try {
    return new Intl.NumberFormat(locale).format(score);
  } catch {
    return String(score);
  }
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
