import { BRANDING_ASSETS } from "@/lib/branding/assets";

/** Canonical icon paths — single source for metadata, manifest, and HTML head. */
export const PLATFORM_ICONS = {
  favicon: BRANDING_ASSETS.favicon,
  faviconSvg: BRANDING_ASSETS.faviconSvg,
  appleTouchIcon: BRANDING_ASSETS.appleTouchIcon,
  maskIcon: BRANDING_ASSETS.faviconSvg,
  pwaIcon512: BRANDING_ASSETS.pwaIconCompact,
} as const;

export const PLATFORM_THEME_COLOR = "#2563EB";
export const PLATFORM_BACKGROUND_COLOR = "#071A3D";

/** Next.js metadata icons block derived from platform icon SSOT. */
export const PLATFORM_METADATA_ICONS = {
  icon: [
    { url: PLATFORM_ICONS.favicon, sizes: "any" },
    { url: PLATFORM_ICONS.faviconSvg, type: "image/svg+xml" },
    { url: PLATFORM_ICONS.pwaIcon512, type: "image/png", sizes: "512x512" },
  ],
  apple: [
    {
      url: PLATFORM_ICONS.appleTouchIcon,
      type: "image/png",
      sizes: "180x180",
    },
  ],
  shortcut: [PLATFORM_ICONS.favicon],
} as const;

/** Web app manifest icon entries derived from platform icon SSOT. */
export const PLATFORM_MANIFEST_ICONS = [
  {
    src: PLATFORM_ICONS.favicon,
    sizes: "48x48",
    type: "image/x-icon",
    purpose: "any",
  },
  {
    src: PLATFORM_ICONS.faviconSvg,
    sizes: "any",
    type: "image/svg+xml",
    purpose: "any",
  },
  {
    src: PLATFORM_ICONS.pwaIcon512,
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
  },
] as const;
