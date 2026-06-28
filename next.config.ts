import type { NextConfig } from "next";
import { PRODUCTION_DOMAIN_REDIRECTS } from "@/lib/deployment/production-domains";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdfkit"],
  async redirects() {
    return PRODUCTION_DOMAIN_REDIRECTS.map((rule) => ({
      source: "/:path*",
      has: [{ type: "host", value: rule.sourceHost }],
      destination: `${rule.destination}/:path*`,
      permanent: rule.permanent,
    }));
  },
};

export default nextConfig;
