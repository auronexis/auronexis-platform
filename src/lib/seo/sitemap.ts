import type { MetadataRoute } from "next";
import { isPrivateRoute, PUBLIC_SITEMAP_ROUTES } from "@/lib/seo/routes";
import { getSeoBaseUrl } from "@/lib/seo/metadata";
import { PUBLIC_CANONICAL_ORIGIN } from "@/lib/company/company-seo";

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

  return PUBLIC_SITEMAP_ROUTES.map((route) => ({
    url: `${baseUrl}${route === "/" ? "" : route}`,
    changeFrequency: resolveChangeFrequency(route),
    priority: resolvePriority(route),
  }));
}

export type SitemapValidationResult = {
  valid: boolean;
  errors: string[];
};

/** Validate sitemap entries for duplicates, private routes, and canonical host. */
export function validateSitemapEntries(entries: MetadataRoute.Sitemap): SitemapValidationResult {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (seen.has(entry.url)) {
      errors.push(`duplicate sitemap URL: ${entry.url}`);
    }
    seen.add(entry.url);

    if (!entry.url.startsWith(PUBLIC_CANONICAL_ORIGIN)) {
      errors.push(`non-canonical sitemap host: ${entry.url}`);
    }

    try {
      const pathname = new URL(entry.url).pathname || "/";
      if (isPrivateRoute(pathname)) {
        errors.push(`private route in sitemap: ${entry.url}`);
      }
    } catch {
      errors.push(`invalid sitemap URL: ${entry.url}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
