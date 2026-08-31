import { notFound } from "next/navigation";
import { getIndexNowKey } from "@/lib/seo/indexnow";

export const runtime = "nodejs";

/**
 * IndexNow ownership file at /{key}.txt (protocol Option 1 — host root).
 * Required so urlList entries under https://www.auroranexis.com/ are in scope.
 * See https://www.indexnow.org/documentation
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> },
): Promise<Response> {
  const key = getIndexNowKey();
  const { file } = await context.params;

  if (!key || file !== `${key}.txt`) {
    notFound();
  }

  return new Response(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
