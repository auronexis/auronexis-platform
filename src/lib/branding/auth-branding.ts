import { getPlatformBrandingDefaults } from "@/lib/branding/platform-defaults";
import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import { isAppHost, isMarketingHost } from "@/lib/deployment/domain-routing";
import {
  getPlatformBrandingFallback,
  getPublishedBrandingByHostname,
} from "@/lib/white-label/queries";

/** Platform auth surfaces always use Auroranexis defaults — never tenant placeholders. */
export function shouldUsePlatformAuthBranding(hostname: string): boolean {
  return isMarketingHost(hostname) || isAppHost(hostname);
}

export async function resolveAuthBranding(hostname: string): Promise<ResolvedOrganizationBranding> {
  if (shouldUsePlatformAuthBranding(hostname)) {
    return getPlatformBrandingDefaults();
  }

  return (await getPublishedBrandingByHostname(hostname)) ?? getPlatformBrandingFallback();
}
