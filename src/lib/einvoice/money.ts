/**
 * Monetary representation helpers — convert minor units to decimal strings.
 * NEVER recalculates VAT, rates, or totals from rates; copy-only formatting.
 */

/** Format integer minor units (cents) as decimal string with exactly 2 fraction digits. */
export function minorToDecimalString(minor: number): string {
  if (!Number.isInteger(minor)) {
    throw new Error(`minorToDecimalString: non-integer minor units: ${minor}`);
  }
  const negative = minor < 0;
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${frac}`;
}

/** Format VAT basis points (e.g. 1900 → "19.00"). Representation only. */
export function vatRateBpsToPercentString(vatRateBps: number): string {
  if (!Number.isInteger(vatRateBps) || vatRateBps < 0) {
    throw new Error(`vatRateBpsToPercentString: invalid bps: ${vatRateBps}`);
  }
  const whole = Math.floor(vatRateBps / 100);
  const frac = String(vatRateBps % 100).padStart(2, "0");
  return `${whole}.${frac}`;
}

/** Net unit price from line net / quantity — representation; fails if not divisible. */
export function netUnitPriceFromLine(lineNetMinor: number, quantity: number): string {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("netUnitPriceFromLine: quantity must be > 0");
  }
  if (!Number.isInteger(lineNetMinor)) {
    throw new Error("netUnitPriceFromLine: lineNetMinor must be integer");
  }
  // Prefer exact integer division in minor units when possible.
  if (Number.isInteger(quantity) && lineNetMinor % quantity === 0) {
    return minorToDecimalString(lineNetMinor / quantity);
  }
  // Fallback: decimal division rounded half-up to 2 places from already-settled line net
  // (does not change invoice totals — only unit price display field BT-146).
  const unit = lineNetMinor / 100 / quantity;
  return unit.toFixed(2);
}

/** ISO date yyyymmdd (CII format 102) from ISO timestamp. */
export function isoToCiiDate102(iso: string): string {
  const d = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    throw new Error(`isoToCiiDate102: invalid date: ${iso}`);
  }
  return d.replaceAll("-", "");
}

/** Escape XML text content. */
export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
