import { getPublicNavStateUncached } from "@/lib/marketing/public-nav";
import { buildPublicApiDocsHtml } from "@/lib/api/docs/public-api-docs-html";

export const dynamic = "force-dynamic";

/** Production-safe HTML API reference — self-contained, auth-aware public navigation. */
export async function GET() {
  const auth = await getPublicNavStateUncached();

  return new Response(buildPublicApiDocsHtml(auth), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-cache",
    },
  });
}
