/**
 * Excel-friendly CSV (UTF-8 BOM, semicolon delimiter for DE locale) with formula-injection guards.
 */

const CSV_DELIMITER = ";";

function sanitizeCsvCell(raw: string): string {
  let value = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/^[=+\-@\t]/.test(value)) {
    value = `'${value}`;
  }
  return `"${value.replace(/"/g, '""')}"`;
}

export function toAuditCsv(rows: Array<Record<string, unknown>>, headers: readonly string[]): string {
  const headerLine = headers.map((header) => sanitizeCsvCell(header)).join(CSV_DELIMITER);
  if (rows.length === 0) {
    return `\uFEFF${headerLine}\n`;
  }

  const lines = rows.map((row) =>
    headers
      .map((key) => sanitizeCsvCell(String(row[key] ?? "")))
      .join(CSV_DELIMITER),
  );

  return `\uFEFF${[headerLine, ...lines].join("\n")}\n`;
}
