"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { PlayerProfile } from "@/lib/hive-api";
import { formatDate, rankColor, rankDisplayName } from "@/lib/game-config";

interface PlayerProfileCardProps {
  profile: PlayerProfile;
  kdRatio?: number | null;
}

// ─── Minecraft text parser ────────────────────────────────────────────────────

const MC_COLORS: Record<string, string> = {
  "0": "#000000", "1": "#0000AA", "2": "#00AA00", "3": "#00AAAA",
  "4": "#AA0000", "5": "#AA00AA", "6": "#FFAA00", "7": "#AAAAAA",
  "8": "#555555", "9": "#5555FF", "a": "#55FF55", "b": "#55FFFF",
  "c": "#FF5555", "d": "#FF55FF", "e": "#FFFF55", "f": "#FFFFFF",
};

// Formatting codes to skip (bold, italic, etc.)
const MC_FORMAT_CODES = new Set(["k", "l", "m", "n", "o"]);

interface TextSegment { text: string; color?: string }

function parseMinecraftText(raw: string): TextSegment[] {
  // Strip parenthesised icon glyphs (e.g. "(\ue177)") before parsing so they
  // don't leave empty "()" behind after the private-use chars are removed.
  const cleaned = raw
    .replace(/\([\ue000-\uf8ff]+\)/g, "")
    .replace(/^\s+/, ""); // trim any leading whitespace left behind

  const segments: TextSegment[] = [];
  let color: string | undefined;
  let i = 0;

  while (i < cleaned.length) {
    const ch = cleaned[i];

    if ((ch === "&" || ch === "§") && i + 1 < raw.length) {
      const code = raw[i + 1].toLowerCase();

      // Hex color: &x followed by six (&<hex-digit>) pairs = 14 chars total
      if (code === "x" && i + 13 < cleaned.length) {
        const hexSeq = cleaned.slice(i + 2, i + 14);
        if (/^(?:[&§][0-9a-fA-F]){6}$/.test(hexSeq)) {
          color = "#" + hexSeq.replace(/[&§]/g, "");
          i += 14;
          continue;
        }
      }

      if (MC_COLORS[code]) {
        color = MC_COLORS[code];
      } else if (code === "r") {
        color = undefined;
      }
      i += 2;
    } else {
      const start = i;
      while (i < cleaned.length && cleaned[i] !== "&" && cleaned[i] !== "§") i++;
      // Strip private-use unicode (Minecraft item icons, etc.)
      const chunk = cleaned.slice(start, i).replace(/[\ue000-\uf8ff]/g, "");
      if (chunk) segments.push({ text: chunk, color });
    }
  }

  return segments;
}

function MinecraftText({ text }: { text: string }) {
  const segments = parseMinecraftText(String(text));
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

// ─── Cosmetic item renderer ───────────────────────────────────────────────────

const RARITY_COLORS: Record<string, string> = {
  LEGENDARY: "#FFB800",
  EPIC:      "#AA00AA",
  RARE:      "#5555FF",
  UNCOMMON:  "#55FF55",
  COMMON:    "#AAAAAA",
};

// Convert a display name to a CDN-compatible kebab slug
function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function cdnIcon(type: "mount" | "costume" | "pet", name: string): string {
  return `https://cdn.playhive.com/avatars/${type}-${nameToSlug(name)}.png`;
}

const failedIconUrls = new Set<string>();

function CosmeticIcon({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(() => !src || failedIconUrls.has(src));

  if (!src || failed) {
    return (
      <div className="h-10 w-10 shrink-0 rounded-lg bg-[rgba(255,184,0,0.08)] flex items-center justify-center">
        <span className="text-[10px] font-semibold text-[#FFB800]/60 leading-none">
          {name.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className="h-10 w-10 shrink-0 rounded-lg object-cover"
      onError={() => { failedIconUrls.add(src!); setFailed(true); }}
    />
  );
}

// Items from the API can be strings, Minecraft-colored strings, or objects
// like { url, name } (avatar) or { name, icon, rarity } (hat/backbling).
function CosmeticItemContent({ item, useMinecraft }: { item: unknown; useMinecraft?: boolean }) {
  if (item !== null && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const name = String(obj.name ?? obj.display_name ?? obj.title ?? obj.id ?? "Unknown");
    const url = typeof obj.url === "string" ? obj.url : null;
    const icon = typeof obj.icon === "string" ? obj.icon : null;
    const rarity = typeof obj.rarity === "string" ? obj.rarity.toUpperCase() : null;
    const rarityColor = rarity ? (RARITY_COLORS[rarity] ?? "#AAAAAA") : null;
    const imgSrc = url || icon;

    return (
      <div className="flex items-center gap-3 min-w-0">
        <CosmeticIcon src={imgSrc} name={name} />
        <span className="flex-1 truncate">{name}</span>
        {rarity && (
          <span
            className="shrink-0 text-[9px] uppercase tracking-widest font-medium"
            style={{ color: rarityColor ?? undefined }}
          >
            {rarity.charAt(0) + rarity.slice(1).toLowerCase()}
          </span>
        )}
      </div>
    );
  }

  const str = String(item ?? "");
  if (useMinecraft) return <span><MinecraftText text={str} /></span>;
  return <span>{str}</span>;
}

// ─── Field lookup ─────────────────────────────────────────────────────────────

// Tries multiple field name variants in order; returns the first non-empty array found.
function lookupField(profile: PlayerProfile, ...keys: string[]): unknown[] {
  for (const key of keys) {
    const val = (profile as unknown as Record<string, unknown>)[key];
    if (Array.isArray(val) && val.length > 0) return val;
  }
  return [];
}

// ─── Cosmetic panel ───────────────────────────────────────────────────────────

interface CosmeticConfig {
  key: string;
  label: string;
  count: number;
  items: unknown[];
  useMinecraft?: boolean;
}

// Strip all Minecraft color/format codes and private-use chars to get plain text
function stripMinecraft(text: string): string {
  return text
    .replace(/[&§]x(?:[&§][0-9a-fA-F]){6}/gi, "")
    .replace(/[&§][0-9a-zA-Z]/g, "")
    .replace(/[\ue000-\uf8ff]/g, "")
    .replace(/\\\//g, "/")
    .trim();
}

function isKdTitle(title: unknown): boolean {
  if (typeof title !== "string") return false;
  return /k[\\/]d\s*ratio/i.test(stripMinecraft(title));
}

function CosmeticPanel({
  items,
  useMinecraft,
  kdRatio,
}: {
  items: unknown[];
  useMinecraft?: boolean;
  kdRatio?: number | null;
}) {
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-[#7a756b]">No items to display</p>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {items.map((item, i) => {
        const itemKey = item !== null && typeof item === "object"
          ? String((item as Record<string, unknown>).name ?? i)
          : String(item);
        return (
        <div
          key={itemKey}
          className="rounded-lg bg-[rgba(255,184,0,0.02)] border border-[rgba(255,184,0,0.05)] px-3 py-2 text-sm text-[#f0ece4]/80 overflow-hidden"
        >
          <div className="flex items-center gap-2">
            {isKdTitle(item) && kdRatio != null && (
              <span className="shrink-0 font-mono text-sm text-[#FFB800]">
                {kdRatio.toFixed(2)}
              </span>
            )}
            <CosmeticItemContent item={item} useMinecraft={useMinecraft} />
          </div>
        </div>
        );
      })}
    </div>
  );
}

// ─── Profile card ─────────────────────────────────────────────────────────────

export function PlayerProfileCard({ profile, kdRatio }: PlayerProfileCardProps) {
  const [openCosmetic, setOpenCosmetic] = useState<string | null>(null);

  const topRank =
    profile.paid_ranks?.length > 0
      ? profile.paid_ranks[profile.paid_ranks.length - 1]
      : profile.rank || "REGULAR";

  const cosmetics: CosmeticConfig[] = [
    {
      key: "hub_titles",
      label: "Hub Titles",
      count: profile.hub_title_count,
      items: profile.hub_title_unlocked || [],
      useMinecraft: true,
    },
    {
      key: "avatars",
      label: "Avatars",
      count: profile.avatar_count,
      items: profile.avatar_unlocked || [],
    },
    {
      key: "costumes",
      label: "Costumes",
      count: profile.costume_count,
      items: (profile.costume_unlocked || []).map((name) => ({
        name,
        icon: cdnIcon("costume", name),
      })),
    },
    {
      key: "hats",
      label: "Hats",
      count: profile.hat_count,
      items: profile.hat_unlocked || [],
    },
    {
      key: "back_blings",
      label: "Back Blings",
      count: profile.backbling_count,
      items: profile["cosmetics.backbling"] || [],
    },
    {
      key: "mounts",
      label: "Mounts",
      count: profile.mounts?.length || 0,
      items: (profile.mounts || []).map((name) => ({
        name,
        icon: cdnIcon("mount", name),
      })),
    },
    {
      key: "pets",
      label: "Pets",
      count: profile.pets?.length || 0,
      items: (profile.pets || []).map((name) => ({
        name,
        icon: cdnIcon("pet", name),
      })),
    },
  ];

  const activeCosmetic = cosmetics.find((c) => c.key === openCosmetic) ?? null;

  function toggleCosmetic(key: string) {
    setOpenCosmetic((prev) => (prev === key ? null : key));
  }

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

          {/* Cosmetic tiles */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {cosmetics.map((c) => {
              const isOpen = openCosmetic === c.key;
              const hasItems = c.items.length > 0;
              const isClickable = hasItems || c.count > 0;
              return (
                <button
                  key={c.key}
                  onClick={() => isClickable && toggleCosmetic(c.key)}
                  disabled={!isClickable}
                  className={[
                    "rounded-lg px-3 py-2 text-center transition-all duration-200",
                    isClickable ? "cursor-pointer hover:bg-[rgba(255,184,0,0.07)]" : "cursor-default",
                    isOpen
                      ? "bg-[rgba(255,184,0,0.08)] ring-1 ring-[rgba(255,184,0,0.18)]"
                      : "bg-[rgba(255,184,0,0.03)]",
                  ].join(" ")}
                >
                  <div className="font-mono text-lg font-semibold text-[#f0ece4]">
                    {c.count}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-widest text-[#7a756b]">
                    {c.label}
                    {isClickable && (
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Expanded cosmetic panel */}
          {activeCosmetic && (
            <div className="mt-3 rounded-xl border border-[rgba(255,184,0,0.08)] bg-[rgba(255,184,0,0.02)] p-4 animate-fade-in-up">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-widest text-[#FFB800]/60">
                  {activeCosmetic.label}
                  <span className="ml-2 text-[#7a756b]">({activeCosmetic.items.length})</span>
                </span>
                <button
                  onClick={() => setOpenCosmetic(null)}
                  className="text-[#7a756b] hover:text-[#f0ece4]/60 transition-colors"
                  aria-label="Close"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CosmeticPanel
                items={activeCosmetic.items}
                useMinecraft={activeCosmetic.useMinecraft}
                kdRatio={activeCosmetic.key === "hub_titles" ? kdRatio : null}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
