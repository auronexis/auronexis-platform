import { NextResponse } from "next/server";
import { buildSecurityTxt } from "@/lib/security/vulnerability-disclosure";

export const runtime = "nodejs";

/**
 * RFC 9116 security.txt — public vulnerability contact and policy pointers.
 * Expires is regenerated per request (see resolveSecurityTxtExpires).
 */
export async function GET(): Promise<Response> {
  return new NextResponse(buildSecurityTxt(), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

export async function HEAD(): Promise<Response> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
