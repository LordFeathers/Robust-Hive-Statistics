const API_BASE = "/api/hive";

export interface GlobalStats {
  unique_players: Record<string, number>;
}

export interface PlayerSearchResult {
  UUID: string;
  username: string;
  username_cc: string;
}

export interface CosmeticItem {
  name: string;
  icon?: string;
  rarity?: string;
}

export interface AvatarItem {
  url: string;
  name: string;
}

export interface PlayerProfile {
  UUID: string;
  xuid: number;
  username: string;
  username_cc: string;
  rank: string;
  first_played: number;
  daily_login_streak: number;
  longest_daily_login_streak: number;
  hub_title_count: number;
  hub_title_unlocked: string[];
  avatar_count: number;
  avatar_unlocked?: AvatarItem[];
  costume_count: number;
  costume_unlocked?: string[];
  hat_count: number;
  hat_unlocked?: CosmeticItem[];
  backbling_count: number;
  // API returns this under the literal key "cosmetics.backbling"
  "cosmetics.backbling"?: CosmeticItem[];
  friend_count: number;
  equipped_hub_title: string;
  equipped_avatar: AvatarItem | null;
  equipped_hat?: CosmeticItem | null;
  quest_count: number;
  paid_ranks: string[];
  pets: string[];
  mounts: string[];
}

export interface GameStats {
  UUID: string;
  xp: number;
  played: number;
  victories: number;
  first_played: number;
  prestige?: number;
  [key: string]: number | string | undefined;
}

export interface MonthlyStats {
  index: number;
  human_index: number;
  username: string;
  played?: number;
  victories?: number;
  xp?: number;
  [key: string]: number | string | undefined;
}

export class RateLimitError extends Error {
  constructor() {
    super("rate_limited");
  }
}

async function fetchApi<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_BASE}/${path}`);
  if (res.status === 429) throw new RateLimitError();
  if (!res.ok) return null;
  return res.json();
}

export async function searchPlayers(
  query: string
): Promise<PlayerSearchResult[]> {
  if (query.length < 4) return [];
  const data = await fetchApi<PlayerSearchResult[]>(`player/search/${encodeURIComponent(query)}`);
  return data || [];
}

export async function getPlayerProfile(
  identifier: string
): Promise<{ main: PlayerProfile } | null> {
  return fetchApi(`game/all/main/${encodeURIComponent(identifier)}`);
}

export async function getGameStats(
  game: string,
  identifier: string
): Promise<GameStats | null> {
  return fetchApi(`game/all/${game}/${encodeURIComponent(identifier)}`);
}

export async function getGlobalStats(): Promise<GlobalStats | null> {
  return fetchApi("global/statistics");
}

export async function getMonthlyStats(
  game: string,
  identifier: string
): Promise<MonthlyStats | null> {
  return fetchApi(`game/monthly/player/${game}/${encodeURIComponent(identifier)}`);
}

export interface LevelReward {
  name: string;
  icon: string | null;
  type: string;
  global: boolean;
}

export interface GameMeta {
  maxLevel: number;
  allowPrestiging: boolean;
  maxPrestige?: number;
  /** Keys are XP thresholds (as strings), values are level numbers */
  experienceToLevel: Record<string, number>;
  /** Keys are level numbers (as strings), values are arrays of rewards */
  levelUnlocks: Record<string, LevelReward[]>;
  /** Keys are cosmetic type names */
  levelUnlockTypes: Record<string, { name: string; icon: string; default: string | null }>;
}

export async function getGameMeta(gameId: string): Promise<GameMeta | null> {
  return fetchApi(`game/meta/${encodeURIComponent(gameId)}`);
}

export async function getAllGameStats(
  identifier: string,
  gameIds: string[]
): Promise<Record<string, GameStats | null>> {
  const results = await Promise.all(
    gameIds.map(async (id) => {
      const stats = await getGameStats(id, identifier);
      return [id, stats] as const;
    })
  );
  return Object.fromEntries(results);
}
