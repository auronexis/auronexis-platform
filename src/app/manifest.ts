import type { MetadataRoute } from "next";
import {
  PLATFORM_BACKGROUND_COLOR,
  PLATFORM_MANIFEST_ICONS,
  PLATFORM_THEME_COLOR,
} from "@/lib/branding/icons";
import { PLATFORM_NAME } from "@/lib/branding/defaults";
import { COMPANY_NAME, COMPANY_SEO } from "@/lib/company";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: PLATFORM_NAME,
    short_name: COMPANY_NAME,
    description: COMPANY_SEO.defaultDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: PLATFORM_BACKGROUND_COLOR,
    theme_color: PLATFORM_THEME_COLOR,
    icons: PLATFORM_MANIFEST_ICONS.map((icon) => ({ ...icon })),
  };
}
