/**
 * Immutable e-invoice compliance archive — Tests A–T.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/einvoice-archive.test.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { execSync } from "node:child_process";
import { readSource, rootDir } from "./_test-helpers/read-source.mjs";

const BASELINE = "5628764";

const einvoice = await import("../src/lib/einvoice/index.ts");
const archiveMod = await import("../src/lib/einvoice-archive/index.ts");
const viewer = await import("../src/lib/einvoice-viewer/index.ts");

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
  bytesEqual,
  loadArchivedEInvoiceForDownload,
  loadArchivedEInvoiceForView,
  verifyArchivedEInvoiceIntegrity,
  filterEInvoiceArchiveRecords,
  buildTaxAuditExportManifest,
  buildArchivedEInvoiceDownloadFilename,
  DE_USTG_14B_VAT_INVOICE_POLICY_ID,
  DE_USTG_14B_LEGAL_BASIS,
  EINVOICE_ARCHIVE_AUDIT_EVENTS,
} = archiveMod;

const { parseEInvoiceXml } = viewer;

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";
const INVOICE_DE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const INVOICE_RC = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const GENERATOR = {
  module: "src/lib/einvoice",
  pipeline: "generateEInvoiceFromIssuedSnapshot",
  standardVersion: "zugferd-2.5.2",
};

function gitDiff(paths) {
  try {
    return execSync(`git diff ${BASELINE} -- ${paths.join(" ")}`, {
      cwd: rootDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    return String(error?.stdout ?? error?.message ?? error);
  }
}

function buildXmlBytes(snapshot) {
  const result = generateEInvoiceFromIssuedSnapshot(snapshot);
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("pipeline failed");
  return Buffer.from(result.xml, "utf8");
}

function seedPorts(ports, organizationId, salesInvoiceId, snapshot) {
  ports.invoices.seed(
    issuedSnapshotToArchiveSource({
      organizationId,
      salesInvoiceId,
      snapshot,
    }),
  );
}

async function archiveDemo(ports, organizationId, salesInvoiceId, snapshot, xmlBytes) {
  seedPorts(ports, organizationId, salesInvoiceId, snapshot);
  return archiveValidatedEInvoice(
    {
      actorOrganizationId: organizationId,
      salesInvoiceId,
      xmlBytes,
      generator: GENERATOR,
    },
    ports,
  );
}

test("A — valid archive commits metadata + original bytes coherently", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  const xmlBytes = buildXmlBytes(snapshot);
  const result = await archiveDemo(ports, ORG_A, INVOICE_DE, snapshot, xmlBytes);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.reused, false);
  assert.equal(result.record.invoiceNumberSnapshot, "TEST-EINV-2026-000001");
  assert.equal(result.record.validationStatus, "VALID");
  const stored = await ports.objects.get(result.record.artifactStorageKey);
  assert.ok(stored);
  assert.ok(bytesEqual(stored, xmlBytes));
  assert.ok(
    ports.audit.events.some((e) => e.eventType === EINVOICE_ARCHIVE_AUDIT_EVENTS.archived),
  );
});

test("B — original XML bytes are preserved exactly (no pretty-print rewrite)", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  const xmlBytes = buildXmlBytes(snapshot);
  const awkward = Buffer.concat([xmlBytes, Buffer.from("")]);
  const result = await archiveDemo(ports, ORG_A, INVOICE_DE, snapshot, awkward);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const stored = await ports.objects.get(result.record.artifactStorageKey);
  assert.deepEqual(Buffer.from(stored), Buffer.from(awkward));
});

test("C — SHA-256 of stored bytes matches metadata", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  const xmlBytes = buildXmlBytes(snapshot);
  const result = await archiveDemo(ports, ORG_A, INVOICE_DE, snapshot, xmlBytes);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.record.artifactSha256, sha256Hex(xmlBytes));
  assert.equal(result.record.artifactSizeBytes, xmlBytes.byteLength);
});

test("D — download returns original bytes and deterministic filename", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  const xmlBytes = buildXmlBytes(snapshot);
  const archived = await archiveDemo(ports, ORG_A, INVOICE_DE, snapshot, xmlBytes);
  assert.equal(archived.ok, true);
  if (!archived.ok) return;
  const downloaded = await loadArchivedEInvoiceForDownload(
    { organizationId: ORG_A, archiveId: archived.record.id },
    ports,
  );
  assert.equal(downloaded.ok, true);
  if (!downloaded.ok) return;
  assert.ok(bytesEqual(downloaded.bytes, xmlBytes));
  assert.equal(
    downloaded.filename,
    buildArchivedEInvoiceDownloadFilename({
      invoiceNumber: "TEST-EINV-2026-000001",
      sha256Hex: archived.record.artifactSha256,
    }),
  );
  assert.equal(sha256Hex(downloaded.bytes), archived.record.artifactSha256);
});

test("E — idempotent reuse for same invoice + same bytes", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  const xmlBytes = buildXmlBytes(snapshot);
  const first = await archiveDemo(ports, ORG_A, INVOICE_DE, snapshot, xmlBytes);
  const second = await archiveDemo(ports, ORG_A, INVOICE_DE, snapshot, xmlBytes);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.equal(second.reused, true);
  assert.equal(second.record.id, first.record.id);
  assert.equal(ports.metadata.rows.size, 1);
});

test("F — same invoice + different hash fails closed (integrity conflict)", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  const xmlBytes = buildXmlBytes(snapshot);
  const first = await archiveDemo(ports, ORG_A, INVOICE_DE, snapshot, xmlBytes);
  assert.equal(first.ok, true);
  const mutated = Buffer.concat([xmlBytes, Buffer.from("\n")]);
  const second = await archiveValidatedEInvoice(
    {
      actorOrganizationId: ORG_A,
      salesInvoiceId: INVOICE_DE,
      xmlBytes: mutated,
      generator: GENERATOR,
    },
    ports,
  );
  assert.equal(second.ok, false);
  if (!second.ok) assert.equal(second.code, "INTEGRITY_CONFLICT");
});

test("G — missing invoice fails closed", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  const xmlBytes = buildXmlBytes(snapshot);
  const result = await archiveValidatedEInvoice(
    {
      actorOrganizationId: ORG_A,
      salesInvoiceId: INVOICE_DE,
      xmlBytes,
      generator: GENERATOR,
    },
    ports,
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "INVOICE_NOT_FOUND");
});

test("H — ownership / tenant mismatch fails closed", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  const xmlBytes = buildXmlBytes(snapshot);
  seedPorts(ports, ORG_A, INVOICE_DE, snapshot);
  const result = await archiveValidatedEInvoice(
    {
      actorOrganizationId: ORG_B,
      salesInvoiceId: INVOICE_DE,
      xmlBytes,
      generator: GENERATOR,
    },
    ports,
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.code === "INVOICE_NOT_FOUND" || result.code === "TENANT_MISMATCH");
  }
});

test("I — cross-tenant cannot list or read another org archive", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  const xmlBytes = buildXmlBytes(snapshot);
  const archived = await archiveDemo(ports, ORG_A, INVOICE_DE, snapshot, xmlBytes);
  assert.equal(archived.ok, true);
  if (!archived.ok) return;
  const listedB = await ports.metadata.list({ organizationId: ORG_B });
  assert.equal(listedB.length, 0);
  const readB = await loadArchivedEInvoiceForView(
    { organizationId: ORG_B, archiveId: archived.record.id },
    ports,
  );
  assert.equal(readB.ok, false);
});

test("J — unauthorized surfaces require session + settings.write (source contract)", () => {
  const listPage = readSource("src/app/(dashboard)/dashboard/compliance/einvoice-archive/page.tsx");
  const detailPage = readSource(
    "src/app/(dashboard)/dashboard/compliance/einvoice-archive/[id]/page.tsx",
  );
  const download = readSource(
    "src/app/(dashboard)/dashboard/compliance/einvoice-archive/[id]/download/route.ts",
  );
  assert.match(listPage, /canAccessEInvoiceArchive/);
  assert.match(detailPage, /canAccessEInvoiceArchive/);
  assert.match(download, /canAccessEInvoiceArchive|Unauthorized/);
  assert.match(download, /getSession/);
  assert.doesNotMatch(download, /public/);
});

test("K — storage failure does not report ARCHIVED", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  const xmlBytes = buildXmlBytes(snapshot);
  seedPorts(ports, ORG_A, INVOICE_DE, snapshot);
  ports.objects.failNextPut = true;
  const result = await archiveValidatedEInvoice(
    {
      actorOrganizationId: ORG_A,
      salesInvoiceId: INVOICE_DE,
      xmlBytes,
      generator: GENERATOR,
    },
    ports,
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "STORAGE_FAILED");
  assert.equal(ports.metadata.rows.size, 0);
});

test("L — metadata failure does not report ARCHIVED", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  const xmlBytes = buildXmlBytes(snapshot);
  seedPorts(ports, ORG_A, INVOICE_DE, snapshot);
  ports.metadata.failNextInsert = true;
  const result = await archiveValidatedEInvoice(
    {
      actorOrganizationId: ORG_A,
      salesInvoiceId: INVOICE_DE,
      xmlBytes,
      generator: GENERATOR,
    },
    ports,
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "METADATA_FAILED");
  assert.equal(
    ports.audit.events.some((e) => e.eventType === EINVOICE_ARCHIVE_AUDIT_EVENTS.archived),
    false,
  );
});

test("M — corruption / hash mismatch fails integrity verification", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  const xmlBytes = buildXmlBytes(snapshot);
  const archived = await archiveDemo(ports, ORG_A, INVOICE_DE, snapshot, xmlBytes);
  assert.equal(archived.ok, true);
  if (!archived.ok) return;
  ports.objects.corruptOnGet = true;
  const verified = await verifyArchivedEInvoiceIntegrity(
    { organizationId: ORG_A, archiveId: archived.record.id },
    ports,
  );
  assert.equal(verified.ok, false);
  assert.ok(
    ports.audit.events.some((e) => e.eventType === EINVOICE_ARCHIVE_AUDIT_EVENTS.integrityFailed),
  );
});

test("N — no overwrite/delete APIs and migration protects immutability", () => {
  const archiveSrc = readSource("src/lib/einvoice-archive/archive.ts");
  const objectsSrc = readSource("src/lib/einvoice-archive/supabase-ports.ts");
  const memorySrc = readSource("src/lib/einvoice-archive/memory.ts");
  assert.doesNotMatch(archiveSrc, /\.remove\(/);
  assert.doesNotMatch(objectsSrc, /\.remove\(/);
  assert.doesNotMatch(memorySrc, /delete\(|\.remove\(/);
  assert.match(objectsSrc, /upsert:\s*false/);
  const migration = readSource(
    "supabase/migrations/20260901120000_einvoice_immutable_compliance_archive.sql",
  );
  assert.match(migration, /einvoice_archive_protect_immutable/);
  assert.match(migration, /cannot be deleted/i);
  assert.match(migration, /immutable evidence fields cannot be updated/i);
  assert.doesNotMatch(migration, /ALTER TABLE public\.sales_invoices/);
});

test("O — viewer reads archived XML, not live billing", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  const xmlBytes = buildXmlBytes(snapshot);
  const archived = await archiveDemo(ports, ORG_A, INVOICE_DE, snapshot, xmlBytes);
  assert.equal(archived.ok, true);
  if (!archived.ok) return;
  const viewed = await loadArchivedEInvoiceForView(
    { organizationId: ORG_A, archiveId: archived.record.id },
    ports,
  );
  assert.equal(viewed.ok, true);
  if (!viewed.ok) return;
  const parsed = parseEInvoiceXml(viewed.xml);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.model.invoiceNumber, "TEST-EINV-2026-000001");
  const detail = readSource(
    "src/app/(dashboard)/dashboard/compliance/einvoice-archive/[id]/page.tsx",
  );
  assert.match(detail, /loadArchivedEInvoiceForView/);
  assert.match(detail, /ARCHIVED E-INVOICE/);
  assert.doesNotMatch(detail, /getSalesInvoiceForOrganization|issueSalesInvoice/);
});

test("P — billing snapshot mutation after archive does not change archived XML", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  const xmlBytes = buildXmlBytes(snapshot);
  const archived = await archiveDemo(ports, ORG_A, INVOICE_DE, snapshot, xmlBytes);
  assert.equal(archived.ok, true);
  if (!archived.ok) return;
  snapshot.invoiceNumber = "MUTATED-LIVE-BILLING";
  snapshot.grossMinor = 1;
  const viewed = await loadArchivedEInvoiceForView(
    { organizationId: ORG_A, archiveId: archived.record.id },
    ports,
  );
  assert.equal(viewed.ok, true);
  if (!viewed.ok) return;
  const parsed = parseEInvoiceXml(viewed.xml);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.model.invoiceNumber, "TEST-EINV-2026-000001");
  assert.notEqual(parsed.model.invoiceNumber, "MUTATED-LIVE-BILLING");
});

test("Q — billing freeze: core billing semantics unchanged vs baseline", () => {
  const diff = gitDiff([
    "src/lib/billing/taxes.ts",
    "src/lib/billing/tax-policy.ts",
    "src/lib/billing/sales-invoice-from-mollie.ts",
    "src/lib/billing/sales-invoice-email.ts",
    "src/lib/billing/sales-invoice-pdf.ts",
    "src/lib/billing/sales-invoice-render.ts",
    "src/app/api/mollie/",
  ]);
  if (diff.trim().length > 0) {
    assert.fail(`EINVOICE_ARCHIVE_BILLING_SEMANTICS_FREEZE_VIOLATION\n${diff.slice(0, 4000)}`);
  }

  const salesInvoice = readSource("src/lib/billing/sales-invoice.ts");
  assert.match(salesInvoice, /integrateIssuedSalesInvoiceWithEInvoiceArchive/);
  assert.match(salesInvoice, /invoice retained/);
});

test("R — generator freeze: src/lib/einvoice/** unchanged vs baseline", () => {
  const diff = gitDiff(["src/lib/einvoice/"]);
  if (diff.trim().length > 0) {
    assert.fail(`EINVOICE_GENERATOR_FREEZE_VIOLATION\n${diff.slice(0, 4000)}`);
  }
});

test("S — retention metadata is explicit 8-year §14b policy; no auto-delete", () => {
  const retention = readSource("src/lib/einvoice-archive/retention-policy.ts");
  assert.match(retention, /DE_USTG_14B/);
  assert.match(retention, /8 years/i);
  assert.doesNotMatch(retention, /must always be kept for 10 years/i);
  assert.equal(DE_USTG_14B_VAT_INVOICE_POLICY_ID, "de_ustg_14b_vat_invoice_records");
  assert.match(DE_USTG_14B_LEGAL_BASIS, /§14b/);
  const migration = readSource(
    "supabase/migrations/20260901120000_einvoice_immutable_compliance_archive.sql",
  );
  assert.match(migration, /informational only/i);
  assert.match(migration, /cannot be deleted/i);
  const jobs = readSource("src/lib/jobs/registry.ts");
  assert.doesNotMatch(jobs, /einvoice.?archive.?delet/i);
});

test("T — tax audit export foundation only; no public/unauth einvoice API routes", () => {
  const manifest = buildTaxAuditExportManifest({
    organizationId: ORG_A,
    records: [],
  });
  assert.equal(manifest.protocol, "NOT_FINANZAMT_SUBMISSION");
  assert.equal(manifest.kind, "einvoice_archive_tax_audit_foundation");

  const apiRoot = join(rootDir, "src", "app", "api");
  function walk(dir, acc = []) {
    if (!existsSync(dir)) return acc;
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) walk(p, acc);
      else if (ent.name === "route.ts" || ent.name === "route.js") acc.push(p.replace(/\\/g, "/"));
    }
    return acc;
  }
  const routes = walk(apiRoot);
  const einvoiceRoutes = routes.filter((p) => /einvoice|e-invoice|zugferd|factur/i.test(p));
  assert.deepEqual(
    einvoiceRoutes,
    [`${rootDir.replace(/\\/g, "/")}/src/app/api/billing/sales-invoices/[invoiceId]/einvoice/route.ts`],
  );
  const customerRoute = readSource("src/app/api/billing/sales-invoices/[invoiceId]/einvoice/route.ts");
  assert.match(customerRoute, /getSession/);
  assert.match(customerRoute, /canManageOrganizationSettings/);
  assert.match(customerRoute, /loadCustomerEInvoiceXmlForSalesInvoice/);

  const search = filterEInvoiceArchiveRecords(
    [
      {
        id: "1",
        organizationId: ORG_A,
        salesInvoiceId: INVOICE_DE,
        invoiceNumberSnapshot: "TEST-EINV-2026-000001",
        buyerNameSnapshot: "Demo GmbH",
        documentType: "380",
        format: "cii_xml",
        profile: "EN16931",
        standardVersion: "zugferd-2.5.2",
        artifactKind: "cii_xml",
        artifactProfileVersion: "zugferd-2.5.2-en16931",
        artifactStorageKey: "k",
        artifactSha256: "a".repeat(64),
        artifactSizeBytes: 10,
        currencySnapshot: "EUR",
        grossAmountMinorSnapshot: 59900,
        issueDateSnapshot: "2026-08-31",
        issueYear: 2026,
        sellerCountrySnapshot: "DE",
        buyerCountrySnapshot: "DE",
        taxTreatmentSnapshot: "STANDARD_DOMESTIC_VAT",
        archivedAt: "2026-09-01T00:00:00.000Z",
        createdAt: "2026-09-01T00:00:00.000Z",
        retention: {
          policyId: DE_USTG_14B_VAT_INVOICE_POLICY_ID,
          policyVersion: "2026.1",
          legalBasis: DE_USTG_14B_LEGAL_BASIS,
          jurisdiction: "DE",
          durationYears: 8,
          startAt: "2026-12-31",
          startBasis: "end_of_calendar_year_of_issue_date",
          retainUntil: "2034-12-31",
        },
        legalHold: false,
        legalHoldReason: null,
        legalHoldUpdatedAt: null,
        integrityStatus: "verified",
        lastVerifiedAt: null,
        lastVerificationErrorCode: null,
        generator: GENERATOR,
        validationStatus: "VALID",
      },
    ],
    { invoiceNumber: "TEST-EINV", year: "2026", integrity: "verified" },
  );
  assert.equal(search.length, 1);

  // EU RC sample also archives
  return (async () => {
    const ports = createMemoryArchivePorts();
    const snapshot = buildDemoReverseChargeIssuedSnapshot();
    const xmlBytes = buildXmlBytes(snapshot);
    const result = await archiveDemo(ports, ORG_A, INVOICE_RC, snapshot, xmlBytes);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.record.invoiceNumberSnapshot, "TEST-EINV-RC-2026-000001");
    assert.equal(result.record.taxTreatmentSnapshot, "REVERSE_CHARGE");
  })();
});

test("proof artifacts + write path not wired to Mollie/webhooks/email", () => {
  const proofDir = join(rootDir, "artifacts", "einvoice-archive-proof");
  if (existsSync(proofDir) && statSync(proofDir).isDirectory()) {
    assert.ok(existsSync(join(proofDir, "TEST-EINV-2026-000001.xml")));
    assert.ok(existsSync(join(proofDir, "TEST-EINV-RC-2026-000001.xml")));
    const xml = readFileSync(join(proofDir, "TEST-EINV-2026-000001.xml"));
    const digest = readFileSync(join(proofDir, "TEST-EINV-2026-000001.sha256.txt"), "utf8").trim();
    assert.equal(sha256Hex(xml), digest);
  }

  const billingWebhook = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.doesNotMatch(billingWebhook, /einvoice-archive|archiveValidatedEInvoice/);
  const email = readSource("src/lib/billing/sales-invoice-email.ts");
  assert.doesNotMatch(email, /einvoice-archive|archiveValidatedEInvoice/);
});
