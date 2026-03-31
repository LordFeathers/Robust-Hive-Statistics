import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboards · Hive Stats",
  description:
    "Browse all-time and monthly leaderboards for every game on The Hive Minecraft Bedrock server.",
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
