/**
 * Operator sales invoice visual acceptance — in-memory only.
 * No DB writes, no Mollie calls, no invoice sequence allocation, no accounting mutation.
 * Uses the same tax engine and domain record shape as production issuance.
 *
 * Scenarios: DE domestic, FR/NL EU B2B RC, US/CH/GB/JP/KR/CA/AU NON_EU_B2B
 * (synthetic validated fixtures; zero production numbers).
 */

import "server-only";

import { getPlanByKey, type PlanKey } from "@/lib/billing/plans";
import type { SalesInvoiceRecord } from "@/lib/billing/sales-invoice";
import { buildSellerInvoiceSnapshot, getSellerTaxConfiguration } from "@/lib/billing/seller-tax-config";
import { buildTaxDecisionEvidenceSnapshot } from "@/lib/billing/tax-decision-evidence";
import { determineTaxPolicy } from "@/lib/billing/tax-policy";
import { calculateVatInclusiveBreakdown } from "@/lib/billing/taxes";
import { resolveReverseChargeLegend } from "@/lib/billing/reverse-charge-legend";
import { resolveNonEuB2bLegend } from "@/lib/billing/non-eu-b2b-legend";
import { resolveVatIdTechnicalState } from "@/lib/billing/vat-id-status";
import { OPERATOR_TEST_DOCUMENT_INDICATOR } from "@/lib/billing/sales-invoice-test-marker";
import {
  buildCustomerSalesInvoiceLineDescription,
  buildGermanDomesticVatTaxNote,
} from "@/lib/billing/sales-invoice-customer-copy";

/** Synthetic org id — never persisted; must not appear in Billing history queries. */
export const PREVIEW_ORGANIZATION_ID = "00000000-0000-4000-8000-000000PREVIEW";

/** Fixed C1.5 Business visual-acceptance invoice number (ephemeral; not from sequence). */
export const OPERATOR_VISUAL_ACCEPTANCE_INVOICE_NUMBER = "TEST-ANX-2026-000001";

export const OPERATOR_VISUAL_ACCEPTANCE_BUYER = {
  legalName: "Auroranexis Invoice Test GmbH",
  addressLine1: "Musterstraße 10",
  postalCode: "68159",
  city: "Mannheim",
  countryCode: "DE",
  vatId: "DE123456789",
  billingEmail: "invoice-test@auroranexis.invalid",
} as const;

/** Synthetic FR EU B2B reverse-charge fixture — VIES treated as valid for preview only. */
export const OPERATOR_PREVIEW_BUYER_FR_RC = {
  legalName: "Auroranexis Invoice Test SARL",
  addressLine1: "10 Rue de Rivoli",
  postalCode: "75001",
  city: "Paris",
  countryCode: "FR",
  vatId: "FR12345678901",
  billingEmail: "invoice-test-fr@auroranexis.invalid",
} as const;

/** Synthetic NL EU B2B reverse-charge fixture — VIES treated as valid for preview only. */
export const OPERATOR_PREVIEW_BUYER_NL_RC = {
  legalName: "Auroranexis Invoice Test B.V.",
  addressLine1: "Damrak 1",
  postalCode: "1012 LG",
  city: "Amsterdam",
  countryCode: "NL",
  vatId: "NL123456789B01",
  billingEmail: "invoice-test-nl@auroranexis.invalid",
} as const;

/** Synthetic NON_EU_B2B fixtures — no VIES; VAT ID optional / omitted. */
export const OPERATOR_PREVIEW_BUYER_US = {
  legalName: "Auroranexis Invoice Test Inc.",
  addressLine1: "1 Market Street",
  postalCode: "94105",
  city: "San Francisco",
  countryCode: "US",
  vatId: null as string | null,
  billingEmail: "invoice-test-us@auroranexis.invalid",
} as const;

export const OPERATOR_PREVIEW_BUYER_CH = {
  legalName: "Auroranexis Invoice Test AG",
  addressLine1: "Bahnhofstrasse 1",
  postalCode: "8001",
  city: "Zürich",
  countryCode: "CH",
  vatId: null as string | null,
  billingEmail: "invoice-test-ch@auroranexis.invalid",
} as const;

export const OPERATOR_PREVIEW_BUYER_GB = {
  legalName: "Auroranexis Invoice Test Ltd",
  addressLine1: "1 King William Street",
  postalCode: "EC4N 7AF",
  city: "London",
  countryCode: "GB",
  vatId: null as string | null,
  billingEmail: "invoice-test-gb@auroranexis.invalid",
} as const;

export const OPERATOR_PREVIEW_BUYER_JP = {
  legalName: "Auroranexis Invoice Test KK",
  addressLine1: "1-1 Marunouchi",
  postalCode: "100-0005",
  city: "Tokyo",
  countryCode: "JP",
  vatId: null as string | null,
  billingEmail: "invoice-test-jp@auroranexis.invalid",
} as const;

export const OPERATOR_PREVIEW_BUYER_KR = {
  legalName: "Auroranexis Invoice Test Co., Ltd.",
  addressLine1: "123 Teheran-ro",
  postalCode: "06133",
  city: "Seoul",
  countryCode: "KR",
  vatId: null as string | null,
  billingEmail: "invoice-test-kr@auroranexis.invalid",
} as const;

export const OPERATOR_PREVIEW_BUYER_CA = {
  legalName: "Auroranexis Invoice Test Corp.",
  addressLine1: "100 King Street West",
  postalCode: "M5X 1A9",
  city: "Toronto",
  countryCode: "CA",
  vatId: null as string | null,
  billingEmail: "invoice-test-ca@auroranexis.invalid",
} as const;

export const OPERATOR_PREVIEW_BUYER_AU = {
  legalName: "Auroranexis Invoice Test Pty Ltd",
  addressLine1: "1 Martin Place",
  postalCode: "2000",
  city: "Sydney",
  countryCode: "AU",
  vatId: null as string | null,
  billingEmail: "invoice-test-au@auroranexis.invalid",
} as const;

export const PREVIEW_BUYER_LEGAL_NAME = OPERATOR_VISUAL_ACCEPTANCE_BUYER.legalName;
export const PREVIEW_PAYMENT_REFERENCE = "tr_TEST_VISUAL_ACCEPTANCE_NONPRODUCTION";

export { OPERATOR_TEST_DOCUMENT_INDICATOR };

export type PreviewSalesInvoicePlanKey = Extract<PlanKey, "professional" | "business">;

/** Operator visual-acceptance tax scenarios (zero-write). */
export type PreviewSalesInvoiceScenario =
  | "de"
  | "fr"
  | "nl"
  | "us"
  | "ch"
  | "gb"
  | "jp"
  | "kr"
  | "ca"
  | "au";

const NON_EU_PREVIEW_SCENARIOS = new Set<PreviewSalesInvoiceScenario>([
  "us",
  "ch",
  "gb",
  "jp",
  "kr",
  "ca",
  "au",
]);

export type PreviewSalesInvoiceResult = {
  invoice: SalesInvoiceRecord;
  sellerConfig: ReturnType<typeof getSellerTaxConfiguration>;
  isPreview: true;
  scenario: PreviewSalesInvoiceScenario;
};

export function resolvePreviewScenario(
  value: string | null | undefined,
): PreviewSalesInvoiceScenario {
  const normalized = (value ?? "de").trim().toLowerCase();
  if (normalized === "fr" || normalized === "fr_eu_b2b_rc") return "fr";
  if (normalized === "nl" || normalized === "nl_eu_b2b_rc") return "nl";
  if (NON_EU_PREVIEW_SCENARIOS.has(normalized as PreviewSalesInvoiceScenario)) {
    return normalized as PreviewSalesInvoiceScenario;
  }
  return "de";
}

function previewBuyerForScenario(scenario: PreviewSalesInvoiceScenario) {
  switch (scenario) {
    case "fr":
      return OPERATOR_PREVIEW_BUYER_FR_RC;
    case "nl":
      return OPERATOR_PREVIEW_BUYER_NL_RC;
    case "us":
      return OPERATOR_PREVIEW_BUYER_US;
    case "ch":
      return OPERATOR_PREVIEW_BUYER_CH;
    case "gb":
      return OPERATOR_PREVIEW_BUYER_GB;
    case "jp":
      return OPERATOR_PREVIEW_BUYER_JP;
    case "kr":
      return OPERATOR_PREVIEW_BUYER_KR;
    case "ca":
      return OPERATOR_PREVIEW_BUYER_CA;
    case "au":
      return OPERATOR_PREVIEW_BUYER_AU;
    default:
      return OPERATOR_VISUAL_ACCEPTANCE_BUYER;
  }
}

function previewViesStatus(
  scenario: PreviewSalesInvoiceScenario,
): "valid" | "not_checked" | "skipped" {
  if (scenario === "de") return "not_checked";
  if (scenario === "fr" || scenario === "nl") return "valid";
  return "skipped";
}

function buildPreviewTaxNote(input: {
  taxPolicyOutcome: SalesInvoiceRecord["taxPolicyOutcome"];
  vatRateBps: number;
  reverseChargeLegendStatus: ReturnType<typeof determineTaxPolicy>["reverseChargeLegendStatus"];
}): string | null {
  const germanDomestic = buildGermanDomesticVatTaxNote(input);
  if (germanDomestic) {
    return germanDomestic;
  }
  if (input.taxPolicyOutcome === "REVERSE_CHARGE") {
    const legend = resolveReverseChargeLegend({
      taxPolicyOutcome: input.taxPolicyOutcome,
      reverseChargeLegendStatus: input.reverseChargeLegendStatus,
      locale: "en",
    });
    return legend.showOnInvoice ? legend.legendText : null;
  }
  if (input.taxPolicyOutcome === "NON_EU_B2B_PLACE_OF_SUPPLY") {
    const legend = resolveNonEuB2bLegend({
      taxPolicyOutcome: input.taxPolicyOutcome,
      reverseChargeLegendStatus: input.reverseChargeLegendStatus,
    });
    return legend.showOnInvoice ? legend.legendText : null;
  }
  return null;
}

function currentUtcBillingPeriod(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function previewInvoiceNumber(
  planKey: PreviewSalesInvoicePlanKey,
  scenario: PreviewSalesInvoiceScenario,
): string {
  const suffix = planKey === "business" ? "000001" : "PRO-000001";
  if (scenario === "de") {
    return planKey === "business"
      ? OPERATOR_VISUAL_ACCEPTANCE_INVOICE_NUMBER
      : "TEST-ANX-2026-PRO-000001";
  }
  return `TEST-ANX-2026-${scenario.toUpperCase()}-${suffix}`;
}

/**
 * Build an in-memory sales invoice for operator visual acceptance.
 * Never persists to sales_invoices, never allocates production invoice numbers,
 * never calls Mollie, never mutates subscription/entitlement/tax evidence stores.
 */
export function buildPreviewSalesInvoice(
  planKey: PreviewSalesInvoicePlanKey = "business",
  scenario: PreviewSalesInvoiceScenario = "de",
): PreviewSalesInvoiceResult {
  const plan = getPlanByKey(planKey);
  const sellerConfig = getSellerTaxConfiguration();
  const sellerSnapshot = buildSellerInvoiceSnapshot();
  const now = new Date().toISOString();
  const period = currentUtcBillingPeriod();
  const buyer = previewBuyerForScenario(scenario);
  const viesStatus = previewViesStatus(scenario);

  const determination = determineTaxPolicy({
    customerCountryCode: buyer.countryCode,
    vatId: buyer.vatId,
    viesStatus,
    isB2bEntrepreneurConfirmed: true,
  });

  if (determination.blocksCheckout || determination.outcome === "UNKNOWN_BLOCK_CHECKOUT") {
    throw new Error(
      `Preview scenario "${scenario}" cannot build invoice — tax determination blocked (${determination.reasonCode})`,
    );
  }

  const breakdown = calculateVatInclusiveBreakdown({
    grossMinor: plan.amountMinor,
    determination,
  });

  const vatTechnicalState = resolveVatIdTechnicalState({
    vatId: buyer.vatId,
    viesStatus,
  });

  const taxDecisionEvidence = buildTaxDecisionEvidenceSnapshot({
    organizationId: PREVIEW_ORGANIZATION_ID,
    decidedAt: now,
    buyerLegalName: buyer.legalName,
    buyerCountryCode: buyer.countryCode,
    buyerVatIdNormalized: buyer.vatId,
    vatTechnicalState,
    viesStatus,
    viesCheckedAt: scenario === "fr" || scenario === "nl" ? now : null,
    businessClassification: determination.businessClassification,
    determination,
    sellerSnapshot,
    planKey: plan.key,
    catalogAmountMinor: plan.amountMinor,
    currency: plan.currency,
    priceVersion: plan.priceVersion,
  });

  const taxNote = buildPreviewTaxNote({
    taxPolicyOutcome: breakdown.outcome,
    vatRateBps: breakdown.vatRateBps,
    reverseChargeLegendStatus: determination.reverseChargeLegendStatus,
  });

  const productName = buildCustomerSalesInvoiceLineDescription(plan.name);

  const invoice: SalesInvoiceRecord = {
    id: `preview-ephemeral-visual-acceptance-${scenario}`,
    organizationId: PREVIEW_ORGANIZATION_ID,
    invoiceNumber: previewInvoiceNumber(planKey, scenario),
    status: "issued",
    currency: plan.currency,
    netMinor: breakdown.netMinor,
    vatRateBps: breakdown.vatRateBps,
    vatMinor: breakdown.vatMinor,
    grossMinor: breakdown.grossMinor,
    taxPolicyOutcome: breakdown.outcome,
    businessClassification: determination.businessClassification,
    reverseChargeApplied: breakdown.outcome === "REVERSE_CHARGE",
    billingPeriodStart: period.start,
    billingPeriodEnd: period.end,
    molliePaymentId: PREVIEW_PAYMENT_REFERENCE,
    providerTransactionId: PREVIEW_PAYMENT_REFERENCE,
    buyerLegalName: buyer.legalName,
    buyerVatId: buyer.vatId,
    buyerCountryCode: buyer.countryCode,
    buyerAddressLine1: buyer.addressLine1,
    buyerAddressLine2: null,
    buyerPostalCode: buyer.postalCode,
    buyerCity: buyer.city,
    buyerBillingEmail: buyer.billingEmail,
    sellerSnapshot,
    taxDecisionEvidence,
    issuedAt: now,
    lines: [
      {
        description: productName,
        quantity: 1,
        unitGrossMinor: breakdown.grossMinor,
        lineGrossMinor: breakdown.grossMinor,
        lineNetMinor: breakdown.netMinor,
        lineVatMinor: breakdown.vatMinor,
      },
    ],
    taxNote,
    createdAt: now,
  };

  return { invoice, sellerConfig, isPreview: true, scenario };
}
