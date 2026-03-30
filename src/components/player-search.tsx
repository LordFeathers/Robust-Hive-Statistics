"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { searchPlayers, type PlayerSearchResult } from "@/lib/hive-api";

const STORAGE_KEY = "hive_recent_players";
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecent(username: string) {
  const prev = loadRecent().filter((u) => u.toLowerCase() !== username.toLowerCase());
  const next = [username, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

interface PlayerSearchProps {
  onSelect: (username: string) => void;
  isLoading: boolean;
  value?: string;
}

export function PlayerSearch({ onSelect, isLoading, value }: PlayerSearchProps) {
  const [query, setQuery] = useState(value ?? "");

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentPlayers, setRecentPlayers] = useState<string[]>([]);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const suppressSearchRef = useRef(false);

  useEffect(() => {
    setRecentPlayers(loadRecent());
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (suppressSearchRef.current) {
      suppressSearchRef.current = false;
      return;
    }
    if (q.length < 4) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    try {
      const data = await searchPlayers(q);
      setResults(data.slice(0, 8));
      setShowDropdown(data.length > 0);
      setSelectedIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setShowRecentDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit(username?: string) {
    const target = username || query.trim();
    if (!target) return;
    suppressSearchRef.current = true;
    setShowDropdown(false);
    setShowRecentDropdown(false);
    setResults([]);
    saveRecent(target);
    setRecentPlayers(loadRecent());
    onSelect(target);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSubmit(results[selectedIndex].username_cc);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  const showRecent = showRecentDropdown && !showDropdown && query.length === 0 && recentPlayers.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="search-glow relative rounded-xl transition-all duration-300">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFB800]/60">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
            else setShowRecentDropdown(true);
          }}
          placeholder="Search for a player..."
          className="h-13 rounded-xl border-[rgba(255,184,0,0.12)] bg-[#111114] pl-11 pr-4 text-base font-light tracking-wide text-[#f0ece4] placeholder:text-[#7a756b] focus-visible:ring-[#FFB800]/30 focus-visible:border-[#FFB800]/30"
          disabled={isLoading}
        />
        {(searching || isLoading) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#FFB800]/30 border-t-[#FFB800]" />
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-[rgba(255,184,0,0.1)] bg-[#111114] shadow-lg shadow-black/40 overflow-hidden animate-fade-in-up">
          {results.map((result, i) => (
            <button
              key={result.UUID}
              onClick={() => handleSubmit(result.username_cc)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                i === selectedIndex
                  ? "bg-[rgba(255,184,0,0.08)]"
                  : "hover:bg-[rgba(255,184,0,0.04)]"
              } ${i > 0 ? "border-t border-[rgba(255,184,0,0.04)]" : ""}`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(255,184,0,0.08)]">
                <span className="font-mono text-xs text-[#FFB800]/70">
                  {result.username_cc.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="text-sm font-medium text-[#f0ece4]">
                {result.username_cc}
              </div>
            </button>
          ))}
        </div>
      )}

      {showRecent && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-[rgba(255,184,0,0.1)] bg-[#111114] shadow-lg shadow-black/40 overflow-hidden animate-fade-in-up">
          <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-[#7a756b]/50">
            Recent
          </div>
          {recentPlayers.map((username, i) => (
            <button
              key={username}
              onClick={() => handleSubmit(username)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgba(255,184,0,0.04)] ${
                i > 0 ? "border-t border-[rgba(255,184,0,0.04)]" : ""
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(255,184,0,0.04)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7a756b]">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M12 7v5l4 2" />
                </svg>
              </div>
              <div className="text-sm font-medium text-[#f0ece4]/70">{username}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
