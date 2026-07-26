/**
 * FastSpring product path helpers — thin façade over the canonical catalog.
 * Prefer importing from `@/lib/billing/catalog` for new code.
 */

export {
  CANONICAL_PLAN_CATALOG as FASTSPRING_PRODUCT_CATALOG_SOURCE,
  FASTSPRING_PRODUCT_PATHS,
  getCatalogEntryByProductPath as getFastSpringProductCatalogEntry,
  getFastSpringProductPathForPlanKey,
  isEntitlementDrivingFastSpringPlan,
  isFastSpringProductPath,
  isPublicFastSpringProductPath,
  listPrivateCatalogEntries,
  listPublicCatalogEntries,
  mapFastSpringProductPath,
  normalizeFastSpringProductPath,
  type CanonicalPlanCatalogEntry,
  type FastSpringMappedPlan,
  type FastSpringProductPath,
} from "@/lib/billing/catalog";

import {
  CANONICAL_PLAN_CATALOG,
  type CanonicalPlanCatalogEntry,
  type FastSpringProductPath,
  listPublicCatalogEntries,
} from "@/lib/billing/catalog";

/** Compatibility shape used by existing FastSpring test checkout UI. */
export type FastSpringProductVisibility = "public" | "private";

export type FastSpringProductCatalogEntry = {
  path: FastSpringProductPath;
  displayName: string;
  mappedPlan: CanonicalPlanCatalogEntry["internalKey"];
  visibility: FastSpringProductVisibility;
  monthlyPriceUsd: number;
};

export const FASTSPRING_PRODUCT_CATALOG: readonly FastSpringProductCatalogEntry[] =
  CANONICAL_PLAN_CATALOG.map((entry) => ({
    path: entry.productPath,
    displayName: entry.displayName,
    mappedPlan: entry.internalKey,
    visibility: entry.visibility,
    monthlyPriceUsd: entry.fallbackMonthlyUsd,
  }));

export function listPublicFastSpringProductPaths(): FastSpringProductPath[] {
  return listPublicCatalogEntries().map((entry) => entry.productPath);
}

export function listFastSpringTestCheckoutProductPaths(): FastSpringProductPath[] {
  return [...CANONICAL_PLAN_CATALOG.map((entry) => entry.productPath)];
}
