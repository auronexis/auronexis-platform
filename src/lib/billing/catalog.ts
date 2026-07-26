import type { InternalPlan } from "@/lib/billing/provider-types";
import type { PlanKey } from "@/lib/billing/plans";

/**
 * Canonical commercial catalog for Auroranexis ↔ FastSpring.
 *
 * FastSpring Product Path is the external identifier (not a Stripe/Paddle price ID).
 * Base USD amounts are fallback display only — FastSpring owns localized checkout pricing.
 */

export const FASTSPRING_PRODUCT_PATHS = [
  "professional",
  "business",
  "enterprise",
  "founding-member",
  "pilot-client",
] as const;

export type FastSpringProductPath = (typeof FASTSPRING_PRODUCT_PATHS)[number];

/** Commercial / program keys mapped from FastSpring product paths. */
export type FastSpringMappedPlan = InternalPlan | "pilot" | "founding";

export type CatalogVisibility = "public" | "private";

export type CanonicalPlanCatalogEntry = {
  /** Internal program / plan key used in Auroranexis. */
  internalKey: FastSpringMappedPlan;
  /** FastSpring product path (exact store catalog identifier). */
  productPath: FastSpringProductPath;
  displayName: string;
  visibility: CatalogVisibility;
  /** Fallback base USD monthly amount when FastSpring Price API is unavailable. */
  fallbackMonthlyUsd: number;
  /** Self-serve PlanKey for entitlement-driving commercial plans; null for invite-only programs. */
  planKey: Extract<PlanKey, "professional" | "business" | "enterprise"> | null;
  description: string;
  highlights: readonly string[];
  recommended?: boolean;
};

export const CANONICAL_PLAN_CATALOG: readonly CanonicalPlanCatalogEntry[] = [
  {
    internalKey: "professional",
    productPath: "professional",
    displayName: "Professional",
    visibility: "public",
    fallbackMonthlyUsd: 179,
    planKey: "professional",
    description: "For growing agencies starting with automation and client portal delivery.",
    highlights: [
      "Up to 25 clients",
      "Automation workflows",
      "Client portal",
      "Integrations",
      "Report templates and scheduling",
      "AI report assistant",
    ],
  },
  {
    internalKey: "business",
    productPath: "business",
    displayName: "Business",
    visibility: "public",
    fallbackMonthlyUsd: 599,
    planKey: "business",
    recommended: true,
    description: "For established agencies with compliance, white-label, and higher limits.",
    highlights: [
      "Higher client and seat limits",
      "White label branding",
      "Compliance center",
      "Risk and incident management",
      "Automation engine",
      "Advanced AI knowledge features",
    ],
  },
  {
    internalKey: "enterprise",
    productPath: "enterprise",
    displayName: "Enterprise",
    visibility: "public",
    fallbackMonthlyUsd: 1799,
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
  },
  {
    internalKey: "founding",
    productPath: "founding-member",
    displayName: "Founding Partner",
    visibility: "private",
    fallbackMonthlyUsd: 149,
    planKey: null,
    description: "Invite-only founding partner program.",
    highlights: ["Controlled onboarding", "Founding partner pricing"],
  },
  {
    internalKey: "pilot",
    productPath: "pilot-client",
    displayName: "Pilot Client",
    visibility: "private",
    fallbackMonthlyUsd: 109,
    planKey: null,
    description: "Invite-only pilot program.",
    highlights: ["Controlled onboarding", "Pilot pricing"],
  },
] as const;

const BY_PATH = new Map(CANONICAL_PLAN_CATALOG.map((e) => [e.productPath, e] as const));
const BY_INTERNAL = new Map(CANONICAL_PLAN_CATALOG.map((e) => [e.internalKey, e] as const));
const BY_PLAN_KEY = new Map(
  CANONICAL_PLAN_CATALOG.filter((e) => e.planKey).map((e) => [e.planKey!, e] as const),
);
const PATH_SET = new Set<string>(FASTSPRING_PRODUCT_PATHS);

export function isFastSpringProductPath(value: string): value is FastSpringProductPath {
  return PATH_SET.has(value.trim().toLowerCase());
}

export function normalizeFastSpringProductPath(
  value: string | null | undefined,
): FastSpringProductPath | null {
  const path = (value ?? "").trim().toLowerCase();
  return isFastSpringProductPath(path) ? path : null;
}

export function getCatalogEntryByProductPath(
  productPath: string | null | undefined,
): CanonicalPlanCatalogEntry | null {
  const path = normalizeFastSpringProductPath(productPath);
  return path ? (BY_PATH.get(path) ?? null) : null;
}

export function getCatalogEntryByInternalKey(
  internalKey: string | null | undefined,
): CanonicalPlanCatalogEntry | null {
  if (!internalKey) return null;
  return BY_INTERNAL.get(internalKey as FastSpringMappedPlan) ?? null;
}

export function getCatalogEntryByPlanKey(
  planKey: PlanKey | string | null | undefined,
): CanonicalPlanCatalogEntry | null {
  if (!planKey) return null;
  return BY_PLAN_KEY.get(planKey as "professional" | "business" | "enterprise") ?? null;
}

export function mapFastSpringProductPath(
  productPath: string | null | undefined,
): FastSpringMappedPlan | null {
  return getCatalogEntryByProductPath(productPath)?.internalKey ?? null;
}

export function getFastSpringProductPathForPlanKey(
  planKey: Extract<PlanKey, "professional" | "business" | "enterprise">,
): FastSpringProductPath {
  const entry = getCatalogEntryByPlanKey(planKey);
  if (!entry) {
    throw new Error(`No FastSpring product path for plan: ${planKey}`);
  }
  return entry.productPath;
}

export function listPublicCatalogEntries(): CanonicalPlanCatalogEntry[] {
  return CANONICAL_PLAN_CATALOG.filter((e) => e.visibility === "public");
}

export function listPrivateCatalogEntries(): CanonicalPlanCatalogEntry[] {
  return CANONICAL_PLAN_CATALOG.filter((e) => e.visibility === "private");
}

export function isPublicFastSpringProductPath(path: FastSpringProductPath): boolean {
  return getCatalogEntryByProductPath(path)?.visibility === "public";
}

export function isEntitlementDrivingFastSpringPlan(
  plan: FastSpringMappedPlan | null,
): plan is InternalPlan {
  return plan === "professional" || plan === "business" || plan === "enterprise";
}
