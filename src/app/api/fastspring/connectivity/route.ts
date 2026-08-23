import { NextResponse } from "next/server";

/**
 * FastSpring connectivity probes are retired with the FastSpring provider.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: "gone",
      message: "FastSpring API connectivity is retired. Use /api/mollie/connectivity.",
    },
    { status: 410 },
  );
}
