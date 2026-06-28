import type { ResolvedWhiteLabelBranding } from "@/lib/white-label/types";

export type WhiteLabelPreviewViewport = "desktop" | "tablet" | "mobile";

export type WhiteLabelPreviewSurface =
  | "dashboard"
  | "login"
  | "portal"
  | "pdf"
  | "email";

export function getPreviewViewportClass(viewport: WhiteLabelPreviewViewport): string {
  switch (viewport) {
    case "mobile":
      return "max-w-[375px]";
    case "tablet":
      return "max-w-[768px]";
    default:
      return "max-w-full";
  }
}

export function buildPreviewBranding(
  branding: ResolvedWhiteLabelBranding,
): ResolvedWhiteLabelBranding {
  return branding;
}
