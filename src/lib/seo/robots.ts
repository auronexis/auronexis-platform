import type { MetadataRoute } from "next";
import { NOINDEX_ROUTES, PRIVATE_ROUTE_PREFIXES } from "@/lib/seo/private-routes";
import { getSeoBaseUrl } from "@/lib/seo/metadata";

export function buildRobotsConfig(): MetadataRoute.Robots {
  const baseUrl = getSeoBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_ROUTE_PREFIXES, ...NOINDEX_ROUTES],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl.replace(/^https?:\/\//, ""),
  };
}
