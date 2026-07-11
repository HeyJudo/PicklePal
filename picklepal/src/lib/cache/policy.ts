export const CACHE_DOMAINS = [
  "group-meta",
  "history",
  "dashboard",
  "leaderboard",
  "players",
  "sessions",
  "belts",
  "recap",
] as const;

export type CacheDomain = (typeof CACHE_DOMAINS)[number];

export type CacheMutation =
  | "group-metadata"
  | "match-result"
  | "player-roster"
  | "session-state"
  | "belt-state";

const DOMAIN_SET = new Set<string>(CACHE_DOMAINS);

const MUTATION_DOMAINS: Readonly<Record<CacheMutation, readonly CacheDomain[]>> = {
  "group-metadata": ["group-meta"],
  "match-result": ["history", "dashboard", "leaderboard", "sessions", "belts", "recap"],
  "player-roster": [
    "players",
    "history",
    "dashboard",
    "leaderboard",
    "sessions",
    "belts",
    "recap",
  ],
  "session-state": ["history", "dashboard", "sessions", "recap"],
  "belt-state": ["dashboard", "leaderboard", "belts"],
};

export function cacheTag(
  domain: CacheDomain,
  groupKey: string,
  resourceKey?: string,
): string {
  if (!DOMAIN_SET.has(domain)) {
    throw new Error(`Unsupported cache domain: ${domain}`);
  }

  return ["group", groupKey, domain, resourceKey].filter(Boolean).join(":");
}

export function domainsForMutation(mutation: CacheMutation): readonly CacheDomain[] {
  return MUTATION_DOMAINS[mutation];
}

export function tagsForMutation(
  mutation: CacheMutation,
  groupKey: string,
  recapResourceKey?: string,
): readonly string[] {
  return domainsForMutation(mutation).map((domain) =>
    cacheTag(domain, groupKey, domain === "recap" ? recapResourceKey : undefined),
  );
}
