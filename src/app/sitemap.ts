import type { MetadataRoute } from "next";
import { PUBLIC_SITEMAP_ROUTES } from "@/lib/company/contact";

const metadataBase = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://app.auroranexis.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_SITEMAP_ROUTES.map((route) => ({
    url: `${metadataBase}${route === "/" ? "" : route}`,
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/pilot-program" ? 0.9 : 0.7,
  }));
}
