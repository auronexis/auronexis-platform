import type { NextRequest } from "next/server";
import { buildPublicApiDocsHtml } from "@/lib/api/docs/public-api-docs-html";
import { getPublicNavStateFromRequest } from "@/lib/marketing/public-nav";

export const dynamic = "force-dynamic";

/** Production-safe HTML API reference — self-contained, auth-aware public navigation. */
export async function GET(request: NextRequest) {
  const auth = await getPublicNavStateFromRequest(request);

  return new Response(buildPublicApiDocsHtml(auth), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-cache",
    },
  });
}
