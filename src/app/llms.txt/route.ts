import { NextResponse } from "next/server";
import { buildLlmsTxt } from "@/lib/seo/llms-txt";

export async function GET() {
  return new NextResponse(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
