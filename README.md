# Hive Stats

Player statistics tracker for The Hive Minecraft Bedrock server.

[![Live App](https://img.shields.io/badge/Live%20App-robust--hive--statistics.vercel.app-FFB800?style=flat&logo=vercel&logoColor=white)](https://robust-hive-statistics.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)

## Features

**Player Stats**
- Search any Hive Bedrock player by username with live autocomplete and recent player history
- View stats across all 14 game modes: Bed Wars, Treasure Wars, SkyWars, Murder Mystery, Block Party, Block Drop, Just Build, Gravity, Ground Wars, Capture the Flag, Survival Games, Deathrun, Hide and Seek, and Treasure Wars Duos
- Per-game primary stats (wins, kills, games played) plus computed ratios (win rate, K/D)
- Monthly stats shown alongside all-time stats for each game
- Overall summary across all games: total wins, total games, overall win rate, best win rate, and most played game

**Progression**
- XP progress bar showing current level and XP needed for the next level
- Level rewards panel listing every cosmetic unlock — costumes, avatars, hub titles, kill effects, and more — with icons for each reward type
- Prestige support for games that allow it

**Leaderboards**
- Separate leaderboard page for all 14 games
- Toggle between current monthly leaderboard and all-time leaderboard
- Select any past month to view historical rankings
- Click any player in the leaderboard to instantly load their stats

**General**
- Shareable URLs — `/?player=username&game=sky` restores the exact view on reload
- Responsive design for desktop and mobile

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js pages and routes
│   ├── page.tsx            # Home page (player search + stats)
│   ├── leaderboard/        # Leaderboard page
│   └── api/hive/           # Proxy to api.playhive.com
├── components/             # UI components
│   ├── hive-dashboard.tsx  # Main app shell
│   ├── game-stats-panel.tsx
│   ├── leaderboard-panel.tsx
│   ├── player-profile.tsx
│   └── player-search.tsx
└── lib/
    ├── hive-api.ts         # Hive API client
    ├── game-config.ts      # Game definitions and stat labels
    └── minecraft-text.tsx  # Minecraft color code parser

public/
├── sw.js                          # Service worker (PWA)
├── icon-192.png / icon-512.png    # App icons
└── .well-known/assetlinks.json    # Android TWA domain verification

android/          # Android TWA project (bubblewrap)
twa-manifest.json # Bubblewrap config
```

## Deploying

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/LordFeathers/Robust-Hive-Statistics)

## Building the Android APK

Requires a keystore file at `android/android.keystore` (not committed). See the [bubblewrap docs](https://github.com/GoogleChromeLabs/bubblewrap) for setup.

```bash
bubblewrap build
```

Output files appear in `android/` — use `app-release-bundle.aab` for Play Store submission.

## Data Source

Stats are fetched from the [Hive API](https://api.playhive.com/v0). This project is not affiliated with Hive Games.
