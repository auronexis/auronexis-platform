import type { InternalPlan } from "@/lib/billing/provider-types";
import type { PlanKey } from "@/lib/billing/plans";
import {
  ACTIVE_EUR_PRICE_VERSION,
  PRIMARY_BILLING_CURRENCY,
  amountMinorToMajorUnits,
  type CatalogBillingCurrency,
} from "@/lib/billing/price-catalog";

/**
 * Canonical commercial catalog for Auroranexis (seller) ↔ Mollie (PSP).
 *
 * Product path identifiers remain stable for historical FastSpring archive mapping.
 * Active list prices are EUR minor units — do not treat historical USD rows as EUR.
 */

export const CATALOG_PRODUCT_PATHS = [
  "professional",
  "business",
  "enterprise",
  "founding-member",
  "pilot-client",
] as const;

/** @deprecated Alias — FastSpring retired; paths kept for archive mapping. */
export const FASTSPRING_PRODUCT_PATHS = CATALOG_PRODUCT_PATHS;

export type CatalogProductPath = (typeof CATALOG_PRODUCT_PATHS)[number];

/** @deprecated Alias — FastSpring retired. */
export type FastSpringProductPath = CatalogProductPath;

/** Commercial / program keys mapped from catalog product paths. */
export type CatalogMappedPlan = InternalPlan | "pilot" | "founding";

/** @deprecated Alias — FastSpring retired. */
export type FastSpringMappedPlan = CatalogMappedPlan;

export type CatalogVisibility = "public" | "private";

export type CanonicalPlanCatalogEntry = {
  /** Internal program / plan key used in Auroranexis. */
  internalKey: CatalogMappedPlan;
  /** Stable product path identifier. */
  productPath: CatalogProductPath;
  displayName: string;
  visibility: CatalogVisibility;
  /** Canonical catalog currency for active list prices. */
  currency: CatalogBillingCurrency;
  /** Gross list amount in integer minor units. */
  amountMinor: number;
  priceVersion: string;
  /**
   * @deprecated Historical FastSpring USD major-unit fallback field.
   * Numeric major units mirror amountMinor/100 for archive modules only —
   * not an FX conversion of live EUR prices.
   */
  fallbackMonthlyUsd: number;
  /** Self-serve PlanKey for entitlement-driving commercial plans; null for invite-only programs. */
  planKey: Extract<PlanKey, "professional" | "business" | "enterprise"> | null;
  description: string;
  highlights: readonly string[];
  recommended?: boolean;
};

function entry(input: {
  internalKey: CatalogMappedPlan;
  productPath: CatalogProductPath;
  displayName: string;
  visibility: CatalogVisibility;
  amountMinor: number;
  planKey: Extract<PlanKey, "professional" | "business" | "enterprise"> | null;
  description: string;
  highlights: readonly string[];
  recommended?: boolean;
}): CanonicalPlanCatalogEntry {
  const major = amountMinorToMajorUnits(input.amountMinor);
  return {
    ...input,
    currency: PRIMARY_BILLING_CURRENCY,
    priceVersion: ACTIVE_EUR_PRICE_VERSION,
    fallbackMonthlyUsd: major,
  };
}

export const CANONICAL_PLAN_CATALOG: readonly CanonicalPlanCatalogEntry[] = [
  entry({
    internalKey: "professional",
    productPath: "professional",
    displayName: "Professional",
    visibility: "public",
    amountMinor: 17_900,
    planKey: "professional",
    description: "For growing agencies with client portal delivery, integrations, automation workflows, and AI-assisted reporting.",
    highlights: [
      "Up to 25 clients",
      "Client portal",
      "Integrations",
      "Automation workflows",
      "Report templates and scheduling",
      "AI report assistant",
      "Profitability tracking",
    ],
  }),
  entry({
    internalKey: "business",
    productPath: "business",
    displayName: "Business",
    visibility: "public",
    amountMinor: 59_900,
    planKey: "business",
    recommended: true,
    description: "For established agencies with compliance, white-label, and higher limits.",
    highlights: [
      "Higher client and seat limits",
      "Automation workflows",
      "White label branding",
      "Compliance center",
      "Risk and incident management",
      "Advanced AI knowledge features",
    ],
  }),
  entry({
    internalKey: "enterprise",
    productPath: "enterprise",
    displayName: "Enterprise",
    visibility: "public",
    amountMinor: 179_900,
    planKey: "enterprise",
    description: "For large portfolios and custom requirements.",
    highlights: [
      "Custom client limits",
      "Dedicated onboarding",
      "Priority support",
      "Plan overrides",
      "Advanced reporting",
      "Enterprise API readiness",
    ],
  }),
  entry({
    internalKey: "founding",
    productPath: "founding-member",
    displayName: "Founding Partner",
    visibility: "private",
    amountMinor: 14_900,
    planKey: null,
    description: "Invite-only founding partner program.",
    highlights: ["Controlled onboarding", "Founding partner pricing"],
  }),
  entry({
    internalKey: "pilot",
    productPath: "pilot-client",
    displayName: "Pilot Client",
    visibility: "private",
    amountMinor: 10_900,
    planKey: null,
    description: "Invite-only pilot program.",
    highlights: ["Controlled onboarding", "Pilot pricing"],
  }),
] as const;

const BY_PATH = new Map(CANONICAL_PLAN_CATALOG.map((e) => [e.productPath, e] as const));
const BY_INTERNAL = new Map(CANONICAL_PLAN_CATALOG.map((e) => [e.internalKey, e] as const));
const BY_PLAN_KEY = new Map(
  CANONICAL_PLAN_CATALOG.filter((e) => e.planKey).map((e) => [e.planKey!, e] as const),
);
const PATH_SET = new Set<string>(CATALOG_PRODUCT_PATHS);

export function isCatalogProductPath(value: string): value is CatalogProductPath {
  return PATH_SET.has(value.trim().toLowerCase());
}

/** @deprecated Prefer isCatalogProductPath. */
export function isFastSpringProductPath(value: string): value is FastSpringProductPath {
  return isCatalogProductPath(value);
}

export function normalizeCatalogProductPath(
  value: string | null | undefined,
): CatalogProductPath | null {
  const path = (value ?? "").trim().toLowerCase();
  return isCatalogProductPath(path) ? path : null;
}

/** @deprecated Prefer normalizeCatalogProductPath. */
export function normalizeFastSpringProductPath(
  value: string | null | undefined,
): FastSpringProductPath | null {
  return normalizeCatalogProductPath(value);
}

export function getCatalogEntryByProductPath(
  productPath: string | null | undefined,
): CanonicalPlanCatalogEntry | null {
  const path = normalizeCatalogProductPath(productPath);
  return path ? (BY_PATH.get(path) ?? null) : null;
}

export function getCatalogEntryByInternalKey(
  internalKey: string | null | undefined,
): CanonicalPlanCatalogEntry | null {
  if (!internalKey) return null;
  return BY_INTERNAL.get(internalKey as CatalogMappedPlan) ?? null;
}

export function getCatalogEntryByPlanKey(
  planKey: PlanKey | string | null | undefined,
): CanonicalPlanCatalogEntry | null {
  if (!planKey) return null;
  return BY_PLAN_KEY.get(planKey as "professional" | "business" | "enterprise") ?? null;
}

export function mapCatalogProductPath(
  productPath: string | null | undefined,
): CatalogMappedPlan | null {
  return getCatalogEntryByProductPath(productPath)?.internalKey ?? null;
}

/** @deprecated Prefer mapCatalogProductPath. */
export function mapFastSpringProductPath(
  productPath: string | null | undefined,
): FastSpringMappedPlan | null {
  return mapCatalogProductPath(productPath);
}

export function getCatalogProductPathForPlanKey(
  planKey: Extract<PlanKey, "professional" | "business" | "enterprise">,
): CatalogProductPath {
  const entry = getCatalogEntryByPlanKey(planKey);
  if (!entry) {
    throw new Error(`No catalog product path for plan: ${planKey}`);
  }
  return entry.productPath;
}

/** @deprecated Prefer getCatalogProductPathForPlanKey. */
export function getFastSpringProductPathForPlanKey(
  planKey: Extract<PlanKey, "professional" | "business" | "enterprise">,
): FastSpringProductPath {
  return getCatalogProductPathForPlanKey(planKey);
}

export function listPublicCatalogEntries(): CanonicalPlanCatalogEntry[] {
  return CANONICAL_PLAN_CATALOG.filter((e) => e.visibility === "public");
}

export function listPrivateCatalogEntries(): CanonicalPlanCatalogEntry[] {
  return CANONICAL_PLAN_CATALOG.filter((e) => e.visibility === "private");
}

export function isPublicCatalogProductPath(path: CatalogProductPath): boolean {
  return getCatalogEntryByProductPath(path)?.visibility === "public";
}

/** @deprecated Prefer isPublicCatalogProductPath. */
export function isPublicFastSpringProductPath(path: FastSpringProductPath): boolean {
  return isPublicCatalogProductPath(path);
}

export function isEntitlementDrivingCatalogPlan(
  plan: CatalogMappedPlan | null,
): plan is InternalPlan {
  return plan === "professional" || plan === "business" || plan === "enterprise";
}

/** @deprecated Prefer isEntitlementDrivingCatalogPlan. */
export function isEntitlementDrivingFastSpringPlan(
  plan: FastSpringMappedPlan | null,
): plan is InternalPlan {
  return isEntitlementDrivingCatalogPlan(plan);
}
