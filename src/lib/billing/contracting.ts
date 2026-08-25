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
  /** Explicit recurring disclosure for pre-payment review. */
  recurringLabel: string;
  priceVersion: string;
  sellerName: string;
  /** Authenticated organization display / legal contracting name. */
  organizationName: string;
  pspName: "Mollie";
  termsVersion: string;
  dpaVersion: string;
  /**
   * Neutral tax status for display. Must not invent reverse-charge / 0% / VAT-included
   * outcomes until determination has run server-side.
   */
  taxOutcomeLabel: string;
};

export function buildCheckoutContractSummary(input: {
  planKey: string;
  planName: string;
  currency: string;
  amountMinor: number;
  priceVersion: string;
  sellerName: string;
  organizationName: string;
  taxOutcomeLabel?: string;
}): CheckoutContractSummary {
  return {
    planKey: input.planKey,
    planName: input.planName,
    currency: input.currency,
    amountMinor: input.amountMinor,
    billingInterval: "month",
    recurringLabel: "Recurring monthly subscription (renews until cancelled)",
    priceVersion: input.priceVersion,
    sellerName: input.sellerName,
    organizationName: input.organizationName.trim() || "Organization",
    pspName: "Mollie",
    termsVersion: TERMS_DOCUMENT_VERSION,
    dpaVersion: DPA_DOCUMENT_VERSION,
    taxOutcomeLabel:
      input.taxOutcomeLabel ??
      "Tax treatment is confirmed at checkout from billing country and VAT details (when provided)",
  };
}

/**
 * Snapshot plan/price into document_version for audit (no extra PII columns).
 * Format: termsVersion:priceVersion:planKey:amountMinor:currency
 */
export function buildCheckoutContractSummaryAcceptanceEvidence(input: {
  acceptedAt?: string;
  source: ContractAcceptanceEvidence["source"];
  userAgent?: string | null;
  planKey: string;
  priceVersion: string;
  amountMinor: number;
  currency: string;
}): ContractAcceptanceEvidence {
  return {
    kind: "checkout_contract_summary",
    documentVersion: `${TERMS_DOCUMENT_VERSION}:${input.priceVersion}:${input.planKey}:${input.amountMinor}:${input.currency}`,
    accepted: true,
    acceptedAt: input.acceptedAt ?? new Date().toISOString(),
    source: input.source,
    userAgent: input.userAgent ?? null,
  };
}

/** Neutral B2B purchase acknowledgement — factual, no consumer-rights waiver claim. */
export const B2B_PURCHASE_ACKNOWLEDGEMENT_LABEL =
  "I confirm that I am purchasing Auroranexis for business or professional purposes on behalf of the organization shown above." as const;
