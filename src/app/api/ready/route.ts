import { NextResponse } from "next/server";
import { getPlatformHealthSnapshot } from "@/lib/observability/health";

export const runtime = "nodejs";

/** Readiness probe — database and Supabase must be reachable. */
export async function GET(): Promise<Response> {
  const snapshot = await getPlatformHealthSnapshot();
  const ready = snapshot.configuration.database && snapshot.configuration.supabase;

  return NextResponse.json(
    {
      ready,
      status: ready ? "ready" : "not_ready",
      timestamp: snapshot.timestamp,
      version: snapshot.version,
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
