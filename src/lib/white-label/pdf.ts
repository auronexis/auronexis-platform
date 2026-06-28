import type { ResolvedWhiteLabelBranding } from "@/lib/white-label/types";
import { PLATFORM_NAME } from "@/lib/branding/defaults";

export function getPdfBrandingContext(branding: ResolvedWhiteLabelBranding) {
  return {
    companyName: branding.companyName,
    logoUrl: branding.logoLightUrl ?? branding.logoUrl,
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    footer: branding.pdfFooter ?? branding.companyName,
    supportEmail: branding.supportEmail,
    supportUrl: branding.supportUrl,
    poweredByLabel: branding.hidePlatformBranding ? branding.companyName : PLATFORM_NAME,
  };
}
