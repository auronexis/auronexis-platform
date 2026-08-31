import { NextResponse } from "next/server";
import { verifyCronAuthorization } from "@/lib/env";
import { submitIndexNowUrls } from "@/lib/seo/indexnow";

export const runtime = "nodejs";

async function handleIndexNow(request: Request): Promise<Response> {
  if (!verifyCronAuthorization(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await submitIndexNowUrls();
  if (!result.ok) {
    // Preserve upstream IndexNow status when present; 502 only for transport failures.
    const status =
      typeof result.status === "number" && result.status >= 400 && result.status <= 599
        ? result.status
        : 502;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}

/**
 * IndexNow ping — submits public sitemap URLs to participating search engines.
 * Requires Bearer CRON_SECRET. Safe no-op when INDEXNOW_KEY is unset.
 * GET supports Vercel Cron; POST supports manual ops.
 */
export async function GET(request: Request): Promise<Response> {
  return handleIndexNow(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleIndexNow(request);
}
