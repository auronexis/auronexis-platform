import { type NextRequest, NextResponse } from "next/server";
import {
  buildWwwRedirectUrl,
  isApiRoute,
  shouldRedirectApexToWww,
} from "@/lib/deployment/middleware-routing";
import { applySecurityHeaders } from "@/lib/security/response-headers";
import { updateSession } from "@/lib/supabase/middleware";

function withSecurityHeaders(response: NextResponse): NextResponse {
  return applySecurityHeaders(response);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  if (isApiRoute(pathname)) {
    return withSecurityHeaders(NextResponse.next({ request }));
  }

  if (shouldRedirectApexToWww(hostname, pathname)) {
    return withSecurityHeaders(NextResponse.redirect(buildWwwRedirectUrl(request.nextUrl), 308));
  }

  const response = await updateSession(request);
  return withSecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|manifest.webmanifest|robots.txt|sitemap.xml|branding/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
