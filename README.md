# Hive Stats

Player statistics tracker for The Hive Minecraft Bedrock server.

[![Live App](https://img.shields.io/badge/Live%20App-robust--hive--statistics.vercel.app-FFB800?style=flat&logo=vercel&logoColor=white)](https://robust-hive-statistics.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)

## Features

- Player stats for all 14 Hive game modes (Bed Wars, Treasure Wars, SkyWars, and more)
- Monthly and all-time leaderboards per game
- XP progress bar, level rewards, and prestige support
- Shareable URLs — `/?player=username&game=sky`
- PWA — installable on Android via Google Play or directly from the browser

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

## Building the Android APK

Requires `android/android.keystore` (not committed — keep this file safe).

```bash
bubblewrap build
```

Output files appear in `android/` — use `app-release-bundle.aab` for Play Store submission.

## Deployment

Automatically deployed to Vercel on every push to `main`.

## Data Source

Stats are fetched from the [Hive API](https://api.playhive.com/v0). This project is not affiliated with Hive Games.
