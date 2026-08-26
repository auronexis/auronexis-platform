/** Shared tax geography constants — imported by classification and policy (no cycles). */

/** Seller establishment for Auroranexis (DE). */
export const SELLER_COUNTRY_CODE = "DE" as const;

/** EU member state ISO codes for VAT ID / reverse-charge boundary checks. */
export const EU_VAT_COUNTRY_CODES = new Set([
  "AT",
  "BE",
  "BG",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "EL",
  "ES",
  "FI",
  "FR",
  "HR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
  "XI",
]);
