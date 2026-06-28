import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdfkit"],
  // Hostname redirects (www ↔ apex) are configured in Vercel Domains only.
  // Do not add matching redirects here — duplicate hops caused ERR_TOO_MANY_REDIRECTS.
};

export default nextConfig;
