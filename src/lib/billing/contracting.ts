/**
 * B2B contracting + Terms / DPA acceptance evidence.
 * Checkboxes must not be pre-checked. Version strings are persisted for audit.
 *
 * DPA body text for countersigned Art. 28 remains counsel-dependent —
 * LEGAL_TEXT_PENDING_COUNSEL is internal-only and never shown publicly.
 */

export const TERMS_DOCUMENT_VERSION = "terms-2026-08-23" as const;
export const DPA_DOCUMENT_VERSION = "dpa-summary-2026-08-23" as const;

/** INTERNAL ONLY — do not render on customer UI. */
export const DPA_FULL_TEXT_STATUS = "LEGAL_TEXT_PENDING_COUNSEL" as const;

export type ContractAcceptanceKind =
  | "terms"
  | "b2b_entrepreneur"
  | "dpa"
  | "checkout_contract_summary";

export type ContractAcceptanceEvidence = {
  kind: ContractAcceptanceKind;
  documentVersion: string;
  accepted: true;
  acceptedAt: string;
  source: "signup" | "checkout" | "settings";
  userAgent?: string | null;
};

export function buildTermsAcceptanceEvidence(input: {
  acceptedAt?: string;
  source: ContractAcceptanceEvidence["source"];
  userAgent?: string | null;
}): ContractAcceptanceEvidence {
  return {
    kind: "terms",
    documentVersion: TERMS_DOCUMENT_VERSION,
    accepted: true,
    acceptedAt: input.acceptedAt ?? new Date().toISOString(),
    source: input.source,
    userAgent: input.userAgent ?? null,
  };
}

export function buildB2bEntrepreneurAcceptanceEvidence(input: {
  acceptedAt?: string;
  source: ContractAcceptanceEvidence["source"];
  userAgent?: string | null;
}): ContractAcceptanceEvidence {
  return {
    kind: "b2b_entrepreneur",
    documentVersion: TERMS_DOCUMENT_VERSION,
    accepted: true,
    acceptedAt: input.acceptedAt ?? new Date().toISOString(),
    source: input.source,
    userAgent: input.userAgent ?? null,
  };
}

export function buildDpaAcceptanceEvidence(input: {
  acceptedAt?: string;
  source: ContractAcceptanceEvidence["source"];
  userAgent?: string | null;
}): ContractAcceptanceEvidence {
  return {
    kind: "dpa",
    documentVersion: DPA_DOCUMENT_VERSION,
    accepted: true,
    acceptedAt: input.acceptedAt ?? new Date().toISOString(),
    source: input.source,
    userAgent: input.userAgent ?? null,
  };
}

export type CheckoutContractSummary = {
  planKey: string;
  planName: string;
  currency: string;
  amountMinor: number;
  billingInterval: "month";
  priceVersion: string;
  sellerName: string;
  pspName: "Mollie";
  termsVersion: string;
  dpaVersion: string;
  taxOutcomeLabel: string;
};

export function buildCheckoutContractSummary(input: {
  planKey: string;
  planName: string;
  currency: string;
  amountMinor: number;
  priceVersion: string;
  sellerName: string;
  taxOutcomeLabel: string;
}): CheckoutContractSummary {
  return {
    planKey: input.planKey,
    planName: input.planName,
    currency: input.currency,
    amountMinor: input.amountMinor,
    billingInterval: "month",
    priceVersion: input.priceVersion,
    sellerName: input.sellerName,
    pspName: "Mollie",
    termsVersion: TERMS_DOCUMENT_VERSION,
    dpaVersion: DPA_DOCUMENT_VERSION,
    taxOutcomeLabel: input.taxOutcomeLabel,
  };
}
