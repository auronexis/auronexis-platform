import { type NextRequest, NextResponse } from "next/server";
import {
  buildWwwRedirectUrl,
  isApiRoute,
  shouldAttachAppNoIndexHeader,
  shouldRedirectApexToWww,
  shouldRedirectAppMarketingToWww,
} from "@/lib/deployment/middleware-routing";
import { applySecurityHeaders } from "@/lib/security/response-headers";
import { updateSession } from "@/lib/supabase/middleware";

function withSecurityHeaders(response: NextResponse, hostname: string): NextResponse {
  const secured = applySecurityHeaders(response);
  if (shouldAttachAppNoIndexHeader(hostname)) {
    secured.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return secured;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  if (isApiRoute(pathname)) {
    return withSecurityHeaders(NextResponse.next({ request }), hostname);
  }

  if (shouldRedirectApexToWww(hostname, pathname)) {
    return withSecurityHeaders(
      NextResponse.redirect(buildWwwRedirectUrl(request.nextUrl), 308),
      hostname,
    );
  }

  if (shouldRedirectAppMarketingToWww(hostname, pathname)) {
    return withSecurityHeaders(
      NextResponse.redirect(buildWwwRedirectUrl(request.nextUrl), 308),
      hostname,
    );
  }

  const response = await updateSession(request);
  return withSecurityHeaders(response, hostname);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|manifest.webmanifest|robots.txt|sitemap.xml|branding/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
