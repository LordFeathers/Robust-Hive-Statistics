"use client";

import { useState } from "react";
import {
  type GameConfig,
  formatStatValue,
  formatNumber,
} from "@/lib/game-config";
import type { GameStats, GameMeta, MonthlyStats, LevelReward } from "@/lib/hive-api";
import { MinecraftText, stripMinecraftColors, firstMCColor } from "@/lib/minecraft-text";
import { Skeleton } from "@/components/ui/skeleton";

interface GameStatsPanelProps {
  config: GameConfig;
  stats: GameStats | null;
  loading: boolean;
  uniquePlayers?: number | null;
  monthlyStats?: MonthlyStats | null;
  gameMeta?: GameMeta | null;
}

function HubTitleIcon({ name }: { name: string }) {
  const color = firstMCColor(name) ?? "#FFB800";
  const plain = stripMinecraftColors(name);
  return (
    <div className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "22", border: `1px solid ${color}44` }}>
      <span className="text-[8px] font-bold leading-none text-center px-0.5" style={{ color }}>{plain.slice(0, 4).toUpperCase()}</span>
    </div>
  );
}

const REWARD_TYPE_EMOJI: Record<string, string> = {
  "Hub Title":       "🏷️",
  "Costume":         "👘",
  "Avatar":          "🖼️",
  "Kill Phrase":     "💬",
  "Death Crate":     "📦",
  "Projectile Trail":"✨",
  "Player Flag":     "🚩",
  "Spawn Vehicle":   "🚗",
  "Kill Effects":    "⚡",
  "Kill Effect":     "⚡",
  "Arrow Trail":     "🏹",
  "Gravestone":      "🪦",
  "Murder Weapon":   "🔪",
  "Ghost Color":     "👻",
  "Death Sound":     "🔊",
  "Zapper Trail":    "⚡",
  "Throwable":       "🎯",
  "Bed Frame":       "🛏️",
  "Bed Sheet":       "🛏️",
  "Bed Pillow":      "🛏️",
  "Bed Topper":      "🛏️",
  "Island Banner":   "🏳️",
  "Merchant Skin":   "🧑‍💼",
  "Armor Skin":      "🛡️",
};

function RewardIcon({ reward }: { reward: LevelReward }) {
  const [failed, setFailed] = useState(false);
  if (reward.type === "Hub Title") return <HubTitleIcon name={reward.name} />;
  if (!reward.icon || failed) {
    const emoji = REWARD_TYPE_EMOJI[reward.type];
    return (
      <div className="h-10 w-10 shrink-0 rounded-lg bg-[rgba(255,184,0,0.06)] flex items-center justify-center">
        {emoji
          ? <span className="text-xl leading-none">{emoji}</span>
          : <span className="text-[10px] font-semibold text-[#FFB800]/60 leading-none">{reward.type.slice(0, 2).toUpperCase()}</span>
        }
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={reward.icon} alt={reward.name} className="h-10 w-10 shrink-0 rounded-lg object-contain" onError={() => setFailed(true)} />
  );
}

function levelFromMeta(xp: number, meta: GameMeta): number {
  const entries = Object.entries(meta.experienceToLevel)
    .map(([k, v]) => ({ xpThreshold: Number(k), level: v }))
    .sort((a, b) => b.xpThreshold - a.xpThreshold);
  const match = entries.find((e) => xp >= e.xpThreshold);
  return match ? match.level + 1 : 1;
}

export function GameStatsPanel({
  config,
  stats,
  loading,
  uniquePlayers,
  monthlyStats,
  gameMeta,
}: GameStatsPanelProps) {
  const [rewardsOpen, setRewardsOpen] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-[rgba(255,184,0,0.04)]" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl bg-[rgba(255,184,0,0.04)]" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats || !stats.played) {
    return (
      <div className="animate-fade-in-up flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3 opacity-30">{config.icon}</div>
        <p className="text-[#7a756b] text-sm">
          No {config.name} data available for this player.
        </p>
      </div>
    );
  }

  const primaryStatData = config.primaryStats
    .map((key) => ({ key, label: config.statLabels[key] || key, value: stats[key] as number | undefined }))
    .filter((s) => s.value !== undefined);

  const computedData =
    config.computedStats
      ?.map((cs) => {
        const val = cs.compute(stats as unknown as Record<string, number>);
        return { label: cs.label, value: val, format: cs.format };
      })
      .filter((s) => s.value !== null) || [];

  const primaryKeys = new Set([
    ...config.primaryStats,
    "UUID", "first_played", "xp", "played", "victories", "prestige",
  ]);
  const secondaryStats = Object.entries(config.statLabels)
    .filter(([key]) => !primaryKeys.has(key))
    .map(([key, label]) => ({ key, label, value: stats[key] as number | undefined }))
    .filter((s) => s.value !== undefined && s.value !== 0);

  const xpLevel = stats.xp
    ? gameMeta
      ? levelFromMeta(stats.xp, gameMeta)
      : Math.floor((-1 + Math.sqrt(1 + (8 * stats.xp) / config.xpConstant)) / 2) + 1
    : 1;

  // XP progress to next level
  const xpProgress = (() => {
    if (!gameMeta || !stats.xp) return null;
    const entries = Object.entries(gameMeta.experienceToLevel)
      .map(([k, v]) => ({ xpThreshold: Number(k), level: v }))
      .sort((a, b) => a.xpThreshold - b.xpThreshold);
    const currentEntry = [...entries].reverse().find((e) => stats.xp! >= e.xpThreshold);
    const nextEntry = entries.find((e) => e.xpThreshold > (stats.xp ?? 0));
    // Max level — show full bar
    if (currentEntry && !nextEntry) {
      return { xpIntoLevel: 1, xpNeeded: 1, percent: 100, maxLevel: true };
    }
    if (!currentEntry || !nextEntry) return null;
    const xpIntoLevel = stats.xp! - currentEntry.xpThreshold;
    const xpNeeded = nextEntry.xpThreshold - currentEntry.xpThreshold;
    return { xpIntoLevel, xpNeeded, percent: Math.min((xpIntoLevel / xpNeeded) * 100, 100), maxLevel: false };
  })();

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* XP / Games / Wins bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[rgba(255,184,0,0.06)] bg-[rgba(255,184,0,0.02)] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-[#7a756b]">
            {stats.prestige !== undefined && stats.prestige > 0 ? "Prestige" : "Level"}
          </span>
          <span className="font-mono text-lg font-bold" style={{ color: config.color }}>
            {stats.prestige !== undefined && stats.prestige > 0
              ? `${stats.prestige} · Lv ${xpLevel}`
              : xpLevel}
          </span>
        </div>
        <div className="h-4 w-px bg-[rgba(255,184,0,0.1)]" />
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-[#7a756b]">XP</span>
          <span className="font-mono text-sm text-[#f0ece4]/80">{formatNumber(stats.xp || 0)}</span>
        </div>
        <div className="h-4 w-px bg-[rgba(255,184,0,0.1)]" />
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-[#7a756b]">Games</span>
          <span className="font-mono text-sm text-[#f0ece4]/80">{formatNumber(stats.played || 0)}</span>
        </div>
        <div className="h-4 w-px bg-[rgba(255,184,0,0.1)]" />
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-[#7a756b]">Wins</span>
          <span className="font-mono text-sm text-[#f0ece4]/80">{formatNumber(stats.victories || 0)}</span>
        </div>
        {stats.first_played && (
          <>
            <div className="h-4 w-px bg-[rgba(255,184,0,0.1)]" />
            <span className="text-xs text-[#7a756b]">
              Since{" "}
              <span className="text-[#f0ece4]/50">
                {formatStatValue("first_played", stats.first_played)}
              </span>
            </span>
          </>
        )}
        {uniquePlayers && (
          <span className="ml-auto text-xs text-[#7a756b]">
            <span className="text-[#f0ece4]/40">{formatNumber(uniquePlayers)}</span> unique players
          </span>
        )}
      </div>

      {/* XP progress bar */}
      {xpProgress && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-[#7a756b]">
            <span>Level {xpLevel}</span>
            <span>
              {xpProgress.maxLevel
                ? <span style={{ color: config.color }}>Max Level</span>
                : <>{formatNumber(xpProgress.xpIntoLevel)} / {formatNumber(xpProgress.xpNeeded)} XP <span className="text-[#f0ece4]/30">({xpProgress.percent.toFixed(1)}%)</span></>
              }
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[rgba(255,184,0,0.08)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${xpProgress.percent}%`, backgroundColor: config.color }}
            />
          </div>
        </div>
      )}

      {/* Monthly stats */}
      {monthlyStats && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[rgba(255,184,0,0.06)] bg-[rgba(255,184,0,0.02)] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-[#7a756b]">Monthly Rank</span>
            <span className="font-mono text-sm font-bold" style={{ color: config.color }}>
              #{monthlyStats.human_index.toLocaleString()}
            </span>
          </div>
          {monthlyStats.played != null && monthlyStats.played > 0 && (
            <>
              <div className="h-4 w-px bg-[rgba(255,184,0,0.1)]" />
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-[#7a756b]">Games</span>
                <span className="font-mono text-sm text-[#f0ece4]/80">{monthlyStats.played}</span>
              </div>
            </>
          )}
          {monthlyStats.victories != null && monthlyStats.victories > 0 && (
            <>
              <div className="h-4 w-px bg-[rgba(255,184,0,0.1)]" />
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-[#7a756b]">Wins</span>
                <span className="font-mono text-sm text-[#f0ece4]/80">{monthlyStats.victories}</span>
              </div>
            </>
          )}
          {monthlyStats.xp != null && monthlyStats.xp > 0 && (
            <>
              <div className="h-4 w-px bg-[rgba(255,184,0,0.1)]" />
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-[#7a756b]">XP</span>
                <span className="font-mono text-sm text-[#f0ece4]/80">{formatNumber(monthlyStats.xp)}</span>
              </div>
            </>
          )}
          <div className="ml-auto" />
          <span className="text-xs text-[#7a756b]/50">This month</span>
        </div>
      )}

      {/* Primary hero stats */}
      <div className="stagger-children grid grid-cols-2 sm:grid-cols-4 gap-3">
        {primaryStatData.map((stat) => (
          <div
            key={stat.key}
            className="stat-card group relative overflow-hidden rounded-xl bg-[#111114] p-4"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: `radial-gradient(circle at 50% 100%, ${config.color}08, transparent 70%)` }}
            />
            <div className="relative">
              <div className="font-mono text-2xl font-bold text-[#f0ece4]">
                {formatNumber(stat.value || 0)}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-widest text-[#7a756b]">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Computed ratio stats */}
      {computedData.length > 0 && (
        <div className="stagger-children grid grid-cols-2 sm:grid-cols-3 gap-3">
          {computedData.map((cs) => (
            <div
              key={cs.label}
              className="stat-card flex items-center gap-3 rounded-xl bg-[#111114] px-4 py-3"
            >
              <div className="h-8 w-1 rounded-full" style={{ backgroundColor: config.color + "60" }} />
              <div>
                <div className="font-mono text-lg font-semibold text-[#f0ece4]">
                  {cs.format === "percent" ? `${cs.value!.toFixed(1)}%` : cs.value!.toFixed(2)}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-[#7a756b]">{cs.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Secondary stats */}
      {secondaryStats.length > 0 && (
        <div className="stagger-children grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {secondaryStats.map((stat) => (
            <div key={stat.key} className="stat-card rounded-xl bg-[#111114] px-4 py-3">
              <div className="font-mono text-base font-medium text-[#f0ece4]/90">
                {formatStatValue(stat.key, stat.value)}
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-widest text-[#7a756b]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Level rewards skeleton while meta loads */}
      {!gameMeta && (
        <div className="rounded-xl border border-[rgba(255,184,0,0.06)] bg-[rgba(255,184,0,0.02)] px-4 py-3 flex items-center justify-between">
          <Skeleton className="h-3 w-24 bg-[rgba(255,184,0,0.06)]" />
          <Skeleton className="h-3 w-32 bg-[rgba(255,184,0,0.06)]" />
        </div>
      )}

      {/* Level rewards */}
      {gameMeta?.levelUnlocks && (() => {
        const currentLevel = xpLevel;
        const allLevels = Object.entries(gameMeta.levelUnlocks)
          .map(([lvl, rewards]) => ({ level: Number(lvl), rewards }))
          .sort((a, b) => a.level - b.level);

        const nextUnlock = allLevels.find((e) => e.level > currentLevel);
        const pastUnlocks = allLevels.filter((e) => e.level <= currentLevel).reverse();

        if (!nextUnlock && pastUnlocks.length === 0) return null;

        return (
          <div className="rounded-xl border border-[rgba(255,184,0,0.06)] bg-[rgba(255,184,0,0.02)] overflow-hidden">
            {/* Header / toggle */}
            <button
              onClick={() => setRewardsOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[rgba(255,184,0,0.04)] transition-colors"
            >
              <span className="text-[10px] uppercase tracking-widest text-[#7a756b]">Level Rewards</span>
              <div className="flex items-center gap-3">
                {nextUnlock && (
                  <span className="text-xs text-[#f0ece4]/40">
                    Next at level <span className="text-[#FFB800]">{nextUnlock.level}</span>
                  </span>
                )}
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`text-[#7a756b] transition-transform duration-200 ${rewardsOpen ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </button>

            {rewardsOpen && (
              <div className="px-4 pb-4 space-y-4">
                {/* Next unlock */}
                {nextUnlock && (
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-[#FFB800]/60 mb-2">Next — Level {nextUnlock.level}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {nextUnlock.rewards.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg bg-[rgba(255,184,0,0.05)] border border-[rgba(255,184,0,0.08)] px-3 py-2">
                          <RewardIcon reward={r} />
                          <div className="min-w-0">
                            <div className="text-xs truncate">{r.type === "Hub Title" ? <MinecraftText text={r.name} /> : <span className="text-[#f0ece4]/80">{stripMinecraftColors(r.name) || r.name}</span>}</div>
                            <div className="text-[9px] text-[#7a756b]">{r.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past unlocks */}
                {pastUnlocks.length > 0 && (
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-[#7a756b]/60 mb-2">Unlocked</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {pastUnlocks.map((entry) =>
                        entry.rewards.map((r, i) => (
                          <div key={`${entry.level}-${i}`} className="flex items-center gap-2 rounded-lg bg-[rgba(255,184,0,0.02)] border border-[rgba(255,184,0,0.05)] px-3 py-2">
                            <RewardIcon reward={r} />
                            <div className="min-w-0">
                              <div className="text-xs truncate opacity-60">{r.type === "Hub Title" ? <MinecraftText text={r.name} /> : <span className="text-[#f0ece4]">{stripMinecraftColors(r.name) || r.name}</span>}</div>
                              <div className="text-[9px] text-[#7a756b]/60">{r.type} · Lv {entry.level}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
