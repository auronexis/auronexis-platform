import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PUBLIC_SITEMAP_ROUTES } from "@/lib/company/contact";
import {
  buildAppLoginUrl,
  isAuthPath,
  isMarketingPublicPath,
  isPortalLoginPath,
} from "@/lib/deployment/domain-routing";
import { isApiRoute, isIndexNowKeyFilePath, shouldBypassSessionMiddleware } from "@/lib/deployment/middleware-routing";
import { isPrivateRoute } from "@/lib/seo/private-routes";
import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

/** Hard 404 for unknown non-public paths — must not masquerade as an auth wall. */
function hardNotFoundResponse(): NextResponse {
  const body = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="robots" content="noindex, nofollow"/><title>Page Not Found | Auroranexis</title></head><body><main><p>404</p><h1>Page not found</h1><p>The page you requested does not exist.</p><p><a href="/">Back home</a></p></main></body></html>`;
  return new NextResponse(body, {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
    },
  });
}

function isPublicPath(pathname: string): boolean {
  if (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/llms.txt" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.svg" ||
    pathname === "/sub-processors" ||
    pathname === "/dpa" ||
    pathname.startsWith("/.well-known/") ||
    pathname.startsWith("/legal/") ||
    pathname.startsWith("/docs/") ||
    pathname.startsWith("/invite/") ||
    // IndexNow Option 1 key file — must not hard-404 before the route handler.
    isIndexNowKeyFilePath(pathname)
  ) {
    return true;
  }

  // Local/dev e-invoice viewer only — never treated as public on production runtime.
  if (
    pathname.startsWith("/internal/einvoice-preview") &&
    process.env.NODE_ENV !== "production" &&
    process.env.VERCEL_ENV !== "production"
  ) {
    return true;
  }

  if (isApiRoute(pathname)) {
    return true;
  }

  if (isMarketingPublicPath(pathname)) {
    return true;
  }

  return PUBLIC_SITEMAP_ROUTES.some(
    (route) => pathname === route || (route !== "/" && pathname.startsWith(`${route}/`)),
  );
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldBypassSessionMiddleware(pathname)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = isAuthPath(pathname);
  const isPublicRoute =
    isPublicPath(pathname) || isPortalLoginPath(pathname) || isAuthRoute;

  const isPortalRoute = pathname.startsWith("/client-portal");

  if (isPortalRoute) {
    if (pathname === "/client-portal/login") {
      return supabaseResponse;
    }

    if (!user) {
      const portalLoginUrl = request.nextUrl.clone();
      portalLoginUrl.pathname = "/client-portal/login";
      portalLoginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(portalLoginUrl);
    }

    return supabaseResponse;
  }

  if (!user && !isPublicRoute) {
    // Known app surfaces keep the login redirect. Unknown paths must hard-404
    // (not 307 → /login), so crawlers and mistyped URLs do not hit an auth wall.
    if (!isPrivateRoute(pathname)) {
      return hardNotFoundResponse();
    }
    return NextResponse.redirect(buildAppLoginUrl(request.nextUrl, pathname));
  }

  return supabaseResponse;
}
