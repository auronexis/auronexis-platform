import { NextResponse } from "next/server";
import { unsubscribeNewsletter } from "@/lib/newsletter/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * RFC 8058 one-click unsubscribe target (List-Unsubscribe-Post). Mail providers POST here when a
 * recipient clicks "Unsubscribe" in their mail client. POST only — GET does nothing.
 */
export async function POST(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get("token");
  try {
    const result = await unsubscribeNewsletter(token ?? "", "one_click");
    return NextResponse.json({ ok: result === "ok" }, { status: result === "ok" ? 200 : 400 });
  } catch (error) {
    console.error("[newsletter] one-click unsubscribe failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
