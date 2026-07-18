import type { MetadataRoute } from "next";
import { buildSitemapEntries, validateSitemapEntries } from "@/lib/seo/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries = buildSitemapEntries();
  const validation = validateSitemapEntries(entries);
  if (!validation.valid) {
    throw new Error(`Invalid sitemap: ${validation.errors.join("; ")}`);
  }
  return entries;
}
