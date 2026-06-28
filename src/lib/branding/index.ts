export { upsertOrganizationBrandingAction, type BrandingActionState } from "./actions";
export { BRANDING_ASSETS } from "./assets";
export {
  getOrganizationBranding,
  getOrganizationBrandingForOrganization,
  getOrganizationBrandingRecord,
} from "./queries";
export { PLATFORM_METADATA } from "./metadata";
export { getPlatformBrandingDefaults } from "./platform-defaults";
export {  DEFAULT_PORTAL_WELCOME_MESSAGE,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  PLATFORM_NAME,
  getCompanyInitial,
  normalizeHexColor,
  resolveOrganizationBranding,
  type ResolvedOrganizationBranding,
} from "./defaults";
