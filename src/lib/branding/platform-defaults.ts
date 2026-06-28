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
    logoUrl: BRANDING_ASSETS.logoHorizontal,
    logoLightUrl: BRANDING_ASSETS.logoHorizontal,
    logoDarkUrl: BRANDING_ASSETS.logoHorizontal,
    logoHorizontalUrl: BRANDING_ASSETS.logoHorizontal,
    iconUrl: BRANDING_ASSETS.logoHorizontal,
    faviconUrl: BRANDING_ASSETS.favicon,
    loginBackgroundUrl: BRANDING_ASSETS.loginBackground,
    portalWelcomeMessage: DEFAULT_PORTAL_WELCOME_MESSAGE,
    loginTitle: PLATFORM_NAME,
    loginSubtitle: "Monitor clients. Detect risks. Prove value.",
    hidePlatformBranding: false,
  };
}
