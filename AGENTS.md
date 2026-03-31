<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Hive API Reference

Base URL: `https://api.playhive.com/v0` (proxied via `/api/hive` in this app)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/player/search/{partial}` | Search players by prefix |
| GET | `/game/all/all/{identifier}` | Get all game statistics for a player |
| GET | `/game/all/main/{identifier}` | Get main game statistics for a player |
| GET | `/game/special/wars/rewards` | Show special leaderboard |
| GET | `/game/special/wars/rewards/{amount}/{skip}` | Show specific monthly leaderboard |
| GET | `/game/season/{seasongame}/{season}` | Show season leaderboard |
| GET | `/game/season/{seasongame}/{season}/{amount}/{skip}` | Show specific season leaderboard |
| GET | `/game/monthly/{game}/available` | Show available monthly leaderboards |
| GET | `/game/monthly/{game}` | Show current monthly leaderboard |
| GET | `/game/monthly/{game}/{year}/{month}/{amount}/{skip}` | Show specific monthly leaderboard |
| GET | `/game/monthly/player/{game}/{player}` | Show single player entry in current monthly leaderboard |
| GET | `/game/monthly/player/{game}/{player}/{year}/{month}` | Show single player entry in specific monthly leaderboard |
| GET | `/game/season/player/{seasongame}/{player}/{season}` | Show single player entry in season leaderboard |
| GET | `/game/all/{game}` | Show all-time leaderboard |
| GET | `/game/all/{game}/{player}` | Show player all-time statistics |
| GET | `/global/statistics` | Show unique player counts and supported games |
| GET | `/catalogue/costumes` | List costumes |
| GET | `/catalogue/costumes/{id}` | Get a specific costume by ID |
| GET | `/game/map/{game}` | List maps for game |
| GET | `/game/meta/{game}` | List metadata for game |
