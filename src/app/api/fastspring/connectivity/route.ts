import { NextResponse } from "next/server";

/**
 * Legacy provider connectivity probes are retired.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: "gone",
      message: "Legacy provider API connectivity is retired. Use /api/mollie/connectivity.",
    },
    { status: 410 },
  );
}
