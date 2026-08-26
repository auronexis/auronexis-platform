/**
 * Seller tax configuration boundary for invoices / e-invoice domain.
 * Reads verified COMPANY_INFORMATION only — never invents missing IDs.
 */

import {
  COMPANY_INFORMATION,
  LEGAL_COMPANY_NAME,
  LEGAL_VAT_ID,
} from "@/lib/company/company-information";
import { SELLER_COUNTRY_CODE } from "@/lib/billing/tax-constants";

export type SellerTaxConfigurationStatus = "ready" | "OPERATOR_INPUT_REQUIRED";

export type SellerTaxConfiguration = {
  status: SellerTaxConfigurationStatus;
  legalName: string;
  vatId: string | null;
  countryCode: string;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  countryLabel: string | null;
  addressLines: string[];
  missingFields: string[];
};

/**
 * Resolve seller tax identity for invoice snapshots.
 * Missing required fields → OPERATOR_INPUT_REQUIRED (fail-closed for uncertain issuance).
 */
export function getSellerTaxConfiguration(): SellerTaxConfiguration {
  const legalName = LEGAL_COMPANY_NAME.trim();
  const vatId = LEGAL_VAT_ID.trim() || null;
  const street = COMPANY_INFORMATION.street.trim() || null;
  const postalCode = COMPANY_INFORMATION.postalCode.trim() || null;
  const city = COMPANY_INFORMATION.city.trim() || null;
  const countryLabel = COMPANY_INFORMATION.country.trim() || null;

  const missingFields: string[] = [];
  if (!legalName) missingFields.push("legalName");
  if (!vatId) missingFields.push("vatId");
  if (!street) missingFields.push("street");
  if (!postalCode) missingFields.push("postalCode");
  if (!city) missingFields.push("city");

  const addressLines = [street, [postalCode, city].filter(Boolean).join(" "), countryLabel].filter(
    (line): line is string => Boolean(line && line.trim()),
  );

  return {
    status: missingFields.length === 0 ? "ready" : "OPERATOR_INPUT_REQUIRED",
    legalName: legalName || LEGAL_COMPANY_NAME,
    vatId,
    countryCode: SELLER_COUNTRY_CODE,
    street,
    postalCode,
    city,
    countryLabel,
    addressLines,
    missingFields,
  };
}

export type SellerInvoiceSnapshot = {
  legalName: string;
  vatId: string | null;
  countryCode: string;
  addressLines: string[];
  configStatus: SellerTaxConfigurationStatus;
};

export function buildSellerInvoiceSnapshot(): SellerInvoiceSnapshot {
  const config = getSellerTaxConfiguration();
  return {
    legalName: config.legalName,
    vatId: config.vatId,
    countryCode: config.countryCode,
    addressLines: config.addressLines,
    configStatus: config.status,
  };
}
