/**
 * Generate ZUGFeRD / Factur-X EN 16931 CII XML from CanonicalEInvoiceInput.
 * Representation mapping only — amounts copied from canonical (zero drift).
 */

import { escapeXml } from "@/lib/einvoice/money";
import type { CanonicalEInvoiceInput } from "@/lib/einvoice/types";

function partyXml(
  tag: "SellerTradeParty" | "BuyerTradeParty",
  party: CanonicalEInvoiceInput["seller"],
): string {
  const lineTwo = party.addressLine2
    ? `\n          <ram:LineTwo>${escapeXml(party.addressLine2)}</ram:LineTwo>`
    : "";
  const email = party.email
    ? `
        <ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${escapeXml(party.email)}</ram:URIID>
        </ram:URIUniversalCommunication>`
    : "";
  const vat = party.vatId
    ? `
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXml(party.vatId)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
    : "";

  return `      <ram:${tag}>
        <ram:Name>${escapeXml(party.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(party.postalCode)}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(party.street)}</ram:LineOne>${lineTwo}
          <ram:CityName>${escapeXml(party.city)}</ram:CityName>
          <ram:CountryID>${escapeXml(party.countryCode)}</ram:CountryID>
        </ram:PostalTradeAddress>${email}${vat}
      </ram:${tag}>`;
}

function lineXml(line: CanonicalEInvoiceInput["lines"][number]): string {
  return `    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${escapeXml(line.lineId)}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXml(line.name)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${line.netUnitPrice}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${escapeXml(line.unitCode)}">${line.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${line.vatCategoryCode}</ram:CategoryCode>
          <ram:RateApplicablePercent>${line.vatRatePercent}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${line.lineNetAmount}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
}

function taxBreakdownXml(
  tax: CanonicalEInvoiceInput["taxBreakdown"][number],
): string {
  const reason = tax.exemptionReason
    ? `\n        <ram:ExemptionReason>${escapeXml(tax.exemptionReason)}</ram:ExemptionReason>`
    : "";
  return `      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${tax.taxAmount}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${tax.taxableAmount}</ram:BasisAmount>
        <ram:CategoryCode>${tax.vatCategoryCode}</ram:CategoryCode>${reason}
        <ram:RateApplicablePercent>${tax.vatRatePercent}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`;
}

/**
 * Build CrossIndustryInvoice XML (UTF-8) for EN 16931 profile.
 */
export function generateZugferdEn16931Xml(input: CanonicalEInvoiceInput): string {
  const notes: string[] = [];
  if (input.demoNotLegal) {
    notes.push("DEMO/NOT LEGAL — synthetic sample for engineering review only.");
  }
  if (input.taxNote) {
    notes.push(input.taxNote);
  }

  const noteXml = notes
    .map(
      (n) => `    <ram:IncludedNote>
      <ram:Content>${escapeXml(n)}</ram:Content>
    </ram:IncludedNote>`,
    )
    .join("\n");

  const periodXml =
    input.billingPeriodStart && input.billingPeriodEnd
      ? `
      <ram:BillingSpecifiedPeriod>
        <ram:StartDateTime>
          <udt:DateTimeString format="102">${escapeXml(
            input.billingPeriodStart.slice(0, 10).replaceAll("-", ""),
          )}</udt:DateTimeString>
        </ram:StartDateTime>
        <ram:EndDateTime>
          <udt:DateTimeString format="102">${escapeXml(
            input.billingPeriodEnd.slice(0, 10).replaceAll("-", ""),
          )}</udt:DateTimeString>
        </ram:EndDateTime>
      </ram:BillingSpecifiedPeriod>`
      : "";

  const lines = input.lines.map(lineXml).join("\n");
  const taxes = input.taxBreakdown.map(taxBreakdownXml).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>${escapeXml(input.guidelineId)}</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(input.invoiceNumber)}</ram:ID>
    <ram:TypeCode>${input.documentTypeCode}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${input.issueDate}</udt:DateTimeString>
    </ram:IssueDateTime>
${noteXml}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
${lines}
    <ram:ApplicableHeaderTradeAgreement>
${partyXml("SellerTradeParty", input.seller)}
${partyXml("BuyerTradeParty", input.buyer)}
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${escapeXml(input.currency)}</ram:InvoiceCurrencyCode>${periodXml}
${taxes}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${input.totals.lineTotalAmount}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${input.totals.taxBasisTotalAmount}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${escapeXml(input.currency)}">${input.totals.taxTotalAmount}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${input.totals.grandTotalAmount}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${input.totals.duePayableAmount}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
`;
}
