import type { InternalPlan } from "@/lib/billing/provider-types";
import { isInternalPlan } from "@/lib/billing/provider-types";

/**
 * FastSpring product paths configured for Auroranexis.
 * External paths must remain exact (including `founding-member`).
 */
export const FASTSPRING_PRODUCT_PATHS = [
  "professional",
  "business",
  "enterprise",
  "pilot-client",
  "founding-member",
] as const;

export type FastSpringProductPath = (typeof FASTSPRING_PRODUCT_PATHS)[number];

/** Commercial / program keys mapped from FastSpring product paths. */
export type FastSpringMappedPlan = InternalPlan | "pilot" | "founding";

export type FastSpringProductVisibility = "public" | "private";

export type FastSpringProductCatalogEntry = {
  path: FastSpringProductPath;
  /** Customer-facing label for Auroranexis UI. */
  displayName: string;
  mappedPlan: FastSpringMappedPlan;
  visibility: FastSpringProductVisibility;
  /** Catalog list price in USD major units — display only; FastSpring owns checkout pricing. */
  monthlyPriceUsd: number;
};

/**
 * Canonical FastSpring catalog for Auroranexis.
 * Prices mirror the FastSpring store configuration for operator reference only.
 */
export const FASTSPRING_PRODUCT_CATALOG: readonly FastSpringProductCatalogEntry[] = [
  {
    path: "professional",
    displayName: "Professional",
    mappedPlan: "professional",
    visibility: "public",
    monthlyPriceUsd: 179,
  },
  {
    path: "business",
    displayName: "Business",
    mappedPlan: "business",
    visibility: "public",
    monthlyPriceUsd: 599,
  },
  {
    path: "enterprise",
    displayName: "Enterprise",
    mappedPlan: "enterprise",
    visibility: "public",
    monthlyPriceUsd: 1799,
  },
  {
    path: "founding-member",
    displayName: "Founding Partner",
    mappedPlan: "founding",
    visibility: "private",
    monthlyPriceUsd: 149,
  },
  {
    path: "pilot-client",
    displayName: "Pilot Client",
    mappedPlan: "pilot",
    visibility: "private",
    monthlyPriceUsd: 109,
  },
] as const;

const PRODUCT_PATH_SET = new Set<string>(FASTSPRING_PRODUCT_PATHS);
const CATALOG_BY_PATH = new Map(
  FASTSPRING_PRODUCT_CATALOG.map((entry) => [entry.path, entry] as const),
);

export function isFastSpringProductPath(value: string): value is FastSpringProductPath {
  return PRODUCT_PATH_SET.has(value.trim().toLowerCase());
}

export function normalizeFastSpringProductPath(
  value: string | null | undefined,
): FastSpringProductPath | null {
  const path = (value ?? "").trim().toLowerCase();
  return isFastSpringProductPath(path) ? path : null;
}

export function getFastSpringProductCatalogEntry(
  productPath: string | null | undefined,
): FastSpringProductCatalogEntry | null {
  const path = normalizeFastSpringProductPath(productPath);
  return path ? (CATALOG_BY_PATH.get(path) ?? null) : null;
}

/**
 * Map a FastSpring product path to the Auroranexis plan/program key.
 * Returns null for unknown paths (fail closed — do not invent).
 */
export function mapFastSpringProductPath(
  productPath: string | null | undefined,
): FastSpringMappedPlan | null {
  return getFastSpringProductCatalogEntry(productPath)?.mappedPlan ?? null;
}

/**
 * True when the mapped plan is a self-serve InternalPlan that may drive
 * organization_subscriptions entitlement-adjacent writes.
 * pilot / founding are recorded on provider_price_id but do not invent new PlanKey entitlements.
 */
export function isEntitlementDrivingFastSpringPlan(
  plan: FastSpringMappedPlan | null,
): plan is InternalPlan {
  return plan !== null && isInternalPlan(plan);
}

/** Public catalog paths only — never expose private Pilot/Founding on public pricing. */
export function listPublicFastSpringProductPaths(): FastSpringProductPath[] {
  return FASTSPRING_PRODUCT_CATALOG.filter((entry) => entry.visibility === "public").map(
    (entry) => entry.path,
  );
}

/** Full allowlist for owner/admin FastSpring test checkout. */
export function listFastSpringTestCheckoutProductPaths(): FastSpringProductPath[] {
  return [...FASTSPRING_PRODUCT_PATHS];
}
