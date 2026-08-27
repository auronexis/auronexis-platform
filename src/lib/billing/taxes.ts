/**
 * Tax calculation — VAT-inclusive catalog totals.
 * Catalog gross = customer total where the tax model permits.
 * Uses integer minor units only (no floating money arithmetic).
 */

import type { PlanKey } from "@/lib/billing/plans";
import {
  DE_STANDARD_VAT_RATE_BPS,
  determineTaxPolicy,
  type TaxDeterminationInput,
  type TaxDeterminationResult,
  type TaxPolicyOutcome,
} from "@/lib/billing/tax-policy";

export type VatInclusiveBreakdown = {
  grossMinor: number;
  netMinor: number;
  vatMinor: number;
  vatRateBps: number;
  outcome: TaxPolicyOutcome;
};

/**
 * Derive net + VAT from a VAT-inclusive gross and rate in basis points.
 * net = round(gross * 10000 / (10000 + rateBps)); vat = gross - net.
 */
export function splitVatInclusiveGross(input: {
  grossMinor: number;
  vatRateBps: number;
}): { netMinor: number; vatMinor: number } {
  const { grossMinor, vatRateBps } = input;
  if (!Number.isInteger(grossMinor) || grossMinor < 0) {
    throw new Error("grossMinor must be a non-negative integer");
  }
  if (!Number.isInteger(vatRateBps) || vatRateBps < 0) {
    throw new Error("vatRateBps must be a non-negative integer");
  }
  if (vatRateBps === 0) {
    return { netMinor: grossMinor, vatMinor: 0 };
  }
  const denominator = 10_000 + vatRateBps;
  const netMinor = Math.round((grossMinor * 10_000) / denominator);
  const vatMinor = grossMinor - netMinor;
  return { netMinor, vatMinor };
}

export function calculateVatInclusiveBreakdown(input: {
  grossMinor: number;
  determination: TaxDeterminationResult;
}): VatInclusiveBreakdown {
  if (input.determination.outcome === "UNKNOWN_BLOCK_CHECKOUT") {
    throw new Error("Cannot calculate tax for UNKNOWN_BLOCK_CHECKOUT");
  }
  if (input.determination.outcome === "MANUAL_REVIEW") {
    throw new Error("Cannot calculate tax for MANUAL_REVIEW without adviser decision");
  }
  if (input.determination.outcome === "REVERSE_CHARGE") {
    // 0% charge path — customer legend resolved separately via reverse-charge-legend.
    return {
      grossMinor: input.grossMinor,
      netMinor: input.grossMinor,
      vatMinor: 0,
      vatRateBps: 0,
      outcome: "REVERSE_CHARGE",
    };
  }
  if (
    input.determination.outcome === "ZERO_RATE_IF_LEGALLY_APPLICABLE" ||
    input.determination.outcome === "TAX_EXEMPT_IF_LEGALLY_APPLICABLE"
  ) {
    return {
      grossMinor: input.grossMinor,
      netMinor: input.grossMinor,
      vatMinor: 0,
      vatRateBps: 0,
      outcome: input.determination.outcome,
    };
  }

  const vatRateBps = input.determination.vatRateBps ?? DE_STANDARD_VAT_RATE_BPS;
  const { netMinor, vatMinor } = splitVatInclusiveGross({
    grossMinor: input.grossMinor,
    vatRateBps,
  });
  return {
    grossMinor: input.grossMinor,
    netMinor,
    vatMinor,
    vatRateBps,
    outcome: "STANDARD_DOMESTIC_VAT",
  };
}

/** @deprecated Use determineTaxPolicy + calculateVatInclusiveBreakdown. Never invent non-DE rates. */
export function getTaxRateForPlan(_planKey: PlanKey, countryCode = "DE"): number {
  if (countryCode.toUpperCase() === "DE") {
    return DE_STANDARD_VAT_RATE_BPS / 10_000;
  }
  throw new Error(
    "getTaxRateForPlan refused non-DE country — use determineTaxPolicy (no silent rate invent)",
  );
}

/** @deprecated Prefer calculateVatInclusiveBreakdown with determination. */
export function calculateTaxAmount(subtotalCents: number, taxRate: number): number {
  return Math.round(subtotalCents * taxRate);
}

/** @deprecated Prefer VAT-inclusive split from catalog gross. */
export function calculateTotalWithTax(subtotalCents: number, taxRate: number): number {
  return subtotalCents + calculateTaxAmount(subtotalCents, taxRate);
}

export function formatTaxLabel(taxRate: number): string {
  return `VAT (${Math.round(taxRate * 100)}%)`;
}

export function formatVatRateBpsLabel(vatRateBps: number): string {
  const whole = Math.trunc(vatRateBps / 100);
  const frac = vatRateBps % 100;
  if (frac === 0) return `VAT (${whole}%)`;
  return `VAT (${whole}.${frac.toString().padStart(2, "0")}%)`;
}

export function resolveTaxForCheckout(input: {
  grossMinor: number;
  determinationInput: TaxDeterminationInput;
}): {
  determination: TaxDeterminationResult;
  breakdown: VatInclusiveBreakdown | null;
} {
  const determination = determineTaxPolicy(input.determinationInput);
  if (determination.blocksCheckout) {
    return { determination, breakdown: null };
  }
  return {
    determination,
    breakdown: calculateVatInclusiveBreakdown({
      grossMinor: input.grossMinor,
      determination,
    }),
  };
}
