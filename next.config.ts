import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdfkit"],
  // Hostname redirects (www ↔ apex) live in vercel.json with /api/* exclusions.
  // Do not add matching redirects here — duplicate hops caused ERR_TOO_MANY_REDIRECTS.
};

export default nextConfig;
