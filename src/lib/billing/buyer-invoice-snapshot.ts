/**
 * Immutable buyer identity snapshot for sales invoices.
 * Reuses organization_billing_identities field semantics — no parallel address model.
 */

import type { OrganizationBillingIdentity } from "@/lib/billing/billing-identity";

export type BuyerInvoiceSnapshot = {
  legalName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  vatId: string | null;
  billingEmail: string | null;
};

/** Build a buyer snapshot from current billing identity (issue-time only). */
export function buildBuyerInvoiceSnapshot(
  identity: OrganizationBillingIdentity | null | undefined,
): BuyerInvoiceSnapshot {
  if (!identity) {
    return {
      legalName: null,
      addressLine1: null,
      addressLine2: null,
      postalCode: null,
      city: null,
      countryCode: null,
      vatId: null,
      billingEmail: null,
    };
  }

  return {
    legalName: identity.legalName?.trim() || null,
    addressLine1: identity.addressLine1?.trim() || null,
    addressLine2: identity.addressLine2?.trim() || null,
    postalCode: identity.postalCode?.trim() || null,
    city: identity.city?.trim() || null,
    countryCode: identity.countryCode?.trim().toUpperCase() || null,
    vatId: identity.vatId?.trim() || null,
    billingEmail: identity.billingEmail?.trim() || null,
  };
}

/** Display lines for PDF/HTML — never invents missing historical fields. */
export function formatBuyerInvoiceAddressLines(snapshot: BuyerInvoiceSnapshot): string[] {
  const lines: string[] = [];
  if (snapshot.addressLine1) lines.push(snapshot.addressLine1);
  if (snapshot.addressLine2) lines.push(snapshot.addressLine2);
  const locality = [snapshot.postalCode, snapshot.city].filter(Boolean).join(" ").trim();
  if (locality) lines.push(locality);
  return lines;
}

/**
 * German B2B invoices require complete recipient name + address (§14 UStG).
 * Fail closed — never issue a supported sales invoice with missing Anschrift.
 */
export function getMissingBuyerInvoiceFields(snapshot: BuyerInvoiceSnapshot): string[] {
  const missing: string[] = [];
  if (!snapshot.legalName?.trim()) missing.push("legalName");
  if (!snapshot.addressLine1?.trim()) missing.push("addressLine1");
  if (!snapshot.postalCode?.trim()) missing.push("postalCode");
  if (!snapshot.city?.trim()) missing.push("city");
  if (!snapshot.countryCode?.trim()) missing.push("countryCode");
  return missing;
}

export function isBuyerInvoiceAddressComplete(snapshot: BuyerInvoiceSnapshot): boolean {
  return getMissingBuyerInvoiceFields(snapshot).length === 0;
}
