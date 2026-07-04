import { buildPublicApiDocsHtml } from "@/lib/api/docs/public-api-docs-html";

export const dynamic = "force-static";
export const revalidate = 86400;

/** Production-safe HTML API reference — self-contained, no client bundles required. */
export function GET() {
  return new Response(buildPublicApiDocsHtml(), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
