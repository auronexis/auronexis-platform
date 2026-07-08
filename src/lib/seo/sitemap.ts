import type { MetadataRoute } from "next";
import { PUBLIC_SITEMAP_ROUTES } from "@/lib/seo/routes";
import { getSeoBaseUrl } from "@/lib/seo/metadata";

function resolvePriority(route: string): number {
  if (route === "/") return 1;
  if (route === "/pilot-program" || route === "/pricing") return 0.9;
  if (route.startsWith("/solutions/")) return 0.85;
  if (route.startsWith("/templates/")) return 0.8;
  if (route.startsWith("/docs")) return 0.75;
  return 0.7;
}

function resolveChangeFrequency(route: string): MetadataRoute.Sitemap[number]["changeFrequency"] {
  if (route === "/" || route === "/status") return "weekly";
  if (route.startsWith("/docs")) return "monthly";
  return "monthly";
}

/** Build the public sitemap — authenticated routes are excluded by design. */
export function buildSitemapEntries(): MetadataRoute.Sitemap {
  const baseUrl = getSeoBaseUrl();
  const lastModified = new Date();

  return PUBLIC_SITEMAP_ROUTES.map((route) => ({
    url: `${baseUrl}${route === "/" ? "" : route}`,
    lastModified,
    changeFrequency: resolveChangeFrequency(route),
    priority: resolvePriority(route),
  }));
}
