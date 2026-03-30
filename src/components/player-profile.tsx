"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { PlayerProfile } from "@/lib/hive-api";
import { formatDate, rankColor, rankDisplayName } from "@/lib/game-config";

interface PlayerProfileCardProps {
  profile: PlayerProfile;
}

const MC_COLORS: Record<string, string> = {
  "0": "#000000", "1": "#0000AA", "2": "#00AA00", "3": "#00AAAA",
  "4": "#AA0000", "5": "#AA00AA", "6": "#FFAA00", "7": "#AAAAAA",
  "8": "#555555", "9": "#5555FF", "a": "#55FF55", "b": "#55FFFF",
  "c": "#FF5555", "d": "#FF55FF", "e": "#FFFF55", "f": "#FFFFFF",
};

function MinecraftText({ text }: { text: string }) {
  const segments: { text: string; color?: string }[] = [];
  const parts = text.split(/&([0-9a-zA-Z])/);
  let currentColor: string | undefined;

  if (parts[0]) segments.push({ text: parts[0], color: currentColor });

  for (let i = 1; i < parts.length; i += 2) {
    const code = parts[i].toLowerCase();
    const chunk = (parts[i + 1] || "").replace(/[\ue000-\uf8ff]/g, "");
    if (MC_COLORS[code]) currentColor = MC_COLORS[code];
    else if (code === "r") currentColor = undefined;
    if (chunk) segments.push({ text: chunk, color: currentColor });
  }

  return (
    <>
      {segments.map((seg, i) => (
        <span key={i} style={seg.color ? { color: seg.color } : undefined}>
          {seg.text}
        </span>
      ))}
    </>
  );
}

export function PlayerProfileCard({ profile }: PlayerProfileCardProps) {
  const [showTitles, setShowTitles] = useState(false);

  const topRank =
    profile.paid_ranks?.length > 0
      ? profile.paid_ranks[profile.paid_ranks.length - 1]
      : profile.rank || "REGULAR";

  const titles: string[] = profile.hub_title_unlocked || [];

  return (
    <div className="animate-fade-in-up">
      <div className="relative overflow-hidden rounded-2xl border border-[rgba(255,184,0,0.08)] bg-[#111114]">
        {/* Top gradient bar */}
        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, ${rankColor(topRank)}, ${rankColor(topRank)}88, transparent)`,
          }}
        />

        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl border-2"
                style={{ borderColor: rankColor(topRank) + "40" }}
              >
                {profile.equipped_avatar?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.equipped_avatar.url}
                    alt={profile.equipped_avatar.name}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                ) : (
                  <span className="font-heading text-3xl font-bold text-[#FFB800]">
                    {profile.username_cc?.charAt(0).toUpperCase() || "?"}
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2
                  className="font-heading text-2xl font-bold tracking-wide"
                  style={{ color: rankColor(topRank) }}
                >
                  {profile.username_cc}
                </h2>
                <Badge
                  className="border-0 px-2.5 py-0.5 font-heading text-xs font-semibold tracking-wider"
                  style={{
                    backgroundColor: rankColor(topRank) + "18",
                    color: rankColor(topRank),
                  }}
                >
                  {rankDisplayName(topRank)}
                </Badge>
              </div>

              {profile.equipped_hub_title && (
                <p className="mt-1 text-sm">
                  <MinecraftText text={String(profile.equipped_hub_title)} />
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#7a756b]">
                <span>
                  Joined{" "}
                  <span className="text-[#f0ece4]/70">
                    {formatDate(profile.first_played)}
                  </span>
                </span>
                <span>
                  Login Streak{" "}
                  <span className="text-[#FFB800]">
                    {profile.daily_login_streak ?? 0} days
                  </span>
                  <span className="text-[#7a756b]/50">
                    {" "}
                    / best {profile.longest_daily_login_streak ?? 0} days
                  </span>
                </span>
                <span>
                  Friends{" "}
                  <span className="text-[#f0ece4]/70">
                    {profile.friend_count?.toLocaleString()}
                  </span>
                </span>
                <span>
                  Quests{" "}
                  <span className="text-[#f0ece4]/70">
                    {profile.quest_count?.toLocaleString()}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Cosmetic counts */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Hub Titles", count: profile.hub_title_count },
              { label: "Avatars", count: profile.avatar_count },
              { label: "Costumes", count: profile.costume_count },
              { label: "Hats", count: profile.hat_count },
              { label: "Mounts", count: profile.mounts?.length || 0 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg bg-[rgba(255,184,0,0.03)] px-3 py-2 text-center"
              >
                <div className="font-mono text-lg font-semibold text-[#f0ece4]">
                  {item.count}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-[#7a756b]">
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Hub titles showcase */}
          {titles.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowTitles((v) => !v)}
                className="flex items-center gap-2 text-xs text-[#7a756b] hover:text-[#f0ece4]/60 transition-colors"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${showTitles ? "rotate-90" : ""}`}
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
                {showTitles ? "Hide" : "Show"} all {titles.length} hub titles
              </button>

              {showTitles && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {titles.map((title, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-[rgba(255,184,0,0.02)] border border-[rgba(255,184,0,0.05)] px-3 py-2 text-sm"
                    >
                      <MinecraftText text={String(title)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
