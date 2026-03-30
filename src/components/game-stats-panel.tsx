"use client";

import {
  type GameConfig,
  formatStatValue,
  formatNumber,
} from "@/lib/game-config";
import type { GameStats, MonthlyStats } from "@/lib/hive-api";
import { Skeleton } from "@/components/ui/skeleton";

interface GameStatsPanelProps {
  config: GameConfig;
  stats: GameStats | null;
  loading: boolean;
  uniquePlayers?: number | null;
  monthlyStats?: MonthlyStats | null;
}

export function GameStatsPanel({
  config,
  stats,
  loading,
  uniquePlayers,
  monthlyStats,
}: GameStatsPanelProps) {

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
    ? Math.floor((-1 + Math.sqrt(1 + (8 * stats.xp) / config.xpConstant)) / 2) + 1
    : 1;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* XP / Games / Wins bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[rgba(255,184,0,0.06)] bg-[rgba(255,184,0,0.02)] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-[#7a756b]">Level</span>
          <span className="font-mono text-lg font-bold" style={{ color: config.color }}>
            {xpLevel}
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
        {stats.prestige !== undefined && stats.prestige > 0 && (
          <>
            <div className="h-4 w-px bg-[rgba(255,184,0,0.1)]" />
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-[#7a756b]">Prestige</span>
              <span className="font-mono text-sm font-bold text-[#FFB800]">{stats.prestige}</span>
            </div>
          </>
        )}
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
    </div>
  );
}
