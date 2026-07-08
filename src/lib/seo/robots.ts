import type { MetadataRoute } from "next";
import { getSeoBaseUrl } from "@/lib/seo/metadata";

/**
 * Authenticated and internal routes excluded from crawling.
 * Public marketing, legal, docs, solutions, and templates remain indexable.
 */
const DISALLOWED_PREFIXES = [
  "/dashboard",
  "/settings",
  "/client-portal",
  "/api/",
  "/sales",
  "/invite",
  "/profile",
  "/clients",
  "/reports",
  "/incidents",
  "/risks",
  "/automation",
  "/monitoring",
  "/predictive",
  "/profitability",
  "/knowledge",
  "/notifications",
  "/activity",
] as const;

export function buildRobotsConfig(): MetadataRoute.Robots {
  const baseUrl = getSeoBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...DISALLOWED_PREFIXES],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
