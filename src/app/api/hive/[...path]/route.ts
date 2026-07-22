import { NextRequest } from "next/server";

const HIVE_API_BASE = "https://api.playhive.com/v0";

// Only proxy the API families the app actually uses
const ALLOWED_PREFIXES = ["player/search/", "game/", "global/statistics"];

// Segments may contain letters, digits, spaces (Bedrock gamertags), _ - .
const SAFE_SEGMENT = /^[\w .\-]{1,64}$/;

function isAllowedPath(segments: string[]): boolean {
  if (segments.length === 0 || segments.length > 8) return false;
  for (const seg of segments) {
    if (!SAFE_SEGMENT.test(seg)) return false;
    if (seg === "." || seg === "..") return false;
  }
  const joined = segments.join("/");
  return ALLOWED_PREFIXES.some(
    (p) => joined === p || joined.startsWith(p) || (p.endsWith("/") && joined === p.slice(0, -1))
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  if (!isAllowedPath(path)) {
    return Response.json({ error: "Invalid API path" }, { status: 400 });
  }

  const url = `${HIVE_API_BASE}/${path.map(encodeURIComponent).join("/")}`;

  // Optional: a Hive-issued API key restores fields (e.g. username_cc in
  // search) that anonymous v0 requests no longer receive. Set HIVE_API_KEY
  // in the deployment env; sent as HTTP basic auth per the OpenAPI spec.
  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.HIVE_API_KEY) {
    headers.Authorization = `Basic ${Buffer.from(`${process.env.HIVE_API_KEY}:`).toString("base64")}`;
  }

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return Response.json(
        { error: "Player not found or API error" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch {
    return Response.json(
      { error: "Failed to reach Hive API" },
      { status: 502 }
    );
  }
}
