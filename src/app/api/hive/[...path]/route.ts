import { NextRequest } from "next/server";

const HIVE_API_BASE = "https://api.playhive.com/v0";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const apiPath = path.join("/");
  const url = `${HIVE_API_BASE}/${apiPath}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
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
