import { BRANDING_ASSETS } from "@/lib/branding/assets";
import {
  DEFAULT_PORTAL_WELCOME_MESSAGE,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  PLATFORM_NAME,
  type ResolvedOrganizationBranding,
} from "@/lib/branding/defaults";

/** Default Auroranexis platform branding — used when no org white-label overrides exist. */
export function getPlatformBrandingDefaults(): ResolvedOrganizationBranding {
  return {
    companyName: PLATFORM_NAME,
    platformName: PLATFORM_NAME,
    primaryColor: DEFAULT_PRIMARY_COLOR,
    secondaryColor: DEFAULT_SECONDARY_COLOR,
    logoUrl: BRANDING_ASSETS.approvedCompositeLogo,
    logoLightUrl: BRANDING_ASSETS.approvedCompositeLogo,
    logoDarkUrl: BRANDING_ASSETS.approvedCompositeLogo,
    logoHorizontalUrl: BRANDING_ASSETS.approvedCompositeLogo,
    iconUrl: BRANDING_ASSETS.approvedCompositeLogo,
    faviconUrl: BRANDING_ASSETS.favicon,
    loginBackgroundUrl: BRANDING_ASSETS.loginBackground,
    portalWelcomeMessage: DEFAULT_PORTAL_WELCOME_MESSAGE,
    loginTitle: PLATFORM_NAME,
    loginSubtitle: "Monitor clients. Detect risks. Prove value.",
    hidePlatformBranding: false,
  };
}
