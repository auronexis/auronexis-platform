import type { NextConfig } from "next";
import { getSecurityHeaders } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdfkit"],
  // Hostname redirects (www ↔ apex) live in vercel.json with /api/* exclusions.
  // Do not add matching redirects here — duplicate hops caused ERR_TOO_MANY_REDIRECTS.
  async headers() {
    const securityHeaders = getSecurityHeaders(true);

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
