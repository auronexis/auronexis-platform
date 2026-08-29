import { type NextRequest, NextResponse } from "next/server";
import {
  buildWwwRedirectUrl,
  isApiRoute,
  shouldAttachNoIndexHeader,
  shouldRedirectApexToWww,
  shouldRedirectAppMarketingToWww,
} from "@/lib/deployment/middleware-routing";
import { applySecurityHeaders } from "@/lib/security/response-headers";
import { isUnknownPublicDynamicSlugPath } from "@/lib/seo/public-dynamic-slug-allowlist";
import { updateSession } from "@/lib/supabase/middleware";

function withSecurityHeaders(
  response: NextResponse,
  hostname: string,
  pathname: string,
): NextResponse {
  const secured = applySecurityHeaders(response);
  if (shouldAttachNoIndexHeader(hostname, pathname)) {
    secured.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return secured;
}

function hardNotFoundResponse(hostname: string, pathname: string): NextResponse {
  const body = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="robots" content="noindex, nofollow"/><title>Page Not Found | Auroranexis</title></head><body><main><p>404</p><h1>Page not found</h1><p>The page you requested does not exist.</p><p><a href="/">Back home</a></p></main></body></html>`;
  const response = new NextResponse(body, {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
    },
  });
  return withSecurityHeaders(response, hostname, pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  if (isApiRoute(pathname)) {
    return withSecurityHeaders(NextResponse.next({ request }), hostname, pathname);
  }

  if (shouldRedirectApexToWww(hostname, pathname)) {
    return withSecurityHeaders(
      NextResponse.redirect(buildWwwRedirectUrl(request.nextUrl), 308),
      hostname,
      pathname,
    );
  }

  if (shouldRedirectAppMarketingToWww(hostname, pathname)) {
    return withSecurityHeaders(
      NextResponse.redirect(buildWwwRedirectUrl(request.nextUrl), 308),
      hostname,
      pathname,
    );
  }

  if (isUnknownPublicDynamicSlugPath(pathname)) {
    return hardNotFoundResponse(hostname, pathname);
  }

  const response = await updateSession(request);
  return withSecurityHeaders(response, hostname, pathname);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|manifest.webmanifest|branding/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
