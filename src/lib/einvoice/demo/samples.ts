/**
 * Synthetic DEMO samples — not production invoices, not ANX-* numbers, not legal.
 * No production PII; seller VAT mirrors public company register data already in repo.
 */

import type { IssuedInvoiceSnapshot } from "@/lib/einvoice/types";

const DEMO_SELLER: IssuedInvoiceSnapshot["seller"] = {
  legalName: "Auroranexis AI Solutions",
  vatId: "DE449657077",
  countryCode: "DE",
  street: "Im Malerwinkel 4",
  postalCode: "71566",
  city: "Althütte",
  addressLines: ["Im Malerwinkel 4", "71566 Althütte", "Germany"],
};

/** DE B2B domestic 19% VAT — TEST-EINV-2026-000001 */
export function buildDemoDomesticIssuedSnapshot(): IssuedInvoiceSnapshot {
  return {
    invoiceNumber: "TEST-EINV-2026-000001",
    status: "issued",
    currency: "EUR",
    netMinor: 50_336,
    vatRateBps: 1900,
    vatMinor: 9_564,
    grossMinor: 59_900,
    taxPolicyOutcome: "STANDARD_DOMESTIC_VAT",
    reverseChargeApplied: false,
    businessClassification: "DOMESTIC_B2B",
    billingPeriodStart: "2026-08-01",
    billingPeriodEnd: "2026-08-31",
    issuedAt: "2026-08-31T10:00:00.000Z",
    createdAt: "2026-08-31T10:00:00.000Z",
    taxNote: "German VAT (19%)",
    seller: { ...DEMO_SELLER },
    buyer: {
      legalName: "Demo GmbH (Synthetic)",
      vatId: "DE111111111",
      countryCode: "DE",
      addressLine1: "Musterstraße 1",
      addressLine2: null,
      postalCode: "10115",
      city: "Berlin",
      billingEmail: "demo-billing@example.test",
    },
    lines: [
      {
        description: "Auroranexis Business — DEMO subscription (synthetic)",
        quantity: 1,
        unitGrossMinor: 59_900,
        lineGrossMinor: 59_900,
        lineNetMinor: 50_336,
        lineVatMinor: 9_564,
      },
    ],
    demoNotLegal: true,
  };
}

/** EU B2B Reverse Charge — TEST-EINV-RC-2026-000001 */
export function buildDemoReverseChargeIssuedSnapshot(): IssuedInvoiceSnapshot {
  return {
    invoiceNumber: "TEST-EINV-RC-2026-000001",
    status: "issued",
    currency: "EUR",
    netMinor: 59_900,
    vatRateBps: 0,
    vatMinor: 0,
    grossMinor: 59_900,
    taxPolicyOutcome: "REVERSE_CHARGE",
    reverseChargeApplied: true,
    businessClassification: "EU_CROSS_BORDER_B2B_CANDIDATE",
    billingPeriodStart: "2026-08-01",
    billingPeriodEnd: "2026-08-31",
    issuedAt: "2026-08-31T11:00:00.000Z",
    createdAt: "2026-08-31T11:00:00.000Z",
    taxNote:
      "Steuerschuldnerschaft des Leistungsempfängers / Reverse charge — VAT to be accounted for by the recipient.",
    seller: { ...DEMO_SELLER },
    buyer: {
      legalName: "Demo SARL (Synthetic FR)",
      vatId: "FR12345678901",
      countryCode: "FR",
      addressLine1: "10 Rue de Demo",
      addressLine2: null,
      postalCode: "75002",
      city: "Paris",
      billingEmail: "demo-rc@example.test",
    },
    lines: [
      {
        description: "Auroranexis Business — DEMO RC subscription (synthetic)",
        quantity: 1,
        unitGrossMinor: 59_900,
        lineGrossMinor: 59_900,
        lineNetMinor: 59_900,
        lineVatMinor: 0,
      },
    ],
    demoNotLegal: true,
  };
}
