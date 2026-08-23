import { NextResponse } from "next/server";

/**
 * FastSpring webhooks are retired. Mollie is the sole active billing provider.
 * Respond 410 so misconfigured FastSpring dashboards fail closed without processing.
 * Historical fastspring_webhook_events rows are preserved in the database.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "gone",
      message: "FastSpring webhooks are retired. Configure Mollie at /api/mollie/webhook.",
    },
    { status: 410 },
  );
}

export async function GET() {
  return POST();
}
