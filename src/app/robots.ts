import type { MetadataRoute } from "next";
import { PRODUCTION_DOMAINS } from "@/lib/deployment/production-domains";

function resolveMetadataBase(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw || /localhost|127\.0\.0\.1|\.vercel\.app/i.test(raw)) {
    return `https://${PRODUCTION_DOMAINS.app}`;
  }

  return raw;
}

const metadataBase = resolveMetadataBase();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/settings", "/client-portal", "/api/"],
    },
    sitemap: `${metadataBase}/sitemap.xml`,
  };
}
