"use client";

import { useState, useEffect } from "react";
import { type GameConfig, formatNumber } from "@/lib/game-config";
import {
  getAllTimeLeaderboard,
  getMonthlyLeaderboard,
  getAvailableMonths,
  type LeaderboardEntry,
  type AvailableMonth,
} from "@/lib/hive-api";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardPanelProps {
  config: GameConfig;
  onSelectPlayer: (username: string) => void;
}

function MedalOrRank({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-base">🥇</span>;
  if (rank === 2) return <span className="text-base">🥈</span>;
  if (rank === 3) return <span className="text-base">🥉</span>;
  return (
    <span className="font-mono text-xs text-[#7a756b] w-6 text-right shrink-0">
      {rank}
    </span>
  );
}

export function LeaderboardPanel({ config, onSelectPlayer }: LeaderboardPanelProps) {
  const [mode, setMode] = useState<"alltime" | "monthly">("monthly");
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[] | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<AvailableMonth | null>(null);
  const [loading, setLoading] = useState(false);

  // Load available months once
  useEffect(() => {
    getAvailableMonths(config.id).then((months) => {
      if (months) {
        setAvailableMonths(months);
        setSelectedMonth(months[months.length - 1]);
      }
    });
  }, [config.id]);

  // Load leaderboard when mode/month/game changes
  useEffect(() => {
    setEntries(null);
    setLoading(true);
    const fetch =
      mode === "alltime"
        ? getAllTimeLeaderboard(config.id)
        : selectedMonth
        ? getMonthlyLeaderboard(config.id, selectedMonth.year, selectedMonth.month_number)
        : getMonthlyLeaderboard(config.id);
    fetch.then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [config.id, mode, selectedMonth]);

  const winRate = (e: LeaderboardEntry) =>
    e.played ? ((e.victories / e.played) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-[rgba(255,184,0,0.08)] overflow-hidden">
          {(["monthly", "alltime"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === m
                  ? "bg-[rgba(255,184,0,0.1)] text-[#FFB800]"
                  : "text-[#7a756b] hover:text-[#f0ece4]/70"
              }`}
            >
              {m === "monthly" ? "Monthly" : "All-Time"}
            </button>
          ))}
        </div>

        {mode === "monthly" && availableMonths && (
          <select
            value={selectedMonth ? `${selectedMonth.year}-${selectedMonth.month_number}` : ""}
            onChange={(e) => {
              const found = availableMonths.find(
                (m) => `${m.year}-${m.month_number}` === e.target.value
              );
              if (found) setSelectedMonth(found);
            }}
            className="rounded-lg border border-[rgba(255,184,0,0.08)] bg-[#111114] px-3 py-1.5 text-xs text-[#f0ece4]/70 focus:outline-none"
          >
            {[...availableMonths].reverse().map((m) => (
              <option key={`${m.year}-${m.month_number}`} value={`${m.year}-${m.month_number}`}>
                {m.month} {m.year}
              </option>
            ))}
          </select>
        )}

        <span className="ml-auto text-[10px] uppercase tracking-widest text-[#7a756b]">
          {config.icon} {config.name}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[rgba(255,184,0,0.06)] bg-[rgba(255,184,0,0.02)] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2rem_1fr_auto_auto_auto] gap-3 px-4 py-2 border-b border-[rgba(255,184,0,0.05)] text-[9px] uppercase tracking-widest text-[#7a756b]">
          <span>#</span>
          <span>Player</span>
          <span className="text-right">Wins</span>
          <span className="text-right">Games</span>
          <span className="text-right">Win Rate</span>
        </div>

        {/* Rows */}
        {loading && (
          <div className="divide-y divide-[rgba(255,184,0,0.03)]">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2rem_1fr_auto_auto_auto] gap-3 px-4 py-2.5 items-center">
                <Skeleton className="h-3 w-5 bg-[rgba(255,184,0,0.06)]" />
                <Skeleton className="h-3 w-28 bg-[rgba(255,184,0,0.06)]" />
                <Skeleton className="h-3 w-10 bg-[rgba(255,184,0,0.06)]" />
                <Skeleton className="h-3 w-10 bg-[rgba(255,184,0,0.06)]" />
                <Skeleton className="h-3 w-12 bg-[rgba(255,184,0,0.06)]" />
              </div>
            ))}
          </div>
        )}

        {!loading && !entries && (
          <p className="py-12 text-center text-xs text-[#7a756b]">No leaderboard data available.</p>
        )}

        {!loading && entries && (
          <div className="divide-y divide-[rgba(255,184,0,0.03)]">
            {entries.map((entry) => (
              <button
                key={entry.UUID}
                onClick={() => onSelectPlayer(entry.username)}
                className="w-full grid grid-cols-[2rem_1fr_auto_auto_auto] gap-3 px-4 py-2.5 items-center text-left hover:bg-[rgba(255,184,0,0.04)] transition-colors"
              >
                <div className="flex justify-center">
                  <MedalOrRank rank={entry.human_index} />
                </div>
                <span
                  className="font-medium text-sm truncate"
                  style={{ color: entry.human_index <= 3 ? config.color : undefined }}
                >
                  {entry.username}
                  {entry.prestige !== undefined && entry.prestige > 0 && (
                    <span className="ml-1.5 text-[9px] text-[#FFB800]/60">P{entry.prestige}</span>
                  )}
                </span>
                <span className="font-mono text-sm text-right" style={{ color: config.color }}>
                  {formatNumber(entry.victories)}
                </span>
                <span className="font-mono text-xs text-right text-[#f0ece4]/50">
                  {formatNumber(entry.played)}
                </span>
                <span className="font-mono text-xs text-right text-[#f0ece4]/40">
                  {winRate(entry)}%
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
