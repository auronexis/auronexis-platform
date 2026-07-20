import { NextResponse } from "next/server";
import { getIndexNowKey } from "@/lib/seo/indexnow";

export const runtime = "nodejs";

/**
 * IndexNow ownership file at /.well-known/{key}.txt
 * See https://www.indexnow.org/documentation
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> },
): Promise<Response> {
  const key = getIndexNowKey();
  if (!key) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { file } = await context.params;
  if (file !== `${key}.txt`) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return new NextResponse(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
