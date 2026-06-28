import type { PlanKey } from "@/lib/billing/plans";

const DEFAULT_VAT_RATE = 0.2;

export function getTaxRateForPlan(_planKey: PlanKey, countryCode = "DE"): number {
  if (countryCode === "DE") {
    return DEFAULT_VAT_RATE;
  }
  return DEFAULT_VAT_RATE;
}

export function calculateTaxAmount(subtotalCents: number, taxRate: number): number {
  return Math.round(subtotalCents * taxRate);
}

export function calculateTotalWithTax(subtotalCents: number, taxRate: number): number {
  return subtotalCents + calculateTaxAmount(subtotalCents, taxRate);
}

export function formatTaxLabel(taxRate: number): string {
  return `VAT (${Math.round(taxRate * 100)}%)`;
}
