/**
 * Human-readable country labels for customer-facing presentation.
 * Storage and tax engines continue to use ISO alpha-2 codes.
 */

/**
 * Resolve ISO 3166-1 alpha-2 → English (or locale) region display name.
 * Returns null for invalid/unrecognized codes (fail-safe; never invents a name).
 */
export function formatInvoiceCountryName(
  countryCode: string | null | undefined,
  locale: string = "en",
): string | null {
  const code = countryCode?.trim().toUpperCase() ?? "";
  if (!/^[A-Z]{2}$/.test(code)) {
    return null;
  }

  try {
    const name = new Intl.DisplayNames([locale], { type: "region" }).of(code);
    if (!name || name === code || /^unknown region$/i.test(name)) {
      return null;
    }
    return name;
  } catch {
    return null;
  }
}
