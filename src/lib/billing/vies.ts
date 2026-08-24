/**
 * VAT ID normalization + VIES validation abstraction (server-only).
 * Fail ≠ valid. Network/service errors must never grant reverse-charge eligibility.
 */

import "server-only";

export type ViesValidationStatus = "valid" | "invalid" | "unavailable" | "not_checked" | "skipped";

export type ViesValidationResult = {
  status: ViesValidationStatus;
  countryCode: string | null;
  vatNumber: string | null;
  checkedAt: string;
  /** Provider name for audit — never log full responses with personal data in analytics. */
  provider: "eu_vies" | "none";
  rawRequestId?: string;
};

const VAT_ID_PATTERN = /^[A-Z]{2}[A-Z0-9]{2,12}$/;

export function normalizeVatId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const compact = raw.replace(/[\s.\-]/g, "").toUpperCase();
  if (!VAT_ID_PATTERN.test(compact)) return null;
  return compact;
}

export function splitVatId(vatId: string): { countryCode: string; number: string } | null {
  const normalized = normalizeVatId(vatId);
  if (!normalized) return null;
  return { countryCode: normalized.slice(0, 2), number: normalized.slice(2) };
}

/**
 * Validate against EU VIES when configured. Without network reachability, returns unavailable.
 * Never treats transport failures as valid.
 */
export async function validateVatIdWithVies(
  vatId: string | null | undefined,
): Promise<ViesValidationResult> {
  const checkedAt = new Date().toISOString();
  const normalized = normalizeVatId(vatId);
  if (!normalized) {
    return {
      status: "invalid",
      countryCode: null,
      vatNumber: null,
      checkedAt,
      provider: "none",
    };
  }

  const parts = splitVatId(normalized);
  if (!parts) {
    return {
      status: "invalid",
      countryCode: null,
      vatNumber: null,
      checkedAt,
      provider: "none",
    };
  }

  // Optional explicit skip for local TEST harnesses — never implies validity.
  if (process.env.VIES_VALIDATION_MODE === "skip") {
    return {
      status: "skipped",
      countryCode: parts.countryCode,
      vatNumber: parts.number,
      checkedAt,
      provider: "none",
    };
  }

  try {
    const result = await queryEuViesSoap(parts.countryCode, parts.number);
    return {
      ...result,
      checkedAt,
      provider: "eu_vies",
    };
  } catch {
    return {
      status: "unavailable",
      countryCode: parts.countryCode,
      vatNumber: parts.number,
      checkedAt,
      provider: "eu_vies",
    };
  }
}

async function queryEuViesSoap(
  countryCode: string,
  vatNumber: string,
): Promise<Pick<ViesValidationResult, "status" | "countryCode" | "vatNumber" | "rawRequestId">> {
  const endpoint =
    process.env.VIES_CHECK_VAT_URL ??
    "https://ec.europa.eu/taxation_customs/vies/services/checkVatService";

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soapenv:Header/>
  <soapenv:Body>
    <urn:checkVat>
      <urn:countryCode>${escapeXml(countryCode)}</urn:countryCode>
      <urn:vatNumber>${escapeXml(vatNumber)}</urn:vatNumber>
    </urn:checkVat>
  </soapenv:Body>
</soapenv:Envelope>`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "",
      },
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`VIES HTTP ${response.status}`);
    }

    const xml = await response.text();
    if (/<faultstring>/i.test(xml) || /soap:Fault/i.test(xml)) {
      return {
        status: "unavailable",
        countryCode,
        vatNumber,
      };
    }

    const validMatch = xml.match(/<valid>\s*(true|false)\s*<\/valid>/i);
    if (!validMatch) {
      return {
        status: "unavailable",
        countryCode,
        vatNumber,
      };
    }

    return {
      status: validMatch[1].toLowerCase() === "true" ? "valid" : "invalid",
      countryCode,
      vatNumber,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
