import { NextResponse } from "next/server";
import { getPlatformHealthSnapshot } from "@/lib/observability/health";

export const runtime = "nodejs";

/** Public status summary for uptime monitors — no secrets exposed. */
export async function GET(): Promise<Response> {
  const snapshot = await getPlatformHealthSnapshot();

  return NextResponse.json(snapshot, {
    status: snapshot.status === "unavailable" ? 503 : 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
