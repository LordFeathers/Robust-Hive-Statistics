export interface GameConfig {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  /** XP increment constant for level calculation: level = floor((-1 + sqrt(1 + 8*xp/xpConstant)) / 2) + 1 */
  xpConstant: number;
  statLabels: Record<string, string>;
  /** Fields to display as "primary" hero stats */
  primaryStats: string[];
  /** Computed ratio stats */
  computedStats?: {
    label: string;
    compute: (data: Record<string, number>) => number | null;
    format?: "ratio" | "percent";
  }[];
}

export const GAME_CONFIGS: GameConfig[] = [
  {
    id: "bed",
    name: "BedWars",
    shortName: "BED",
    icon: "🛏️",
    color: "#f87171",
    xpConstant: 150,
    statLabels: {
      xp: "Experience",
      played: "Games Played",
      victories: "Victories",
      final_kills: "Final Kills",
      kills: "Kills",
      deaths: "Deaths",
      beds_destroyed: "Beds Destroyed",
      first_played: "First Played",
    },
    primaryStats: ["victories", "final_kills", "kills", "beds_destroyed"],
    computedStats: [
      {
        label: "K/D Ratio",
        compute: (d) => (d.deaths ? d.kills / d.deaths : null),
        format: "ratio",
      },
      {
        label: "Win Rate",
        compute: (d) => (d.played ? (d.victories / d.played) * 100 : null),
        format: "percent",
      },
      {
        label: "Finals / Game",
        compute: (d) => (d.played ? d.final_kills / d.played : null),
        format: "ratio",
      },
    ],
  },
  {
    id: "wars",
    name: "Treasure Wars",
    shortName: "WARS",
    icon: "⚔️",
    color: "#fbbf24",
    xpConstant: 150,
    statLabels: {
      xp: "Experience",
      played: "Games Played",
      victories: "Victories",
      final_kills: "Final Kills",
      kills: "Kills",
      deaths: "Deaths",
      treasure_destroyed: "Treasures Destroyed",
      first_played: "First Played",
    },
    primaryStats: ["victories", "final_kills", "kills", "treasure_destroyed"],
    computedStats: [
      {
        label: "K/D Ratio",
        compute: (d) => (d.deaths ? d.kills / d.deaths : null),
        format: "ratio",
      },
      {
        label: "Win Rate",
        compute: (d) => (d.played ? (d.victories / d.played) * 100 : null),
        format: "percent",
      },
    ],
  },
  {
    id: "sky",
    name: "SkyWars",
    shortName: "SKY",
    icon: "🏝️",
    color: "#38bdf8",
    xpConstant: 150,
    statLabels: {
      xp: "Experience",
      played: "Games Played",
      victories: "Victories",
      kills: "Kills",
      deaths: "Deaths",
      mystery_chests_destroyed: "Mystery Chests Opened",
      ores_mined: "Ores Mined",
      spells_used: "Spells Used",
      first_played: "First Played",
    },
    primaryStats: ["victories", "kills", "ores_mined", "mystery_chests_destroyed"],
    computedStats: [
      {
        label: "K/D Ratio",
        compute: (d) => (d.deaths ? d.kills / d.deaths : null),
        format: "ratio",
      },
      {
        label: "Win Rate",
        compute: (d) => (d.played ? (d.victories / d.played) * 100 : null),
        format: "percent",
      },
    ],
  },
  {
    id: "murder",
    name: "Murder Mystery",
    shortName: "MM",
    icon: "🔪",
    color: "#c084fc",
    xpConstant: 100,
    statLabels: {
      xp: "Experience",
      played: "Games Played",
      victories: "Victories",
      deaths: "Deaths",
      coins: "Coins Collected",
      murders: "Murders Committed",
      murderer_eliminations: "Murderers Eliminated",
      prestige: "Prestige",
      first_played: "First Played",
    },
    primaryStats: ["victories", "murders", "murderer_eliminations", "coins"],
    computedStats: [
      {
        label: "Win Rate",
        compute: (d) => (d.played ? (d.victories / d.played) * 100 : null),
        format: "percent",
      },
      {
        label: "Murders / Game",
        compute: (d) => (d.played ? d.murders / d.played : null),
        format: "ratio",
      },
    ],
  },
  {
    id: "dr",
    name: "Deathrun",
    shortName: "DR",
    icon: "💀",
    color: "#fb923c",
    xpConstant: 200,
    statLabels: {
      xp: "Experience",
      played: "Games Played",
      victories: "Victories",
      deaths: "Deaths",
      checkpoints: "Checkpoints Reached",
      activated: "Traps Activated",
      kills: "Kills",
      first_played: "First Played",
    },
    primaryStats: ["victories", "kills", "checkpoints", "activated"],
    computedStats: [
      {
        label: "Win Rate",
        compute: (d) => (d.played ? (d.victories / d.played) * 100 : null),
        format: "percent",
      },
      {
        label: "Checkpoints / Game",
        compute: (d) => (d.played ? d.checkpoints / d.played : null),
        format: "ratio",
      },
    ],
  },
  {
    id: "hide",
    name: "Hide & Seek",
    shortName: "HIDE",
    icon: "👁️",
    color: "#4ade80",
    xpConstant: 100,
    statLabels: {
      xp: "Experience",
      played: "Games Played",
      victories: "Victories",
      deaths: "Deaths",
      hider_kills: "Hider Kills",
      seeker_kills: "Seeker Kills",
      first_played: "First Played",
    },
    primaryStats: ["victories", "hider_kills", "seeker_kills", "deaths"],
    computedStats: [
      {
        label: "Win Rate",
        compute: (d) => (d.played ? (d.victories / d.played) * 100 : null),
        format: "percent",
      },
    ],
  },
  {
    id: "sg",
    name: "Survival Games",
    shortName: "SG",
    icon: "🏹",
    color: "#a3e635",
    xpConstant: 150,
    statLabels: {
      xp: "Experience",
      played: "Games Played",
      victories: "Victories",
      kills: "Kills",
      deaths: "Deaths",
      crates: "Crates Opened",
      deathmatches: "Deathmatches",
      cows: "Cows Found",
      teleporters_used: "Teleporters Used",
      launchpads_used: "Launchpads Used",
      flares_used: "Flares Used",
      first_played: "First Played",
    },
    primaryStats: ["victories", "kills", "crates", "deathmatches"],
    computedStats: [
      {
        label: "K/D Ratio",
        compute: (d) => (d.deaths ? d.kills / d.deaths : null),
        format: "ratio",
      },
      {
        label: "Win Rate",
        compute: (d) => (d.played ? (d.victories / d.played) * 100 : null),
        format: "percent",
      },
    ],
  },
  {
    id: "ctf",
    name: "Capture the Flag",
    shortName: "CTF",
    icon: "🚩",
    color: "#f472b6",
    xpConstant: 150,
    statLabels: {
      xp: "Experience",
      played: "Games Played",
      victories: "Victories",
      kills: "Kills",
      deaths: "Deaths",
      assists: "Assists",
      flags_captured: "Flags Captured",
      flags_returned: "Flags Returned",
      first_played: "First Played",
    },
    primaryStats: ["victories", "flags_captured", "kills", "flags_returned"],
    computedStats: [
      {
        label: "K/D Ratio",
        compute: (d) => (d.deaths ? d.kills / d.deaths : null),
        format: "ratio",
      },
      {
        label: "Win Rate",
        compute: (d) => (d.played ? (d.victories / d.played) * 100 : null),
        format: "percent",
      },
    ],
  },
  {
    id: "drop",
    name: "Block Drop",
    shortName: "DROP",
    icon: "🧊",
    color: "#22d3ee",
    xpConstant: 140,
    statLabels: {
      xp: "Experience",
      played: "Games Played",
      victories: "Victories",
      deaths: "Deaths",
      blocks_destroyed: "Blocks Destroyed",
      powerups_collected: "Powerups Collected",
      vaults_used: "Vaults Used",
      first_played: "First Played",
    },
    primaryStats: ["victories", "blocks_destroyed", "powerups_collected", "vaults_used"],
    computedStats: [
      {
        label: "Win Rate",
        compute: (d) => (d.played ? (d.victories / d.played) * 100 : null),
        format: "percent",
      },
    ],
  },
  {
    id: "ground",
    name: "Ground Wars",
    shortName: "GW",
    icon: "🧱",
    color: "#e879f9",
    xpConstant: 150,
    statLabels: {
      xp: "Experience",
      played: "Games Played",
      victories: "Victories",
      kills: "Kills",
      deaths: "Deaths",
      blocks_destroyed: "Blocks Destroyed",
      blocks_placed: "Blocks Placed",
      projectiles_fired: "Projectiles Fired",
      first_played: "First Played",
    },
    primaryStats: ["victories", "kills", "blocks_placed", "blocks_destroyed"],
    computedStats: [
      {
        label: "K/D Ratio",
        compute: (d) => (d.deaths ? d.kills / d.deaths : null),
        format: "ratio",
      },
      {
        label: "Win Rate",
        compute: (d) => (d.played ? (d.victories / d.played) * 100 : null),
        format: "percent",
      },
    ],
  },
  {
    id: "build",
    name: "Just Build",
    shortName: "BUILD",
    icon: "🏗️",
    color: "#facc15",
    xpConstant: 75,
    statLabels: {
      xp: "Experience",
      played: "Games Played",
      victories: "Victories",
      rating_love_received: "Ratings: Love",
      rating_great_received: "Ratings: Great",
      rating_good_received: "Ratings: Good",
      rating_okay_received: "Ratings: Okay",
      rating_meh_received: "Ratings: Meh",
      first_played: "First Played",
    },
    primaryStats: ["victories", "rating_love_received", "rating_great_received", "rating_good_received"],
    computedStats: [
      {
        label: "Win Rate",
        compute: (d) => (d.played ? (d.victories / d.played) * 100 : null),
        format: "percent",
      },
      {
        label: "Avg Rating Score",
        compute: (d) => {
          const total =
            (d.rating_love_received || 0) +
            (d.rating_great_received || 0) +
            (d.rating_good_received || 0) +
            (d.rating_okay_received || 0) +
            (d.rating_meh_received || 0);
          if (!total) return null;
          const score =
            ((d.rating_love_received || 0) * 5 +
              (d.rating_great_received || 0) * 4 +
              (d.rating_good_received || 0) * 3 +
              (d.rating_okay_received || 0) * 2 +
              (d.rating_meh_received || 0) * 1) /
            total;
          return score;
        },
        format: "ratio",
      },
    ],
  },
  {
    id: "party",
    name: "Block Party",
    shortName: "PARTY",
    icon: "🎉",
    color: "#f97316",
    xpConstant: 150,
    statLabels: {
      xp: "Experience",
      played: "Games Played",
      victories: "Victories",
      powerups_collected: "Powerups Collected",
      rounds_survived: "Rounds Survived",
      first_played: "First Played",
    },
    primaryStats: ["victories", "rounds_survived", "powerups_collected"],
    computedStats: [
      {
        label: "Win Rate",
        compute: (d) => (d.played ? (d.victories / d.played) * 100 : null),
        format: "percent",
      },
      {
        label: "Rounds / Game",
        compute: (d) => (d.played ? d.rounds_survived / d.played : null),
        format: "ratio",
      },
    ],
  },
  {
    id: "bridge",
    name: "The Bridge",
    shortName: "BRIDGE",
    icon: "🌉",
    color: "#818cf8",
    xpConstant: 420,
    statLabels: {
      xp: "Experience",
      played: "Games Played",
      victories: "Victories",
      kills: "Kills",
      deaths: "Deaths",
      goals: "Goals Scored",
      first_played: "First Played",
    },
    primaryStats: ["victories", "goals", "kills", "deaths"],
    computedStats: [
      {
        label: "K/D Ratio",
        compute: (d) => (d.deaths ? d.kills / d.deaths : null),
        format: "ratio",
      },
      {
        label: "Win Rate",
        compute: (d) => (d.played ? (d.victories / d.played) * 100 : null),
        format: "percent",
      },
      {
        label: "Goals / Game",
        compute: (d) => (d.played ? d.goals / d.played : null),
        format: "ratio",
      },
    ],
  },
  {
    id: "grav",
    name: "Gravity",
    shortName: "GRAV",
    icon: "🪂",
    color: "#2dd4bf",
    xpConstant: 150,
    statLabels: {
      xp: "Experience",
      played: "Games Played",
      victories: "Victories",
      deaths: "Deaths",
      maps_completed: "Maps Completed",
      maps_completed_without_dying: "Flawless Maps",
      first_played: "First Played",
    },
    primaryStats: ["victories", "maps_completed", "maps_completed_without_dying"],
    computedStats: [
      {
        label: "Win Rate",
        compute: (d) => (d.played ? (d.victories / d.played) * 100 : null),
        format: "percent",
      },
      {
        label: "Flawless Rate",
        compute: (d) =>
          d.maps_completed
            ? (d.maps_completed_without_dying / d.maps_completed) * 100
            : null,
        format: "percent",
      },
    ],
  },
];

export function getGameConfig(gameId: string): GameConfig | undefined {
  return GAME_CONFIGS.find((g) => g.id === gameId);
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatStatValue(
  key: string,
  value: number | string | undefined
): string {
  if (value === undefined || value === null) return "—";
  if (key === "first_played" && typeof value === "number") return formatDate(value);
  if (typeof value === "number") return formatNumber(value);
  return String(value);
}

export function rankColor(rank: string): string {
  switch (rank?.toUpperCase()) {
    case "ULTIMATE":
      return "#FFB800";
    case "PLUS":
      return "#55FF55";
    case "VIP":
      return "#a78bfa";
    default:
      return "#9ca3af";
  }
}

export function rankDisplayName(rank: string): string {
  switch (rank?.toUpperCase()) {
    case "ULTIMATE":
      return "Ultimate";
    case "PLUS":
      return "Hive+";
    case "VIP":
      return "VIP";
    default:
      return "Regular";
  }
}
