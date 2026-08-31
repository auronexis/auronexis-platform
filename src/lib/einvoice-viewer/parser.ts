/**
 * Normalize secure XML tree → EInvoiceViewModel (display only).
 */

import {
  decimalsVisuallyEqual,
  sumDecimalStrings,
  taxCategoryDisplayLabel,
  unitCodeLabel,
} from "@/lib/einvoice-viewer/format";
import {
  findChild,
  findChildren,
  firstText,
  parseSecureXml,
  textOf,
  type SecureXmlNode,
} from "@/lib/einvoice-viewer/secure-xml";
import {
  EINVOICE_VIEWER_MAX_XML_BYTES,
  EINVOICE_VIEWER_SUPPORTED_GUIDELINE,
  type EInvoiceViewerParseResult,
  type EInvoiceViewerParty,
  type EInvoiceViewerLine,
  type EInvoiceViewerTax,
  type EInvoiceViewerWarningCode,
  type EInvoiceViewModel,
} from "@/lib/einvoice-viewer/types";

function utf8ByteLength(text: string): number {
  if (typeof Buffer !== "undefined") {
    return Buffer.byteLength(text, "utf8");
  }
  return new TextEncoder().encode(text).length;
}

function parseDate102FromNode(parent: SecureXmlNode | null, dateElement: string): string | null {
  if (!parent) return null;
  const dt = findChild(parent, dateElement);
  if (!dt) return null;
  const str = findChild(dt, "DateTimeString");
  return textOf(str);
}

function readParty(partyNode: SecureXmlNode | null): EInvoiceViewerParty {
  if (!partyNode) {
    return {
      name: null,
      street: null,
      street2: null,
      postalCode: null,
      city: null,
      countryCode: null,
      vatId: null,
      email: null,
    };
  }
  const addr = findChild(partyNode, "PostalTradeAddress");
  const taxReg = findChild(partyNode, "SpecifiedTaxRegistration");
  const taxId = taxReg ? findChild(taxReg, "ID") : null;
  const uriComm = findChild(partyNode, "URIUniversalCommunication");
  const uriId = uriComm ? findChild(uriComm, "URIID") : null;

  return {
    name: firstText(partyNode, "Name"),
    street: firstText(addr, "LineOne"),
    street2: firstText(addr, "LineTwo"),
    postalCode: firstText(addr, "PostcodeCode"),
    city: firstText(addr, "CityName"),
    countryCode: firstText(addr, "CountryID"),
    vatId: textOf(taxId),
    email: textOf(uriId),
  };
}

function readLine(lineNode: SecureXmlNode): EInvoiceViewerLine {
  const lineId =
    firstText(findChild(lineNode, "AssociatedDocumentLineDocument"), "LineID") ?? "";
  const product = findChild(lineNode, "SpecifiedTradeProduct");
  const agreement = findChild(lineNode, "SpecifiedLineTradeAgreement");
  const delivery = findChild(lineNode, "SpecifiedLineTradeDelivery");
  const settlement = findChild(lineNode, "SpecifiedLineTradeSettlement");
  const qtyNode = delivery ? findChild(delivery, "BilledQuantity") : null;
  const tax = settlement ? findChild(settlement, "ApplicableTradeTax") : null;
  const sum = settlement
    ? findChild(settlement, "SpecifiedTradeSettlementLineMonetarySummation")
    : null;
  const category = firstText(tax, "CategoryCode");
  const rate = firstText(tax, "RateApplicablePercent");
  const unitCode = qtyNode?.attrs.unitCode ?? null;

  return {
    lineId,
    description: firstText(product, "Name") ?? "",
    quantity: textOf(qtyNode) ?? "",
    unitCode,
    unitLabel: unitCodeLabel(unitCode),
    netUnitPrice: firstText(
      findChild(agreement, "NetPriceProductTradePrice"),
      "ChargeAmount",
    ),
    lineTotal: firstText(sum, "LineTotalAmount"),
    taxCategoryCode: category,
    taxRatePercent: rate,
    taxLabel: taxCategoryDisplayLabel(category, rate),
  };
}

function readTax(taxNode: SecureXmlNode): EInvoiceViewerTax {
  return {
    categoryCode: firstText(taxNode, "CategoryCode") ?? "",
    ratePercent: firstText(taxNode, "RateApplicablePercent"),
    basisAmount: firstText(taxNode, "BasisAmount"),
    calculatedAmount: firstText(taxNode, "CalculatedAmount"),
    exemptionReason: firstText(taxNode, "ExemptionReason"),
    exemptionReasonCode: firstText(taxNode, "ExemptionReasonCode"),
    typeCode: firstText(taxNode, "TypeCode"),
  };
}

function detectDemo(notes: string[]): boolean {
  return notes.some((n) => /DEMO\s*\/\s*NOT\s*LEGAL/i.test(n) || /DEMO\/NOT LEGAL/i.test(n));
}

function pushWarning(
  warnings: Array<{ code: EInvoiceViewerWarningCode; message: string }>,
  code: EInvoiceViewerWarningCode,
  message: string,
): void {
  warnings.push({ code, message });
}

/**
 * Parse EN16931 CII XML into a display view model.
 * XML values are copied as-is; optional arithmetic is warning-only.
 */
export function parseEInvoiceXml(xmlInput: string): EInvoiceViewerParseResult {
  if (!xmlInput || !xmlInput.trim()) {
    return {
      ok: false,
      code: "EMPTY",
      message: "E-Rechnung konnte nicht sicher gelesen werden.",
      detail: "Empty XML",
    };
  }

  if (utf8ByteLength(xmlInput) > EINVOICE_VIEWER_MAX_XML_BYTES) {
    return {
      ok: false,
      code: "TOO_LARGE",
      message: "E-Rechnung konnte nicht sicher gelesen werden.",
      detail: "XML too large",
    };
  }

  const tree = parseSecureXml(xmlInput, EINVOICE_VIEWER_MAX_XML_BYTES);
  if (!tree.ok) {
    const code =
      tree.reason === "UNSAFE_XML"
        ? "UNSAFE_XML"
        : tree.reason === "TOO_LARGE"
          ? "TOO_LARGE"
          : tree.reason === "EMPTY"
            ? "EMPTY"
            : "MALFORMED";
    return {
      ok: false,
      code,
      message: "E-Rechnung konnte nicht sicher gelesen werden.",
      detail: tree.detail,
    };
  }

  const root = tree.root;
  if (root.localName !== "CrossIndustryInvoice") {
    return {
      ok: false,
      code: "NOT_CII",
      message: "E-Rechnung konnte nicht sicher gelesen werden.",
      detail: "Root is not CrossIndustryInvoice",
    };
  }

  const context = findChild(root, "ExchangedDocumentContext");
  const guideline =
    firstText(
      findChild(context, "GuidelineSpecifiedDocumentContextParameter"),
      "ID",
    ) ?? null;

  const warnings: Array<{ code: EInvoiceViewerWarningCode; message: string }> = [];
  const profileSupported = guideline === EINVOICE_VIEWER_SUPPORTED_GUIDELINE;
  if (!profileSupported) {
    pushWarning(
      warnings,
      "UNSUPPORTED_PROFILE",
      "Nicht unterstütztes E-Rechnungsprofil",
    );
  }

  const doc = findChild(root, "ExchangedDocument");
  const invoiceNumber = firstText(doc, "ID");
  const documentTypeCode = firstText(doc, "TypeCode");
  const issueDateRaw = parseDate102FromNode(doc, "IssueDateTime");
  const noteNodes = doc ? findChildren(doc, "IncludedNote") : [];
  const notes = noteNodes
    .map((n) => firstText(n, "Content"))
    .filter((n): n is string => Boolean(n));

  const txn = findChild(root, "SupplyChainTradeTransaction");
  if (!txn) {
    return {
      ok: false,
      code: "MISSING_REQUIRED",
      message: "E-Rechnung konnte nicht sicher gelesen werden.",
      detail: "Missing SupplyChainTradeTransaction",
    };
  }

  const agreement = findChild(txn, "ApplicableHeaderTradeAgreement");
  const seller = readParty(findChild(agreement, "SellerTradeParty"));
  const buyer = readParty(findChild(agreement, "BuyerTradeParty"));

  const delivery = findChild(txn, "ApplicableHeaderTradeDelivery");
  const deliveryEvent = findChild(delivery, "ActualDeliverySupplyChainEvent");
  const deliveryDate = parseDate102FromNode(deliveryEvent, "OccurrenceDateTime");

  const settlement = findChild(txn, "ApplicableHeaderTradeSettlement");
  const currency = firstText(settlement, "InvoiceCurrencyCode");
  const taxNodes = settlement ? findChildren(settlement, "ApplicableTradeTax") : [];
  const taxes = taxNodes.map(readTax).filter((t) => t.categoryCode);

  const period = findChild(settlement, "BillingSpecifiedPeriod");
  const periodStart = parseDate102FromNode(period, "StartDateTime");
  const periodEnd = parseDate102FromNode(period, "EndDateTime");

  const summation = findChild(settlement, "SpecifiedTradeSettlementHeaderMonetarySummation");
  const taxTotalNode = summation ? findChild(summation, "TaxTotalAmount") : null;
  const totals = {
    lineTotalAmount: firstText(summation, "LineTotalAmount"),
    taxBasisTotalAmount: firstText(summation, "TaxBasisTotalAmount"),
    taxTotalAmount: textOf(taxTotalNode),
    taxTotalCurrency: taxTotalNode?.attrs.currencyID ?? null,
    grandTotalAmount: firstText(summation, "GrandTotalAmount"),
    duePayableAmount: firstText(summation, "DuePayableAmount"),
  };

  const lineNodes = findChildren(txn, "IncludedSupplyChainTradeLineItem");
  const lines = lineNodes.map(readLine);

  if (!invoiceNumber || !summation) {
    return {
      ok: false,
      code: "MISSING_REQUIRED",
      message: "E-Rechnung konnte nicht sicher gelesen werden.",
      detail: "Missing invoice number or monetary summation",
    };
  }

  const lineSum = sumDecimalStrings(
    lines.map((l) => l.lineTotal).filter((v): v is string => Boolean(v)),
  );
  if (
    lineSum &&
    totals.lineTotalAmount &&
    !decimalsVisuallyEqual(lineSum, totals.lineTotalAmount)
  ) {
    pushWarning(
      warnings,
      "LINE_SUM_MISMATCH",
      "Positionssumme weicht vom XML-Gesamtnetto ab (Anzeige unverändert).",
    );
  }

  const isReverseCharge = taxes.some((t) => t.categoryCode.toUpperCase() === "AE");
  const hasStandardVat = taxes.some((t) => t.categoryCode.toUpperCase() === "S");

  const unitCodes = [
    ...new Set(lines.map((l) => l.unitCode).filter((u): u is string => Boolean(u))),
  ];
  const taxCategoryCodes = [...new Set(taxes.map((t) => t.categoryCode))];
  const exemptionReasonCodes = [
    ...new Set(
      taxes
        .map((t) => t.exemptionReasonCode)
        .filter((c): c is string => Boolean(c)),
    ),
  ];

  const model: EInvoiceViewModel = {
    invoiceNumber,
    issueDate: issueDateRaw,
    documentTypeCode,
    currency,
    seller,
    buyer,
    lines,
    taxes,
    totals,
    servicePeriod: {
      start: periodStart,
      end: periodEnd,
      deliveryDate,
    },
    notes,
    isDemo: detectDemo(notes),
    isReverseCharge,
    hasStandardVat,
    technical: {
      guidelineId: guideline,
      profileLabel: profileSupported ? "EN16931" : "Unbekannt / unsupported",
      standardLabel: "ZUGFeRD 2.5.2 / Factur-X 1.09.2",
      syntaxLabel: "UN/CEFACT CII",
      documentTypeCode,
      currency,
      taxCategoryCodes,
      exemptionReasonCodes,
      unitCodes,
      sellerVatId: seller.vatId,
      buyerVatId: buyer.vatId,
      profileSupported,
    },
    warnings,
    rawXml: xmlInput,
  };

  return { ok: true, model };
}
