import { NextResponse } from "next/server";
import { verifyCronAuthorization } from "@/lib/env";
import { probeFastSpringApiConnectivity } from "@/lib/fastspring/connectivity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Production-safe FastSpring API connectivity probe.
 * Requires Bearer CRON_SECRET. Returns only sanitized booleans/status — never secrets.
 */
export async function GET(request: Request): Promise<Response> {
  if (!verifyCronAuthorization(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await probeFastSpringApiConnectivity();

  return NextResponse.json(result, {
    status: 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(): Promise<Response> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
