export type {
  EntitlementCheckResult,
  EntitlementFeatureKey,
  EntitlementLimitKey,
  EntitlementsUsageSummary,
  EntitlementUsageSnapshot,
  PlanEntitlements,
  ResolvedEntitlements,
} from "@/lib/entitlements/types";

export {
  ENTITLEMENT_FEATURE_LABELS,
  ENTITLEMENT_LIMIT_LABELS,
  MINIMAL_ACCESS_FEATURES,
  PLAN_ENTITLEMENTS,
  formatEntitlementFeatureLabels,
  getEntitlementsForPlan,
  getNumericLimit,
  isFeatureEnabled,
  isUnlimited,
} from "@/lib/entitlements/definitions";

export {
  UPGRADE_PLANS_HREF,
  formatFeatureDeniedMessage,
  formatInactiveSubscriptionMessage,
  formatLimitReachedMessage,
} from "@/lib/entitlements/messages";

export {
  canCreateClient,
  canGenerateReport,
  canInviteSeat,
  getEntitlementsUsageSummary,
  requireFeatureAccess,
  requireLimitAvailable,
  requirePaidEntitlementAccess,
  resolveEntitlementsForOrganization,
} from "@/lib/entitlements/checks";
