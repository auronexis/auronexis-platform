/**
 * Write SAFE DEMO e-invoice artifacts under artifacts/einvoice-demo/.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs scripts/einvoice-demo-generate.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(rootDir, "artifacts", "einvoice-demo");

const {
  buildDemoDomesticIssuedSnapshot,
  buildDemoReverseChargeIssuedSnapshot,
  generateEInvoiceFromIssuedSnapshot,
} = await import("../src/lib/einvoice/index.ts");

mkdirSync(outDir, { recursive: true });

const samples = [
  buildDemoDomesticIssuedSnapshot(),
  buildDemoReverseChargeIssuedSnapshot(),
];

const summary = [];

for (const snapshot of samples) {
  const result = generateEInvoiceFromIssuedSnapshot(snapshot);
  if (!result.ok) {
    throw new Error(`Demo generation failed for ${snapshot.invoiceNumber}: ${result.code} ${result.message}`);
  }
  if (result.validation.status !== "VALID") {
    throw new Error(
      `Demo validation INVALID for ${snapshot.invoiceNumber}: ${JSON.stringify(result.validation.findings)}`,
    );
  }

  const { artifacts } = result;
  writeFileSync(join(outDir, artifacts.xmlFilename), artifacts.xml, "utf8");
  writeFileSync(join(outDir, artifacts.validationReportFilename), artifacts.validationReport, "utf8");
  writeFileSync(join(outDir, artifacts.mappingReportFilename), artifacts.mappingReport, "utf8");

  summary.push({
    invoiceNumber: snapshot.invoiceNumber,
    taxPolicyOutcome: snapshot.taxPolicyOutcome,
    validation: result.validation.status,
    xml: artifacts.xmlFilename,
    validationReport: artifacts.validationReportFilename,
    mappingReport: artifacts.mappingReportFilename,
    netMinor: snapshot.netMinor,
    vatMinor: snapshot.vatMinor,
    grossMinor: snapshot.grossMinor,
  });
}

const indexMd = [
  "# E-Invoice Demo Artifacts",
  "",
  "DEMO/NOT LEGAL — synthetic samples for engineering review only.",
  "Target profile: ZUGFeRD 2.5.2 / Factur-X EN 16931 (not MINIMUM/BASIC-WL).",
  "PDF/A-3 hybrid: not produced (existing sales-invoice PDF renderer remains READ-ONLY).",
  "",
  "## Samples",
  "",
  ...summary.map(
    (s) =>
      `- **${s.invoiceNumber}** (${s.taxPolicyOutcome}) — validation ${s.validation}; XML \`${s.xml}\`; net/vat/gross minor ${s.netMinor}/${s.vatMinor}/${s.grossMinor}`,
  ),
  "",
  "OPERATOR REVIEW REQUIRED before any production legal use.",
  "",
].join("\n");

writeFileSync(join(outDir, "README.md"), indexMd, "utf8");
writeFileSync(join(outDir, "demo-summary.json"), JSON.stringify({ demoNotLegal: true, samples: summary }, null, 2), "utf8");

console.log(JSON.stringify({ ok: true, outDir, samples: summary }, null, 2));
