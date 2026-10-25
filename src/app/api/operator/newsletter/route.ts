import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyCronAuthorization } from "@/lib/env";
import { sendNewsletterIssue } from "@/lib/newsletter/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const bodySchema = z.object({
  mode: z.enum(["preview", "test", "send"]),
  subject: z.string().trim().min(3).max(150),
  bodyText: z.string().trim().min(20).max(20000),
  testTo: z.string().email().optional(),
});

/**
 * Operator-only newsletter send (Bearer CRON_SECRET). Always sends from noreply@auroranexis.com to
 * double-opt-in-confirmed subscribers only.
 *   mode "preview" → recipient count, nothing sent
 *   mode "test"    → only to testTo
 *   mode "send"    → all confirmed subscribers
 */
export async function POST(request: Request): Promise<Response> {
  if (!verifyCronAuthorization(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid body" }, { status: 400 });
  }
  if (parsed.data.mode === "test" && !parsed.data.testTo) {
    return NextResponse.json({ error: "testTo is required for mode test" }, { status: 400 });
  }
  const summary = await sendNewsletterIssue(parsed.data);
  return NextResponse.json(summary);
}
