import type { MetadataRoute } from "next";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { PLATFORM_NAME } from "@/lib/branding/defaults";
import { COMPANY_NAME, COMPANY_SEO } from "@/lib/company";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PLATFORM_NAME,
    short_name: COMPANY_NAME,
    description: COMPANY_SEO.defaultDescription,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#071A3D",
    theme_color: "#2563EB",
    icons: [
      {
        src: BRANDING_ASSETS.favicon,
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: BRANDING_ASSETS.approvedCompositeLogo,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
