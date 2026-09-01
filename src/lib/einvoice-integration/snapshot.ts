/**
 * Read-only projection: issued sales_invoice row → IssuedInvoiceSnapshot for e-invoice pipeline.
 * Copies stored invoice facts only — never recalculates money, VAT, or tax treatment.
 */

import type { SalesInvoiceRecord } from "@/lib/billing/sales-invoice";
import { resolveSellerPostalFields } from "@/lib/einvoice/source-adapter";
import type { IssuedInvoiceSnapshot } from "@/lib/einvoice/types";

export function salesInvoiceRecordToIssuedSnapshot(
  invoice: SalesInvoiceRecord,
): IssuedInvoiceSnapshot {
  const seller = invoice.sellerSnapshot;
  const sellerPostal = seller
    ? resolveSellerPostalFields({
        legalName: seller.legalName,
        vatId: seller.vatId,
        countryCode: seller.countryCode,
        street: null,
        postalCode: null,
        city: null,
        addressLines: seller.addressLines,
      })
    : { street: null, postalCode: null, city: null };

  return {
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    currency: invoice.currency,
    netMinor: invoice.netMinor,
    vatRateBps: invoice.vatRateBps,
    vatMinor: invoice.vatMinor,
    grossMinor: invoice.grossMinor,
    taxPolicyOutcome: invoice.taxPolicyOutcome,
    reverseChargeApplied: invoice.reverseChargeApplied,
    businessClassification: invoice.businessClassification,
    billingPeriodStart: invoice.billingPeriodStart,
    billingPeriodEnd: invoice.billingPeriodEnd,
    issuedAt: invoice.issuedAt,
    createdAt: invoice.createdAt,
    taxNote: invoice.taxNote,
    seller: {
      legalName: seller?.legalName ?? null,
      vatId: seller?.vatId ?? null,
      countryCode: seller?.countryCode ?? null,
      street: sellerPostal.street,
      postalCode: sellerPostal.postalCode,
      city: sellerPostal.city,
      addressLines: seller?.addressLines ?? [],
    },
    buyer: {
      legalName: invoice.buyerLegalName,
      vatId: invoice.buyerVatId,
      countryCode: invoice.buyerCountryCode,
      addressLine1: invoice.buyerAddressLine1,
      addressLine2: invoice.buyerAddressLine2,
      postalCode: invoice.buyerPostalCode,
      city: invoice.buyerCity,
      billingEmail: invoice.buyerBillingEmail,
    },
    lines: invoice.lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitGrossMinor: line.unitGrossMinor,
      lineGrossMinor: line.lineGrossMinor,
      lineNetMinor: line.lineNetMinor,
      lineVatMinor: line.lineVatMinor,
    })),
  };
}
