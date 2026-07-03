import { type NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders } from "@/lib/security/response-headers";
import { updateSession } from "@/lib/supabase/middleware";

function withSecurityHeaders(response: NextResponse): NextResponse {
  return applySecurityHeaders(response);
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  return withSecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|branding/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
