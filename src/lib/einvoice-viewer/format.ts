/**
 * Presentation-only formatting for E-Invoice Viewer (de-DE invoice UI).
 * Formats XML decimal strings — does not recalculate monetary values.
 */

const DISPLAY_LOCALE = "de-DE";

export function formatCiiDate102(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!/^\d{8}$/.test(v)) return v;
  const y = v.slice(0, 4);
  const m = v.slice(4, 6);
  const d = v.slice(6, 8);
  return `${d}.${m}.${y}`;
}

export function formatServicePeriodLabel(
  start: string | null,
  end: string | null,
): string | null {
  const a = formatCiiDate102(start);
  const b = formatCiiDate102(end);
  if (a && b) return `${a} – ${b}`;
  if (a) return a;
  if (b) return b;
  return null;
}

/**
 * Format an XML monetary decimal string for German display (e.g. 503.36 → 503,36 €).
 * Does not alter the underlying numeric meaning beyond locale presentation.
 */
export function formatXmlMoney(
  amount: string | null | undefined,
  currency: string | null | undefined = "EUR",
): string | null {
  if (amount == null || amount.trim() === "") return null;
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  const cur = (currency ?? "EUR").trim().toUpperCase() || "EUR";
  try {
    return new Intl.NumberFormat(DISPLAY_LOCALE, {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${amount} ${cur}`;
  }
}

export function formatXmlPercent(rate: string | null | undefined): string | null {
  if (rate == null || rate.trim() === "") return null;
  const n = Number(rate);
  if (!Number.isFinite(n)) return `${rate} %`;
  return new Intl.NumberFormat(DISPLAY_LOCALE, {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n) + " %";
}

export function unitCodeLabel(unitCode: string | null | undefined): string | null {
  if (!unitCode) return null;
  switch (unitCode.toUpperCase()) {
    case "C62":
      return "Stück / unit";
    case "HUR":
      return "Stunde / hour";
    case "DAY":
      return "Tag / day";
    case "MON":
      return "Monat / month";
    default:
      return unitCode;
  }
}

export function taxCategoryDisplayLabel(
  categoryCode: string | null | undefined,
  ratePercent: string | null | undefined,
): string | null {
  if (!categoryCode) return null;
  const code = categoryCode.toUpperCase();
  if (code === "AE") return "Reverse Charge / 0 %";
  if (code === "S") {
    const rate = formatXmlPercent(ratePercent);
    return rate ? `USt. ${rate}` : "Umsatzsteuer (S)";
  }
  if (code === "Z") return "0 % (Z)";
  if (code === "E") return "steuerbefreit (E)";
  return code;
}

export function documentTypeLabel(typeCode: string | null | undefined): string | null {
  if (!typeCode) return null;
  if (typeCode === "380") return "Handelsrechnung (380)";
  if (typeCode === "381") return "Gutschrift (381)";
  return typeCode;
}

/** Sum XML decimal strings for optional consistency warning only. */
export function sumDecimalStrings(values: string[]): string | null {
  let total = 0;
  for (const v of values) {
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    total += n;
  }
  return total.toFixed(2);
}

export function decimalsVisuallyEqual(a: string | null, b: string | null): boolean {
  if (a == null || b == null) return true;
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isFinite(na) || !Number.isFinite(nb)) return a === b;
  return Math.abs(na - nb) < 0.005;
}
