/**
 * Synthetic e-invoice archive proof (not production data).
 * Generates demo DE + EU RC archives into artifacts/einvoice-archive-proof/.
 *
 * Run:
 *   npm run generate:einvoice-archive-proof
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(rootDir, "artifacts", "einvoice-archive-proof");

const einvoice = await import("../src/lib/einvoice/index.ts");
const archive = await import("../src/lib/einvoice-archive/index.ts");

const {
  generateEInvoiceFromIssuedSnapshot,
  buildDemoDomesticIssuedSnapshot,
  buildDemoReverseChargeIssuedSnapshot,
} = einvoice;

const {
  archiveValidatedEInvoice,
  createMemoryArchivePorts,
  issuedSnapshotToArchiveSource,
  sha256Hex,
  buildTaxAuditExportManifest,
  DE_USTG_14B_LEGAL_BASIS,
} = archive;

const ORG_ID = "00000000-0000-4000-8000-000000000001";
const DE_INVOICE_ID = "00000000-0000-4000-8000-0000000000de";
const RC_INVOICE_ID = "00000000-0000-4000-8000-0000000000rc";

const GENERATOR = {
  module: "src/lib/einvoice",
  pipeline: "generateEInvoiceFromIssuedSnapshot",
  standardVersion: "zugferd-2.5.2",
};

function writeProof(name, contents) {
  writeFileSync(join(outDir, name), contents);
}

mkdirSync(outDir, { recursive: true });

const ports = createMemoryArchivePorts();
const cases = [
  { id: DE_INVOICE_ID, snapshot: buildDemoDomesticIssuedSnapshot() },
  { id: RC_INVOICE_ID, snapshot: buildDemoReverseChargeIssuedSnapshot() },
];

const records = [];

for (const item of cases) {
  const pipeline = generateEInvoiceFromIssuedSnapshot(item.snapshot);
  if (!pipeline.ok) {
    throw new Error(`Demo pipeline failed for ${item.snapshot.invoiceNumber}`);
  }
  const xmlBytes = Buffer.from(pipeline.xml, "utf8");
  ports.invoices.seed(
    issuedSnapshotToArchiveSource({
      organizationId: ORG_ID,
      salesInvoiceId: item.id,
      snapshot: item.snapshot,
    }),
  );

  const archived = await archiveValidatedEInvoice(
    {
      actorOrganizationId: ORG_ID,
      actorUserId: null,
      salesInvoiceId: item.id,
      xmlBytes,
      generator: GENERATOR,
    },
    ports,
  );
  if (!archived.ok) {
    throw new Error(`Archive failed for ${item.snapshot.invoiceNumber}: ${archived.code}`);
  }

  const digest = sha256Hex(xmlBytes);
  writeProof(`${item.snapshot.invoiceNumber}.xml`, xmlBytes);
  writeProof(`${item.snapshot.invoiceNumber}.sha256.txt`, `${digest}\n`);
  writeProof(
    `${item.snapshot.invoiceNumber}.metadata.json`,
    `${JSON.stringify(
      {
        ...archived.record,
        note: "SYNTHETIC DEMO — NOT LEGAL / NOT PRODUCTION",
      },
      null,
      2,
    )}\n`,
  );
  records.push(archived.record);
}

const manifest = buildTaxAuditExportManifest({
  organizationId: ORG_ID,
  records,
});
writeProof("tax-audit-export-foundation.json", `${JSON.stringify(manifest, null, 2)}\n`);

writeProof(
  "README.md",
  `# E-Invoice Immutable Compliance Archive — Demo Proof

Synthetic only. Invoice numbers:
- TEST-EINV-2026-000001 (DE domestic)
- TEST-EINV-RC-2026-000001 (EU reverse charge)

No secrets. No production data. No production storage write.

Retention policy metadata uses UStG §14b (generally 8 years) explicitly:
${DE_USTG_14B_LEGAL_BASIS}

SHA-256 files must match XML byte hashes.
Tax audit export foundation is not a Finanzamt submission protocol.

Generated-at: ${new Date().toISOString()}
`,
);

writeProof(
  "index.json",
  `${JSON.stringify(
    {
      organizationId: ORG_ID,
      invoices: records.map((row) => ({
        archiveId: row.id,
        invoiceNumber: row.invoiceNumberSnapshot,
        sha256: row.artifactSha256,
        sizeBytes: row.artifactSizeBytes,
        taxTreatment: row.taxTreatmentSnapshot,
      })),
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${records.length} archive proofs to ${outDir}`);
