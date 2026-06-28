import type { MetadataRoute } from "next";

const metadataBase = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://app.auroranexis.com";

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
