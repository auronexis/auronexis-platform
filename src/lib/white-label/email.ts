import type { ResolvedWhiteLabelBranding } from "@/lib/white-label/types";
import { PLATFORM_NAME } from "@/lib/branding/defaults";

export function getEmailBrandingContext(branding: ResolvedWhiteLabelBranding) {
  return {
    companyName: branding.companyName,
    logoUrl: branding.logoLightUrl ?? branding.logoUrl,
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    senderName: branding.emailSenderName ?? branding.companyName,
    senderAddress: branding.emailSenderAddress,
    supportEmail: branding.supportEmail,
    supportUrl: branding.supportUrl,
    footerLine: branding.pdfFooter,
    poweredByLabel: branding.hidePlatformBranding ? branding.companyName : PLATFORM_NAME,
  };
}

export function buildEmailFooter(branding: ResolvedWhiteLabelBranding): string {
  const parts = [
    branding.supportEmail ? `Support: ${branding.supportEmail}` : null,
    branding.supportUrl ? branding.supportUrl : null,
    branding.privacyUrl ? `Privacy: ${branding.privacyUrl}` : null,
    branding.termsUrl ? `Terms: ${branding.termsUrl}` : null,
  ].filter(Boolean);

  return parts.join(" · ");
}
