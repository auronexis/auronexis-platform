import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { probeMollieApiConnectivity } from "@/lib/billing/providers/mollie";
import { verifyCronAuthorization } from "@/lib/env";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAuthorized(request: Request): Promise<boolean> {
  if (verifyCronAuthorization(request)) {
    return true;
  }

  const session = await getSession();
  return Boolean(session && canManageOrganizationSettings(session));
}

/**
 * Production-safe Mollie API connectivity probe (read-only).
 * Requires Bearer CRON_SECRET or an authenticated owner/admin session.
 * Returns only sanitized booleans/status — never secrets.
 * Mollie is foundation-only — does not activate billing or mutate subscription state.
 */
export async function GET(request: Request): Promise<Response> {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await probeMollieApiConnectivity();

  return NextResponse.json(result, {
    status: 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(): Promise<Response> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
