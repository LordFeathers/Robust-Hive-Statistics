"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LeaderboardPanel } from "@/components/leaderboard-panel";
import { GAME_CONFIGS, type GameConfig } from "@/lib/game-config";

export default function LeaderboardPage() {
  const router = useRouter();
  const [activeGame, setActiveGame] = useState("bed");

  const activeConfig = GAME_CONFIGS.find((g) => g.id === activeGame) as GameConfig;

  return (
    <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-10 text-center">
        <Link href="/" className="inline-flex items-center gap-3 mb-4">
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
        </Link>
        <p className="text-lg font-semibold text-[#f0ece4]/80 tracking-wide mt-1">Leaderboards</p>
        <div className="mt-3">
          <Link
            href="/"
            className="text-xs text-[#7a756b] hover:text-[#FFB800] transition-colors"
          >
            ← Player Stats
          </Link>
        </div>
      </header>

      {/* Game tabs */}
      <div className="animate-fade-in-up mb-6">
        <div className="flex flex-wrap items-center gap-1">
          {GAME_CONFIGS.map((game) => {
            const isActive = activeGame === game.id;
            return (
              <button
                key={game.id}
                onClick={() => setActiveGame(game.id)}
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

      {/* Leaderboard panel */}
      <div key={activeGame} className="animate-fade-in-up">
        <LeaderboardPanel
          config={activeConfig}
          onSelectPlayer={(username) => router.push(`/?player=${username}`)}
        />
      </div>

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
