"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { PlayerSearch } from "@/components/player-search";
import { PlayerProfileCard } from "@/components/player-profile";
import { GameStatsPanel } from "@/components/game-stats-panel";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  getPlayerProfile,
  getGameStats,
  getGameMeta,
  getMonthlyStats,
  getGlobalStats,
  getAllGameStats,
  RateLimitError,
  type PlayerProfile,
  type GameStats,
  type GameMeta,
  type MonthlyStats,
  type GlobalStats,
} from "@/lib/hive-api";
import { GAME_CONFIGS, type GameConfig, formatNumber } from "@/lib/game-config";

export function HiveDashboard() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [gameStats, setGameStats] = useState<Record<string, GameStats | null>>({});
  const [monthlyStats, setMonthlyStats] = useState<Record<string, MonthlyStats | null>>({});
  const [activeGame, setActiveGame] = useState<string>("bed");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingGame, setLoadingGame] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [allGamesSummary, setAllGamesSummary] = useState<Record<string, GameStats | null> | null>(null);
  const [gameMeta, setGameMeta] = useState<Record<string, GameMeta | null>>({});
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    getGlobalStats().then(setGlobalStats);
  }, []);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    setIsOffline(!navigator.onLine);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Load player from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const player = params.get("player");
    const game = params.get("game");
    const initialGame = (game && GAME_CONFIGS.some((g) => g.id === game)) ? game : "bed";
    if (player) handleSelectPlayer(player, initialGame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGameStats = useCallback(
    async (gameId: string, username: string) => {
      const statsAlreadyLoaded = gameStats[gameId] !== undefined;
      const metaAlreadyLoaded = gameMeta[gameId] !== undefined;
      if (statsAlreadyLoaded && metaAlreadyLoaded) return;

      if (!statsAlreadyLoaded) setLoadingGame(gameId);
      try {
        const [stats, monthly, meta] = await Promise.all([
          statsAlreadyLoaded ? Promise.resolve(gameStats[gameId]) : getGameStats(gameId, username),
          statsAlreadyLoaded ? Promise.resolve(null) : getMonthlyStats(gameId, username),
          metaAlreadyLoaded ? Promise.resolve(gameMeta[gameId]) : getGameMeta(gameId).catch(() => null),
        ]);
        if (!statsAlreadyLoaded) {
          setGameStats((prev) => ({ ...prev, [gameId]: stats }));
          setMonthlyStats((prev) => ({ ...prev, [gameId]: monthly }));
        }
        if (!metaAlreadyLoaded) setGameMeta((prev) => ({ ...prev, [gameId]: meta }));
      } catch (err) {
        if (err instanceof RateLimitError) setError("You're being rate limited by the Hive API. Please wait a moment and try again.");
        if (!statsAlreadyLoaded) {
          setGameStats((prev) => ({ ...prev, [gameId]: null }));
          setMonthlyStats((prev) => ({ ...prev, [gameId]: null }));
        }
      } finally {
        setLoadingGame(null);
      }
    },
    [gameStats, gameMeta]
  );

  const handleSelectPlayer = useCallback(
    async (username: string, initialGame = "bed") => {
      setLoadingProfile(true);
      setError(null);
      setSearched(true);
      setProfile(null);
      setGameStats({});
      setMonthlyStats({});
      setGameMeta({});
      setAllGamesSummary(null);
      setActiveGame(initialGame);

      try {
        const data = await getPlayerProfile(username);
        if (!data || !data.main) {
          setError("Player not found. Check the username and try again.");
          setLoadingProfile(false);
          return;
        }
        setProfile(data.main);
        setLoadingProfile(false);

        // Update URL
        const url = new URL(window.location.href);
        url.searchParams.set("player", data.main.username_cc);
        url.searchParams.set("game", initialGame);
        window.history.replaceState({}, "", url.toString());

        // Pre-load initial game stats
        setLoadingGame(initialGame);
        const [initialStats, initialMonthly, initialMeta] = await Promise.all([
          getGameStats(initialGame, username),
          getMonthlyStats(initialGame, username),
          getGameMeta(initialGame),
        ]);
        setGameStats({ [initialGame]: initialStats });
        setMonthlyStats({ [initialGame]: initialMonthly });
        setGameMeta({ [initialGame]: initialMeta });
        setLoadingGame(null);

        // Load all games in background for summary
        const gameIds = GAME_CONFIGS.map((g) => g.id);
        getAllGameStats(username, gameIds).then((all) => {
          setAllGamesSummary(all);
          setGameStats((prev) => ({ ...all, ...prev }));
        });
      } catch (err) {
        if (err instanceof RateLimitError) {
          setError("You're being rate limited by the Hive API. Please wait a moment and try again.");
        } else {
          setError("Something went wrong. Please try again.");
        }
        setLoadingProfile(false);
      }
    },
    []
  );

  const handleGameChange = useCallback(
    (gameId: string) => {
      setActiveGame(gameId);
      const url = new URL(window.location.href);
      url.searchParams.set("game", gameId);
      window.history.replaceState({}, "", url.toString());
      if (profile && (gameStats[gameId] === undefined || gameMeta[gameId] === undefined)) {
        loadGameStats(gameId, profile.username_cc);
      }
    },
    [profile, gameStats, gameMeta, loadGameStats]
  );

  const activeConfig = GAME_CONFIGS.find((g) => g.id === activeGame) as GameConfig;

  // Compute all-games summary stats
  const summaryStats = allGamesSummary
    ? (() => {
        const games = GAME_CONFIGS.map((g) => {
          const s = allGamesSummary[g.id];
          return { config: g, stats: s };
        }).filter((g) => g.stats?.played);

        const totalWins = games.reduce((acc, g) => acc + (g.stats?.victories || 0), 0);
        const totalGames = games.reduce((acc, g) => acc + (g.stats?.played || 0), 0);
        const bestGame = games.reduce<{ config: GameConfig; wr: number } | null>((best, g) => {
          if (!g.stats?.played || !g.stats?.victories) return best;
          const wr = (g.stats.victories / g.stats.played) * 100;
          if (!isFinite(wr)) return best;
          return !best || wr > best.wr ? { config: g.config, wr } : best;
        }, null);

        let totalKills = 0;
        let totalDeaths = 0;
        for (const { stats } of games) {
          if (!stats) continue;
          totalKills += (stats.kills as number) || 0;
          totalDeaths += (stats.deaths as number) || 0;
        }
        const kdRatio = totalDeaths > 0 ? totalKills / totalDeaths : null;

        const mostPlayed = games.reduce<{ config: GameConfig; played: number } | null>((best, g) => {
          const played = g.stats?.played || 0;
          return !best || played > best.played ? { config: g.config, played } : best;
        }, null);

        return { totalWins, totalGames, bestGame, mostPlayed, gamesPlayed: games.length, kdRatio };
      })()
    : null;

  return (
    <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-10 text-center">
        <button
          className="inline-flex items-center gap-3 mb-4 cursor-pointer"
          onClick={() => {
            setProfile(null);
            setGameStats({});
            setMonthlyStats({});
            setError(null);
            setSearched(false);
            setAllGamesSummary(null);
          }}
        >
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#FFB800] to-[#FF8C00] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-black">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="absolute -inset-1 rounded-xl bg-[#FFB800]/20 blur-md -z-10" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-wide text-[#f0ece4]">
            HIVE<span className="text-[#FFB800]"> STATS</span>
          </h1>
        </button>
        <p className="text-sm text-[#7a756b] max-w-md mx-auto">
          Look up player statistics for The Hive Minecraft Bedrock server
        </p>
        {globalStats && (
          <p className="mt-2 text-xs text-[#7a756b]/50">
            <span className="text-[#FFB800]/60">{formatNumber(globalStats.unique_players.global)}</span> unique players tracked
          </p>
        )}
        <div className="mt-4">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(255,184,0,0.2)] bg-[rgba(255,184,0,0.06)] px-4 py-1.5 text-sm font-medium text-[#FFB800]/80 hover:text-[#FFB800] hover:bg-[rgba(255,184,0,0.1)] hover:border-[rgba(255,184,0,0.35)] transition-all"
          >
            🏆 View Leaderboards
          </Link>
        </div>
      </header>

      {/* Offline banner */}
      {isOffline && (
        <div className="mx-auto max-w-xl mb-6 animate-fade-in-up">
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-5 py-3 text-center text-sm text-yellow-400">
            You appear to be offline. Stats may not load until you reconnect.
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex justify-center mb-8">
        <PlayerSearch onSelect={handleSelectPlayer} isLoading={loadingProfile} value={profile?.username_cc ?? ""} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-auto max-w-xl mb-8 animate-fade-in-up">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-center text-sm text-red-400">
            {error}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loadingProfile && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="h-40 rounded-2xl bg-[rgba(255,184,0,0.03)] shimmer" />
          <div className="h-12 rounded-xl bg-[rgba(255,184,0,0.03)] shimmer" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-[rgba(255,184,0,0.03)] shimmer" />
            ))}
          </div>
        </div>
      )}

      {/* Profile + Game Stats */}
      {profile && !loadingProfile && (
        <div className="space-y-6">
          <ErrorBoundary>
            <PlayerProfileCard profile={profile} kdRatio={summaryStats?.kdRatio ?? null} totalWins={summaryStats?.totalWins ?? null} />
          </ErrorBoundary>

          {/* All-games summary */}
          {summaryStats && (
            <div className="animate-fade-in-up grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-xl border border-[rgba(255,184,0,0.06)] bg-[rgba(255,184,0,0.02)] px-4 py-3 text-center">
                <div className="font-mono text-xl font-bold text-[#f0ece4]">🏆 {formatNumber(summaryStats.totalWins)}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-widest text-[#7a756b]">Total Wins</div>
              </div>
              <div className="rounded-xl border border-[rgba(255,184,0,0.06)] bg-[rgba(255,184,0,0.02)] px-4 py-3 text-center">
                <div className="font-mono text-xl font-bold text-[#f0ece4]">🎮 {formatNumber(summaryStats.totalGames)}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-widest text-[#7a756b]">Total Games</div>
              </div>
              <div className="rounded-xl border border-[rgba(255,184,0,0.06)] bg-[rgba(255,184,0,0.02)] px-4 py-3 text-center">
                <div className="font-mono text-xl font-bold text-[#f0ece4]">
                  📊 {summaryStats.totalGames ? ((summaryStats.totalWins / summaryStats.totalGames) * 100).toFixed(1) : "0"}%
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-widest text-[#7a756b]">Overall Win Rate</div>
              </div>
              <div className="rounded-xl border border-[rgba(255,184,0,0.06)] bg-[rgba(255,184,0,0.02)] px-4 py-3 text-center">
                {summaryStats.bestGame ? (
                  <>
                    <div className="font-mono text-xl font-bold" style={{ color: summaryStats.bestGame.config.color }}>
                      {summaryStats.bestGame.config.icon} {summaryStats.bestGame.wr.toFixed(1)}%
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-widest text-[#7a756b]">Best Win Rate · <span className="normal-case">{summaryStats.bestGame.config.name}</span></div>
                  </>
                ) : (
                  <div className="text-[#7a756b] text-xs">—</div>
                )}
              </div>
              <div className="rounded-xl border border-[rgba(255,184,0,0.06)] bg-[rgba(255,184,0,0.02)] px-4 py-3 text-center">
                {summaryStats.mostPlayed ? (
                  <>
                    <div className="font-mono text-xl font-bold" style={{ color: summaryStats.mostPlayed.config.color }}>
                      {summaryStats.mostPlayed.config.icon} {formatNumber(summaryStats.mostPlayed.played)}
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-widest text-[#7a756b]">Most Played · <span className="normal-case">{summaryStats.mostPlayed.config.name}</span></div>
                  </>
                ) : (
                  <div className="text-[#7a756b] text-xs">—</div>
                )}
              </div>
            </div>
          )}

          {/* Game selector tabs */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex flex-wrap items-center gap-1">
              {GAME_CONFIGS.map((game) => {
                const isActive = activeGame === game.id;
                return (
                  <button
                    key={game.id}
                    onClick={() => handleGameChange(game.id)}
                    onMouseEnter={() => {
                      if (profile && gameStats[game.id] === undefined) {
                        loadGameStats(game.id, profile.username_cc);
                      }
                    }}
                    className={`game-tab flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[rgba(255,184,0,0.1)] text-[#FFB800]"
                        : "text-[#7a756b] hover:text-[#f0ece4]/80 hover:bg-[rgba(255,184,0,0.03)]"
                    }`}
                  >
                    <span className="text-base">{game.icon}</span>
                    <span className="hidden sm:inline">{game.name}</span>
                    <span className="sm:hidden">{game.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active game stats / leaderboard */}
          <div key={activeGame} className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            <ErrorBoundary>
              <GameStatsPanel
                config={activeConfig}
                stats={gameStats[activeGame] ?? null}
                loading={loadingGame === activeGame}
                uniquePlayers={globalStats?.unique_players[activeGame] ?? null}
                monthlyStats={monthlyStats[activeGame] ?? null}
                gameMeta={gameMeta[activeGame] ?? null}
              />
            </ErrorBoundary>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!searched && !loadingProfile && (
        <div className="mt-16 text-center animate-fade-in-up">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[rgba(255,184,0,0.08)] to-[rgba(255,140,0,0.04)]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-[#FFB800]/40">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[#7a756b] text-sm mb-2">
            Search for a Hive Bedrock player to view their stats
          </p>
          <p className="text-[#7a756b]/50 text-xs">
            Supports all 14 game modes including Bed Wars, Treasure Wars, SkyWars, and more
          </p>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-[#7a756b]/40">
        <p>
          Data from{" "}
          <span className="text-[#FFB800]/30">api.playhive.com</span>
          {" · "}Not affiliated with Hive Games
        </p>
        <p className="mt-1">Made by Yaakov Sassoon</p>
      </footer>
    </div>
  );
}
