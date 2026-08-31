/**
 * E-Invoice Viewer — Tests A–T + billing/generator isolation.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/einvoice-viewer.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { execSync } from "node:child_process";
import { readSource, rootDir } from "./_test-helpers/read-source.mjs";

const viewer = await import("../src/lib/einvoice-viewer/index.ts");
const {
  parseEInvoiceXml,
  formatXmlMoney,
  formatCiiDate102,
  formatServicePeriodLabel,
} = viewer;

const DE_XML = readFileSync(
  join(rootDir, "artifacts/einvoice-demo/TEST-EINV-2026-000001.xml"),
  "utf8",
);
const RC_XML = readFileSync(
  join(rootDir, "artifacts/einvoice-demo/TEST-EINV-RC-2026-000001.xml"),
  "utf8",
);

const VIEWER_SRC_ROOTS = [
  "src/lib/einvoice-viewer",
  "src/components/einvoice-viewer",
  "src/app/internal/einvoice-preview",
];

function listFilesRecursive(relDir) {
  const abs = join(rootDir, relDir);
  const out = [];
  function walk(dir, prefix) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const next = join(dir, entry.name);
      const rel = `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(next, rel);
      else out.push(rel.replace(/\\/g, "/"));
    }
  }
  if (statSync(abs, { throwIfNoEntry: false })) {
    walk(abs, relDir.replace(/\\/g, "/"));
  }
  return out;
}

function collectViewerSources() {
  return VIEWER_SRC_ROOTS.flatMap((root) => listFilesRecursive(root)).filter((f) =>
    /\.(ts|tsx|mjs|js)$/.test(f),
  );
}

function withGuideline(xml, guidelineId) {
  return xml.replace(
    /<ram:ID>urn:cen\.eu:en16931:2017<\/ram:ID>/,
    `<ram:ID>${guidelineId}</ram:ID>`,
  );
}

function multiLineXml() {
  const line2 = `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>2</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>Second line (synthetic multi-line fixture)</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>10.00</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">2</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>19.00</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>20.00</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
  return DE_XML.replace(
    "</ram:IncludedSupplyChainTradeLineItem>",
    `</ram:IncludedSupplyChainTradeLineItem>${line2}`,
  );
}

test("A — DE B2B demo parses correctly", () => {
  const result = parseEInvoiceXml(DE_XML);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.model.invoiceNumber, "TEST-EINV-2026-000001");
  assert.equal(result.model.technical.profileSupported, true);
});

test("B — EU RC demo parses correctly", () => {
  const result = parseEInvoiceXml(RC_XML);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.model.invoiceNumber, "TEST-EINV-RC-2026-000001");
  assert.equal(result.model.isReverseCharge, true);
});

test("C — Invoice number displayed correctly", () => {
  const de = parseEInvoiceXml(DE_XML);
  const rc = parseEInvoiceXml(RC_XML);
  assert.equal(de.ok && de.model.invoiceNumber, "TEST-EINV-2026-000001");
  assert.equal(rc.ok && rc.model.invoiceNumber, "TEST-EINV-RC-2026-000001");
});

test("D — Seller parsed correctly", () => {
  const result = parseEInvoiceXml(DE_XML);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.model.seller.name, "Auroranexis AI Solutions");
  assert.equal(result.model.seller.city, "Althütte");
  assert.equal(result.model.seller.countryCode, "DE");
  assert.equal(result.model.seller.street, "Im Malerwinkel 4");
  assert.equal(result.model.seller.postalCode, "71566");
});

test("E — Buyer parsed correctly", () => {
  const de = parseEInvoiceXml(DE_XML);
  const rc = parseEInvoiceXml(RC_XML);
  assert.equal(de.ok, true);
  assert.equal(rc.ok, true);
  if (!de.ok || !rc.ok) return;
  assert.equal(de.model.buyer.name, "Demo GmbH (Synthetic)");
  assert.equal(de.model.buyer.city, "Berlin");
  assert.equal(rc.model.buyer.name, "Demo SARL (Synthetic FR)");
  assert.equal(rc.model.buyer.countryCode, "FR");
});

test("F — VAT IDs parsed correctly", () => {
  const de = parseEInvoiceXml(DE_XML);
  const rc = parseEInvoiceXml(RC_XML);
  assert.equal(de.ok, true);
  assert.equal(rc.ok, true);
  if (!de.ok || !rc.ok) return;
  assert.equal(de.model.seller.vatId, "DE449657077");
  assert.equal(de.model.buyer.vatId, "DE111111111");
  assert.equal(rc.model.buyer.vatId, "FR12345678901");
});

test("G — Line item parsed correctly", () => {
  const result = parseEInvoiceXml(RC_XML);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.model.lines.length, 1);
  const line = result.model.lines[0];
  assert.equal(line.lineId, "1");
  assert.match(line.description, /DEMO RC subscription/);
  assert.equal(line.quantity, "1");
  assert.equal(line.unitCode, "C62");
  assert.equal(line.netUnitPrice, "599.00");
  assert.equal(line.lineTotal, "599.00");
  assert.equal(line.taxCategoryCode, "AE");
});

test("H — Net/VAT/Gross parsed correctly", () => {
  const de = parseEInvoiceXml(DE_XML);
  assert.equal(de.ok, true);
  if (!de.ok) return;
  assert.equal(de.model.totals.taxBasisTotalAmount, "503.36");
  assert.equal(de.model.totals.taxTotalAmount, "95.64");
  assert.equal(de.model.totals.grandTotalAmount, "599.00");
  assert.equal(formatXmlMoney("503.36", "EUR"), "503,36\u00a0€");
  assert.equal(formatXmlMoney("95.64", "EUR"), "95,64\u00a0€");
  assert.equal(formatXmlMoney("599.00", "EUR"), "599,00\u00a0€");
});

test("I — Reverse Charge detected ONLY from structured AE semantics", () => {
  const rc = parseEInvoiceXml(RC_XML);
  assert.equal(rc.ok, true);
  if (!rc.ok) return;
  assert.equal(rc.model.isReverseCharge, true);
  assert.equal(rc.model.taxes[0]?.categoryCode, "AE");
  assert.equal(rc.model.taxes[0]?.exemptionReasonCode, "VATEX-EU-AE");

  // Zero VAT alone must NOT imply reverse charge without AE.
  const zeroVatDomestic = DE_XML.replace(
    /<ram:CategoryCode>S<\/ram:CategoryCode>/g,
    "<ram:CategoryCode>Z</ram:CategoryCode>",
  )
    .replace(/<ram:RateApplicablePercent>19\.00<\/ram:RateApplicablePercent>/g, "<ram:RateApplicablePercent>0.00</ram:RateApplicablePercent>")
    .replace(/<ram:CalculatedAmount>95\.64<\/ram:CalculatedAmount>/, "<ram:CalculatedAmount>0.00</ram:CalculatedAmount>")
    .replace(/<ram:TaxTotalAmount currencyID="EUR">95\.64<\/ram:TaxTotalAmount>/, '<ram:TaxTotalAmount currencyID="EUR">0.00</ram:TaxTotalAmount>')
    .replace(/<ram:GrandTotalAmount>599\.00<\/ram:GrandTotalAmount>/, "<ram:GrandTotalAmount>503.36</ram:GrandTotalAmount>")
    .replace(/<ram:DuePayableAmount>599\.00<\/ram:DuePayableAmount>/, "<ram:DuePayableAmount>503.36</ram:DuePayableAmount>");
  const z = parseEInvoiceXml(zeroVatDomestic);
  assert.equal(z.ok, true);
  if (!z.ok) return;
  assert.equal(z.model.isReverseCharge, false);
  assert.equal(z.model.taxes[0]?.categoryCode, "Z");
});

test("J — S tax category renders normal VAT", () => {
  const de = parseEInvoiceXml(DE_XML);
  assert.equal(de.ok, true);
  if (!de.ok) return;
  assert.equal(de.model.hasStandardVat, true);
  assert.equal(de.model.isReverseCharge, false);
  assert.equal(de.model.taxes[0]?.categoryCode, "S");
  assert.equal(de.model.taxes[0]?.ratePercent, "19.00");
  assert.equal(de.model.taxes[0]?.calculatedAmount, "95.64");
});

test("K — Service period parsed correctly", () => {
  const de = parseEInvoiceXml(DE_XML);
  assert.equal(de.ok, true);
  if (!de.ok) return;
  assert.equal(de.model.servicePeriod.start, "20260801");
  assert.equal(de.model.servicePeriod.end, "20260831");
  assert.equal(
    formatServicePeriodLabel(de.model.servicePeriod.start, de.model.servicePeriod.end),
    "01.08.2026 – 31.08.2026",
  );
  assert.equal(formatCiiDate102(de.model.issueDate), "31.08.2026");
});

test("L — Multiple lines supported", () => {
  const result = parseEInvoiceXml(multiLineXml());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.model.lines.length, 2);
  assert.equal(result.model.lines[0]?.lineId, "1");
  assert.equal(result.model.lines[1]?.lineId, "2");
  assert.equal(result.model.lines[1]?.description, "Second line (synthetic multi-line fixture)");
  assert.equal(result.model.lines[1]?.lineTotal, "20.00");
  assert.ok(
    result.model.warnings.some((w) => w.code === "LINE_SUM_MISMATCH"),
    "optional consistency warning expected when line sum != XML total",
  );
});

test("M — Malformed XML rejected", () => {
  const result = parseEInvoiceXml("<rsm:CrossIndustryInvoice><broken>");
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "MALFORMED");
  assert.match(result.message, /sicher gelesen/);
});

test("N — Unsupported profile rejected/warned safely", () => {
  const result = parseEInvoiceXml(withGuideline(DE_XML, "urn:example:unsupported"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.model.technical.profileSupported, false);
  assert.ok(result.model.warnings.some((w) => w.code === "UNSUPPORTED_PROFILE"));
});

test("O — XXE/DOCTYPE rejected", () => {
  const xxe = `<?xml version="1.0"?>
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100">&xxe;</rsm:CrossIndustryInvoice>`;
  const result = parseEInvoiceXml(xxe);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "UNSAFE_XML");
});

test("P — HTML/script content escaped (stored as plain text, not executable HTML)", () => {
  // Well-formed XML carries markup as character entities; parser must decode to text only.
  const injected = DE_XML.replace(
    "Auroranexis Business — DEMO subscription (synthetic)",
    "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
  );
  const result = parseEInvoiceXml(injected);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.model.lines[0]?.description, '<script>alert("xss")</script>');
  // React text nodes escape; UI must not use dangerouslySetInnerHTML.
  const ui = readSource("src/components/einvoice-viewer/EInvoiceViewer.tsx");
  assert.doesNotMatch(ui, /dangerouslySetInnerHTML/);
  for (const file of collectViewerSources()) {
    const src = readSource(file);
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/, file);
  }
});

test("Q — Missing required display information fails safely", () => {
  const missingSum = DE_XML.replace(
    /<ram:SpecifiedTradeSettlementHeaderMonetarySummation>[\s\S]*?<\/ram:SpecifiedTradeSettlementHeaderMonetarySummation>/,
    "",
  );
  const result = parseEInvoiceXml(missingSum);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "MISSING_REQUIRED");
});

test("R — XML values are not silently recalculated", () => {
  const result = parseEInvoiceXml(DE_XML);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  // Display formatting must not change source totals on the model.
  assert.equal(result.model.totals.grandTotalAmount, "599.00");
  assert.equal(result.model.totals.taxTotalAmount, "95.64");
  assert.equal(result.model.totals.taxBasisTotalAmount, "503.36");
  // Even with multi-line mismatch, XML totals stay authoritative.
  const multi = parseEInvoiceXml(multiLineXml());
  assert.equal(multi.ok, true);
  if (!multi.ok) return;
  assert.equal(multi.model.totals.lineTotalAmount, "503.36");
  assert.equal(multi.model.totals.grandTotalAmount, "599.00");
});

test("S — Demo marker detected correctly", () => {
  const de = parseEInvoiceXml(DE_XML);
  assert.equal(de.ok, true);
  if (!de.ok) return;
  assert.equal(de.model.isDemo, true);

  const withoutDemo = DE_XML.replace(
    /DEMO\/NOT LEGAL — synthetic sample for engineering review only\./,
    "Ordinary commercial note",
  );
  const clean = parseEInvoiceXml(withoutDemo);
  assert.equal(clean.ok, true);
  if (!clean.ok) return;
  assert.equal(clean.model.isDemo, false);
});

test("T — Raw XML corresponds to input artifact", () => {
  const result = parseEInvoiceXml(DE_XML);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.model.rawXml, DE_XML);
  const rc = parseEInvoiceXml(RC_XML);
  assert.equal(rc.ok, true);
  if (!rc.ok) return;
  assert.equal(rc.model.rawXml, RC_XML);
});

test("billing isolation — VIEWER_BILLING_DEPENDENCIES = 0", () => {
  const forbidden = [
    /@\/lib\/billing\//,
    /src\/lib\/billing\//,
    /@\/lib\/mollie/,
    /from\s+["'].*mollie/,
    /checkout/,
    /subscription/,
    /entitlement/,
    /issueSalesInvoice/,
    /sales-invoice-from-mollie/,
    /allocate_sales_invoice_number/,
  ];
  const softAllowCheckoutWordInComments = false;
  void softAllowCheckoutWordInComments;

  let hits = 0;
  for (const file of collectViewerSources()) {
    const src = readSource(file);
    for (const pattern of forbidden) {
      // Allow the literal product word only outside import paths for "checkout/subscription"
      if (pattern.source === "checkout" || pattern.source === "subscription" || pattern.source === "entitlement") {
        if (
          /import[\s\S]*checkout|from\s+["'][^"']*checkout|import[\s\S]*subscription|from\s+["'][^"']*subscription|import[\s\S]*entitlement|from\s+["'][^"']*entitlement/.test(
            src,
          )
        ) {
          hits += 1;
          assert.fail(`${file} has forbidden billing dependency matching ${pattern}`);
        }
        continue;
      }
      if (pattern.test(src)) {
        hits += 1;
        assert.fail(`${file} matches forbidden pattern ${pattern}`);
      }
    }
  }
  assert.equal(hits, 0, "VIEWER_BILLING_DEPENDENCIES must be 0");
});

test("generator isolation — VIEWER_GENERATOR_EXECUTION = 0", () => {
  const forbiddenCalls = [
    /generateEInvoice/,
    /generateEInvoiceFromIssuedSnapshot/,
    /generateZugferdEn16931Xml/,
    /adaptIssuedInvoiceToCanonical/,
    /buildDemoDomesticIssuedSnapshot/,
    /buildDemoReverseChargeIssuedSnapshot/,
  ];
  for (const file of collectViewerSources()) {
    const src = readSource(file);
    assert.doesNotMatch(src, /@\/lib\/einvoice\//, `${file} must not import generator package`);
    for (const pattern of forbiddenCalls) {
      assert.doesNotMatch(src, pattern, `${file} must not call ${pattern}`);
    }
  }
});

test("freeze proof — no billing/generator semantic diffs vs cdd03c5", () => {
  const paths = [
    "src/lib/billing",
    "src/lib/einvoice",
    "src/app/api/mollie",
    "src/app/api/billing",
    "supabase/migrations",
  ];
  const diff = execSync(`git diff cdd03c5 -- ${paths.join(" ")}`, {
    cwd: rootDir,
    encoding: "utf8",
  });
  assert.equal(diff.trim(), "", `Freeze violation:\n${diff.slice(0, 2000)}`);
});

test("preview route is not an open production surface", () => {
  const page = readSource("src/app/internal/einvoice-preview/page.tsx");
  assert.match(page, /isEInvoiceViewerPreviewAllowed/);
  assert.match(page, /notFound/);
  assert.match(page, /robots:\s*\{\s*index:\s*false/);
  const catalog = readSource("src/lib/seo/route-catalog.ts");
  assert.match(catalog, /\/internal/);
  const middleware = readSource("src/lib/supabase/middleware.ts");
  assert.match(middleware, /\/internal\/einvoice-preview/);
  assert.match(middleware, /NODE_ENV !== "production"/);
  const robots = readSource("src/lib/seo/robots.ts");
  assert.match(robots, /\/internal/);
});
