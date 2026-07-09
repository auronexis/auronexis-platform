import { BRANDING_ASSETS } from "@/lib/branding/assets";

/** Canonical icon paths — single source for metadata, manifest, and HTML head. */
export const PLATFORM_ICONS = {
  favicon: BRANDING_ASSETS.favicon,
  appleTouchIcon: BRANDING_ASSETS.favicon,
  maskIcon: BRANDING_ASSETS.favicon,
  pwaIcon512: BRANDING_ASSETS.approvedCompositeLogo,
} as const;

export const PLATFORM_THEME_COLOR = "#2563EB";
export const PLATFORM_BACKGROUND_COLOR = "#071A3D";

/** Next.js metadata icons block derived from platform icon SSOT. */
export const PLATFORM_METADATA_ICONS = {
  icon: [
    { url: PLATFORM_ICONS.favicon, type: "image/svg+xml" },
    { url: PLATFORM_ICONS.pwaIcon512, type: "image/png", sizes: "512x512" },
  ],
  apple: [{ url: PLATFORM_ICONS.appleTouchIcon, type: "image/svg+xml" }],
  shortcut: [PLATFORM_ICONS.favicon],
} as const;

/** Web app manifest icon entries derived from platform icon SSOT. */
export const PLATFORM_MANIFEST_ICONS = [
  {
    src: PLATFORM_ICONS.favicon,
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
