import type { MetadataRoute } from "next";
import { PRIVATE_ROUTE_PREFIXES } from "@/lib/seo/routes";
import { getSeoBaseUrl } from "@/lib/seo/metadata";

export function buildRobotsConfig(): MetadataRoute.Robots {
  const baseUrl = getSeoBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_ROUTE_PREFIXES],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
