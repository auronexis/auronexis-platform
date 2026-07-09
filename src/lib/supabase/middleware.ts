import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PUBLIC_SITEMAP_ROUTES } from "@/lib/company/contact";
import {
  buildAppLoginUrl,
  isAuthPath,
  isMarketingPublicPath,
  isPortalLoginPath,
} from "@/lib/deployment/domain-routing";
import { isApiRoute, shouldBypassSessionMiddleware } from "@/lib/deployment/middleware-routing";
import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

function isPublicPath(pathname: string): boolean {
  if (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.svg" ||
    pathname.startsWith("/legal/") ||
    pathname.startsWith("/docs/") ||
    pathname.startsWith("/invite/")
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
    return NextResponse.redirect(buildAppLoginUrl(request.nextUrl, pathname));
  }

  return supabaseResponse;
}
