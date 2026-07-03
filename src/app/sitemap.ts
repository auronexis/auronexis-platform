import type { MetadataRoute } from "next";
import { PUBLIC_SITEMAP_ROUTES } from "@/lib/company/contact";
import { PRODUCTION_DOMAINS } from "@/lib/deployment/production-domains";

function resolveMetadataBase(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw || /localhost|127\.0\.0\.1|\.vercel\.app/i.test(raw)) {
    return `https://${PRODUCTION_DOMAINS.app}`;
  }

  return raw;
}

const metadataBase = resolveMetadataBase();

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_SITEMAP_ROUTES.map((route) => ({
    url: `${metadataBase}${route === "/" ? "" : route}`,
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/pilot-program" ? 0.9 : 0.7,
  }));
}
