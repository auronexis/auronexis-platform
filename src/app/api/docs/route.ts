import { getSession } from "@/lib/auth/session";
import { buildPublicApiDocsHtml } from "@/lib/api/docs/public-api-docs-html";
import { getMarketingAuthState } from "@/lib/marketing/auth-context";

export const dynamic = "force-dynamic";

/** Production-safe HTML API reference — self-contained, auth-aware public navigation. */
export async function GET() {
  const session = await getSession();
  const auth = getMarketingAuthState(session);

  return new Response(buildPublicApiDocsHtml(auth), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-cache",
    },
  });
}
