import { NextResponse } from "next/server";

/**
 * Legacy provider webhooks are retired. Mollie is the sole active billing provider.
 * Respond 410 so misconfigured legacy dashboards fail closed without processing.
 * Historical webhook archive rows are preserved in the database.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "gone",
      message: "Legacy provider webhooks are retired. Configure Mollie at /api/mollie/webhook.",
    },
    { status: 410 },
  );
}

export async function GET() {
  return POST();
}
