/**
 * Customer-facing sales invoice copy helpers (C2.1).
 * Presentation only — does not change amounts, catalog, entitlements, or tax engine outcomes.
 */

import { DE_STANDARD_VAT_RATE_BPS, type TaxPolicyOutcome } from "@/lib/billing/tax-policy";

const KNOWN_PLAN_NAMES = ["Professional", "Business", "Enterprise"] as const;

/** Strip internal catalog / price-version markers from customer-visible line text. */
export function stripCatalogVersionFromInvoiceDescription(description: string): string {
  return description.replace(/\s*\(\s*eur-v[^)]*\)/gi, "").trim();
}

/** Canonical customer line for a named SaaS plan. */
export function buildCustomerSalesInvoiceLineDescription(planName: string): string {
  return `Auroranexis ${planName.trim()} — Monthly SaaS subscription`;
}

/**
 * Normalize stored / Mollie product labels into customer-safe invoice line copy.
 * Hides eur-v* catalog versions; maps standard plan subscription/renewal labels.
 * Leaves upgrade / non-plan product labels intact (after version strip).
 */
export function toCustomerVisibleInvoiceLineDescription(rawDescription: string): string {
  const cleaned = stripCatalogVersionFromInvoiceDescription(rawDescription);
  if (!cleaned) return cleaned;

  if (/^Auroranexis\s+.+\s+—\s+Monthly SaaS subscription$/i.test(cleaned)) {
    return cleaned;
  }

  if (/upgrade/i.test(cleaned)) {
    return cleaned;
  }

  for (const planName of KNOWN_PLAN_NAMES) {
    const planPattern = new RegExp(
      `^(?:Auroranexis\\s+)?${planName}\\s*(?:—|-)?\\s*(?:Monthly\\s+)?(?:SaaS\\s+)?(?:subscription|renewal)?$`,
      "i",
    );
    if (planPattern.test(cleaned)) {
      return buildCustomerSalesInvoiceLineDescription(planName);
    }
    if (new RegExp(`^${planName}\\s+(subscription|renewal)$`, "i").test(cleaned)) {
      return buildCustomerSalesInvoiceLineDescription(planName);
    }
  }

  return cleaned;
}

/**
 * Tax note for the existing German domestic 19% path only.
 * Returns null when treatment is not the persisted STANDARD_DOMESTIC_VAT @ 19% path
 * (international / reverse-charge wording stays counsel-gated elsewhere).
 */
export function buildGermanDomesticVatTaxNote(input: {
  taxPolicyOutcome: TaxPolicyOutcome;
  vatRateBps: number;
}): string | null {
  if (
    input.taxPolicyOutcome === "STANDARD_DOMESTIC_VAT" &&
    input.vatRateBps === DE_STANDARD_VAT_RATE_BPS
  ) {
    return "German VAT (19%)";
  }
  return null;
}

/** Resolve customer-visible tax note from persisted invoice facts (no second calc source). */
export function resolveCustomerInvoiceTaxNote(input: {
  taxPolicyOutcome: TaxPolicyOutcome;
  vatRateBps: number;
  taxNote: string | null;
}): string | null {
  const german = buildGermanDomesticVatTaxNote(input);
  if (german) return german;
  return input.taxNote;
}
