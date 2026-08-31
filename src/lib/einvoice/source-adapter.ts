/**
 * READ-ONLY source adapter: IssuedInvoiceSnapshot → CanonicalEInvoiceInput.
 * Copies immutable values; normalizes representation only; fail closed if incomplete.
 * Never recalculates money, VAT, invoice numbers, or status.
 */

import {
  EN16931_GUIDELINE_ID,
  DOCUMENT_TYPE_CODE_INVOICE,
  VATEX_EU_AE,
} from "@/lib/einvoice/profile";
import {
  isoToCiiDate102,
  minorToDecimalString,
  netUnitPriceFromLine,
  vatRateBpsToPercentString,
} from "@/lib/einvoice/money";
import { mapTaxPolicyToEn16931Category } from "@/lib/einvoice/tax-category";
import type {
  CanonicalEInvoiceInput,
  EInvoiceAdapterResult,
  IssuedInvoiceSnapshot,
} from "@/lib/einvoice/types";

function requireTrimmed(value: string | null | undefined): string | null {
  const t = value?.trim();
  return t ? t : null;
}

/**
 * Parse seller street/postal/city from snapshot structured fields or addressLines.
 * Expected addressLines shape from seller snapshot: [street, "PLZ City", country?].
 */
export function resolveSellerPostalFields(seller: IssuedInvoiceSnapshot["seller"]): {
  street: string | null;
  postalCode: string | null;
  city: string | null;
} {
  const street = requireTrimmed(seller.street);
  const postalCode = requireTrimmed(seller.postalCode);
  const city = requireTrimmed(seller.city);
  if (street && postalCode && city) {
    return { street, postalCode, city };
  }

  const lines = (seller.addressLines ?? []).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { street: street, postalCode, city };
  }

  const parsedStreet = street ?? lines[0] ?? null;
  let parsedPostal = postalCode;
  let parsedCity = city;

  if ((!parsedPostal || !parsedCity) && lines.length >= 2) {
    const locality = lines[1];
    const m = locality.match(/^(\d{4,10})\s+(.+)$/);
    if (m) {
      parsedPostal = parsedPostal ?? m[1];
      parsedCity = parsedCity ?? m[2].trim();
    }
  }

  return {
    street: parsedStreet,
    postalCode: parsedPostal,
    city: parsedCity,
  };
}

/**
 * Adapt an issued-invoice snapshot into canonical e-invoice input.
 */
export function adaptIssuedInvoiceToCanonical(
  snapshot: IssuedInvoiceSnapshot,
): EInvoiceAdapterResult {
  if (snapshot.status !== "issued") {
    return {
      ok: false,
      code: "NOT_ISSUED",
      message: `E-invoice adapter refuse: status is "${snapshot.status}", expected "issued".`,
    };
  }

  const sellerName = requireTrimmed(snapshot.seller.legalName);
  const sellerVat = requireTrimmed(snapshot.seller.vatId);
  const sellerCountry = requireTrimmed(snapshot.seller.countryCode)?.toUpperCase() ?? null;
  const sellerPostal = resolveSellerPostalFields(snapshot.seller);

  const sellerMissing: string[] = [];
  if (!sellerName) sellerMissing.push("seller.legalName");
  if (!sellerVat) sellerMissing.push("seller.vatId");
  if (!sellerCountry) sellerMissing.push("seller.countryCode");
  if (!sellerPostal.street) sellerMissing.push("seller.street");
  if (!sellerPostal.postalCode) sellerMissing.push("seller.postalCode");
  if (!sellerPostal.city) sellerMissing.push("seller.city");
  if (sellerMissing.length > 0) {
    return {
      ok: false,
      code: "INCOMPLETE_SELLER",
      message: "E-invoice adapter refuse: incomplete seller snapshot.",
      missingFields: sellerMissing,
    };
  }

  const buyerName = requireTrimmed(snapshot.buyer.legalName);
  const buyerCountry = requireTrimmed(snapshot.buyer.countryCode)?.toUpperCase() ?? null;
  const buyerStreet = requireTrimmed(snapshot.buyer.addressLine1);
  const buyerPostal = requireTrimmed(snapshot.buyer.postalCode);
  const buyerCity = requireTrimmed(snapshot.buyer.city);
  const buyerVat = requireTrimmed(snapshot.buyer.vatId);

  const buyerMissing: string[] = [];
  if (!buyerName) buyerMissing.push("buyer.legalName");
  if (!buyerCountry) buyerMissing.push("buyer.countryCode");
  if (!buyerStreet) buyerMissing.push("buyer.addressLine1");
  if (!buyerPostal) buyerMissing.push("buyer.postalCode");
  if (!buyerCity) buyerMissing.push("buyer.city");
  if (buyerMissing.length > 0) {
    return {
      ok: false,
      code: "INCOMPLETE_BUYER",
      message: "E-invoice adapter refuse: incomplete buyer snapshot.",
      missingFields: buyerMissing,
    };
  }

  if (!Array.isArray(snapshot.lines) || snapshot.lines.length === 0) {
    return {
      ok: false,
      code: "INCOMPLETE_LINES",
      message: "E-invoice adapter refuse: no invoice lines.",
    };
  }

  for (const [i, line] of snapshot.lines.entries()) {
    if (!requireTrimmed(line.description)) {
      return {
        ok: false,
        code: "INCOMPLETE_LINES",
        message: `E-invoice adapter refuse: line ${i + 1} missing description.`,
      };
    }
    if (!Number.isInteger(line.lineNetMinor) || !Number.isInteger(line.lineVatMinor) || !Number.isInteger(line.lineGrossMinor)) {
      return {
        ok: false,
        code: "MONEY_INVARIANT",
        message: `E-invoice adapter refuse: line ${i + 1} non-integer money fields.`,
      };
    }
    if (line.lineNetMinor + line.lineVatMinor !== line.lineGrossMinor) {
      return {
        ok: false,
        code: "MONEY_INVARIANT",
        message: `E-invoice adapter refuse: line ${i + 1} net+vat≠gross (no recalculation).`,
      };
    }
  }

  if (
    !Number.isInteger(snapshot.netMinor) ||
    !Number.isInteger(snapshot.vatMinor) ||
    !Number.isInteger(snapshot.grossMinor) ||
    !Number.isInteger(snapshot.vatRateBps)
  ) {
    return {
      ok: false,
      code: "MONEY_INVARIANT",
      message: "E-invoice adapter refuse: header money fields must be integers.",
    };
  }

  if (snapshot.netMinor + snapshot.vatMinor !== snapshot.grossMinor) {
    return {
      ok: false,
      code: "MONEY_INVARIANT",
      message: "E-invoice adapter refuse: header net+vat≠gross (no recalculation).",
    };
  }

  const lineNetSum = snapshot.lines.reduce((s, l) => s + l.lineNetMinor, 0);
  const lineVatSum = snapshot.lines.reduce((s, l) => s + l.lineVatMinor, 0);
  const lineGrossSum = snapshot.lines.reduce((s, l) => s + l.lineGrossMinor, 0);
  if (
    lineNetSum !== snapshot.netMinor ||
    lineVatSum !== snapshot.vatMinor ||
    lineGrossSum !== snapshot.grossMinor
  ) {
    return {
      ok: false,
      code: "MONEY_INVARIANT",
      message: "E-invoice adapter refuse: line sums must equal header totals (zero drift).",
    };
  }

  const taxMap = mapTaxPolicyToEn16931Category(snapshot.taxPolicyOutcome);
  if (!taxMap) {
    return {
      ok: false,
      code: "UNSUPPORTED_TAX_OUTCOME",
      message: `E-invoice adapter refuse: unsupported taxPolicyOutcome "${snapshot.taxPolicyOutcome}".`,
    };
  }

  if (snapshot.taxPolicyOutcome === "REVERSE_CHARGE" || snapshot.reverseChargeApplied) {
    if (!sellerVat || !buyerVat) {
      return {
        ok: false,
        code: "REVERSE_CHARGE_VAT_MISSING",
        message:
          "E-invoice adapter refuse: Reverse Charge requires seller and buyer VAT IDs from snapshot.",
      };
    }
    if (snapshot.vatMinor !== 0 || snapshot.vatRateBps !== 0) {
      return {
        ok: false,
        code: "MONEY_INVARIANT",
        message: "E-invoice adapter refuse: Reverse Charge snapshot must have vatMinor=0 and vatRateBps=0.",
      };
    }
  }

  if (snapshot.taxPolicyOutcome === "STANDARD_DOMESTIC_VAT") {
    if (snapshot.vatRateBps <= 0 || snapshot.vatMinor < 0) {
      return {
        ok: false,
        code: "MONEY_INVARIANT",
        message: "E-invoice adapter refuse: domestic VAT snapshot must have positive rate.",
      };
    }
  }

  const issueIso = snapshot.issuedAt ?? snapshot.createdAt;
  let issueDate: string;
  try {
    issueDate = isoToCiiDate102(issueIso);
  } catch {
    return {
      ok: false,
      code: "INCOMPLETE_BUYER",
      message: `E-invoice adapter refuse: invalid issue date "${issueIso}".`,
    };
  }

  const currency = snapshot.currency.trim().toUpperCase();
  const vatCategoryCode = taxMap.vatCategoryCode;
  const vatRatePercent =
    vatCategoryCode === "S"
      ? vatRateBpsToPercentString(snapshot.vatRateBps)
      : "0.00";

  const exemptionReason =
    taxMap.exemptionReasonRequired
      ? requireTrimmed(snapshot.taxNote) ??
        (vatCategoryCode === "AE"
          ? "Steuerschuldnerschaft des Leistungsempfängers / Reverse charge — VAT to be accounted for by the recipient."
          : null)
      : null;

  if (taxMap.exemptionReasonRequired && !exemptionReason) {
    return {
      ok: false,
      code: "UNSUPPORTED_TAX_OUTCOME",
      message: "E-invoice adapter refuse: exemption/reason text missing for zero-rate category.",
    };
  }

  const lines: CanonicalEInvoiceInput["lines"] = snapshot.lines.map((line, index) => ({
    lineId: String(index + 1),
    name: line.description.trim(),
    quantity: line.quantity,
    unitCode: "C62",
    netUnitPrice: netUnitPriceFromLine(line.lineNetMinor, line.quantity),
    lineNetAmount: minorToDecimalString(line.lineNetMinor),
    vatCategoryCode,
    vatRatePercent,
    lineVatAmount: minorToDecimalString(line.lineVatMinor),
    lineGrossAmount: minorToDecimalString(line.lineGrossMinor),
  }));

  const input: CanonicalEInvoiceInput = {
    profile: "EN16931",
    guidelineId: EN16931_GUIDELINE_ID,
    documentTypeCode: DOCUMENT_TYPE_CODE_INVOICE,
    invoiceNumber: snapshot.invoiceNumber.trim(),
    issueDate,
    currency,
    seller: {
      name: sellerName!,
      vatId: sellerVat!,
      countryCode: sellerCountry!,
      street: sellerPostal.street!,
      postalCode: sellerPostal.postalCode!,
      city: sellerPostal.city!,
      addressLine2: null,
      email: null,
    },
    buyer: {
      name: buyerName!,
      vatId: buyerVat,
      countryCode: buyerCountry!,
      street: buyerStreet!,
      postalCode: buyerPostal!,
      city: buyerCity!,
      addressLine2: requireTrimmed(snapshot.buyer.addressLine2),
      email: requireTrimmed(snapshot.buyer.billingEmail),
    },
    lines,
    taxBreakdown: [
      {
        vatCategoryCode,
        vatRatePercent,
        taxableAmount: minorToDecimalString(snapshot.netMinor),
        taxAmount: minorToDecimalString(snapshot.vatMinor),
        exemptionReason,
        exemptionReasonCode: vatCategoryCode === "AE" ? VATEX_EU_AE : null,
      },
    ],
    totals: {
      lineTotalAmount: minorToDecimalString(snapshot.netMinor),
      taxBasisTotalAmount: minorToDecimalString(snapshot.netMinor),
      taxTotalAmount: minorToDecimalString(snapshot.vatMinor),
      grandTotalAmount: minorToDecimalString(snapshot.grossMinor),
      duePayableAmount: minorToDecimalString(snapshot.grossMinor),
    },
    taxPolicyOutcome: snapshot.taxPolicyOutcome,
    reverseChargeApplied: snapshot.reverseChargeApplied,
    taxNote: requireTrimmed(snapshot.taxNote),
    billingPeriodStart: snapshot.billingPeriodStart,
    billingPeriodEnd: snapshot.billingPeriodEnd,
    sourceMinor: {
      netMinor: snapshot.netMinor,
      vatMinor: snapshot.vatMinor,
      grossMinor: snapshot.grossMinor,
      vatRateBps: snapshot.vatRateBps,
    },
    demoNotLegal: Boolean(snapshot.demoNotLegal),
  };

  return { ok: true, input };
}
