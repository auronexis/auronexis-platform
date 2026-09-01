/**
 * Phase 10 — controlled e-invoice production integration tests.
 *
 * Run:
 *   npm run test:phase10
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import test from "node:test";
import { readSource, rootDir } from "./_test-helpers/read-source.mjs";

const BASELINE = "76eaed5";

const einvoice = await import("../src/lib/einvoice/index.ts");
const archiveMod = await import("../src/lib/einvoice-archive/index.ts");
const viewer = await import("../src/lib/einvoice-viewer/index.ts");
const integrationService = await import("../src/lib/einvoice-integration/service.ts");
const integrationSnapshot = await import("../src/lib/einvoice-integration/snapshot.ts");
const integrationTypes = await import("../src/lib/einvoice-integration/types.ts");

const {
  buildDemoDomesticIssuedSnapshot,
  buildDemoReverseChargeIssuedSnapshot,
  generateEInvoiceFromIssuedSnapshot,
} = einvoice;

const {
  createMemoryArchivePorts,
  issuedSnapshotToArchiveSource,
  sha256Hex,
  bytesEqual,
  loadArchivedEInvoiceForDownload,
  loadArchivedEInvoiceForView,
  archiveValidatedEInvoice,
  EINVOICE_ARCHIVE_AUDIT_EVENTS,
} = archiveMod;

const { parseEInvoiceXml } = viewer;

const {
  archiveEInvoiceForIssuedSalesInvoice,
} = integrationService;

const { salesInvoiceRecordToIssuedSnapshot } = integrationSnapshot;

const { E_INVOICE_INTEGRATION_AUDIT_EVENTS } = integrationTypes;

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";
const INVOICE_DE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const INVOICE_RC = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

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

function seedInvoice(ports, organizationId, salesInvoiceId, snapshot) {
  ports.invoices.seed(
    issuedSnapshotToArchiveSource({
      organizationId,
      salesInvoiceId,
      snapshot,
    }),
  );
}

function buildSalesInvoiceRecordFromSnapshot(snapshot, organizationId, id) {
  return {
    id,
    organizationId,
    invoiceNumber: snapshot.invoiceNumber,
    status: snapshot.status,
    currency: snapshot.currency,
    netMinor: snapshot.netMinor,
    vatRateBps: snapshot.vatRateBps,
    vatMinor: snapshot.vatMinor,
    grossMinor: snapshot.grossMinor,
    taxPolicyOutcome: snapshot.taxPolicyOutcome,
    businessClassification: snapshot.businessClassification,
    reverseChargeApplied: snapshot.reverseChargeApplied,
    billingPeriodStart: snapshot.billingPeriodStart,
    billingPeriodEnd: snapshot.billingPeriodEnd,
    molliePaymentId: null,
    providerTransactionId: null,
    buyerLegalName: snapshot.buyer.legalName,
    buyerVatId: snapshot.buyer.vatId,
    buyerCountryCode: snapshot.buyer.countryCode,
    buyerAddressLine1: snapshot.buyer.addressLine1,
    buyerAddressLine2: snapshot.buyer.addressLine2,
    buyerPostalCode: snapshot.buyer.postalCode,
    buyerCity: snapshot.buyer.city,
    buyerBillingEmail: snapshot.buyer.billingEmail,
    sellerSnapshot: {
      legalName: snapshot.seller.legalName,
      vatId: snapshot.seller.vatId,
      countryCode: snapshot.seller.countryCode,
      addressLines: snapshot.seller.addressLines,
      configStatus: "ready",
    },
    taxDecisionEvidence: null,
    issuedAt: snapshot.issuedAt,
    lines: snapshot.lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitGrossMinor: line.unitGrossMinor,
      lineGrossMinor: line.lineGrossMinor,
      lineNetMinor: line.lineNetMinor,
      lineVatMinor: line.lineVatMinor,
    })),
    taxNote: snapshot.taxNote,
    createdAt: snapshot.createdAt,
  };
}

test("DE B2B — full integration path with hash equality", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  seedInvoice(ports, ORG_A, INVOICE_DE, snapshot);

  const generated = generateEInvoiceFromIssuedSnapshot(snapshot);
  assert.equal(generated.ok, true);
  if (!generated.ok) return;
  const generatorHash = sha256Hex(Buffer.from(generated.xml, "utf8"));

  const result = await archiveEInvoiceForIssuedSalesInvoice({
    organizationId: ORG_A,
    salesInvoiceId: INVOICE_DE,
    ports,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.reused, false);

  const downloaded = await loadArchivedEInvoiceForDownload(
    { organizationId: ORG_A, archiveId: result.archiveId },
    ports,
  );
  assert.equal(downloaded.ok, true);
  if (!downloaded.ok) return;
  assert.equal(sha256Hex(downloaded.bytes), generatorHash);
  assert.equal(downloaded.record.artifactSha256, generatorHash);

  const viewed = await loadArchivedEInvoiceForView(
    { organizationId: ORG_A, archiveId: result.archiveId },
    ports,
  );
  assert.equal(viewed.ok, true);
  if (!viewed.ok) return;
  const parsed = parseEInvoiceXml(viewed.xml);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.model.invoiceNumber, "TEST-EINV-2026-000001");
});

test("EU RC — full integration path preserves reverse charge", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoReverseChargeIssuedSnapshot();
  seedInvoice(ports, ORG_A, INVOICE_RC, snapshot);

  const result = await archiveEInvoiceForIssuedSalesInvoice({
    organizationId: ORG_A,
    salesInvoiceId: INVOICE_RC,
    ports,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const viewed = await loadArchivedEInvoiceForView(
    { organizationId: ORG_A, archiveId: result.archiveId },
    ports,
  );
  assert.equal(viewed.ok, true);
  if (!viewed.ok) return;
  const parsed = parseEInvoiceXml(viewed.xml);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.match(viewed.xml, /VATEX-EU-AE|AE/);
  assert.equal(parsed.model.invoiceNumber, "TEST-EINV-RC-2026-000001");
});

test("unsupported case — fail closed without archive", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  snapshot.buyer.legalName = null;
  seedInvoice(ports, ORG_A, INVOICE_DE, snapshot);

  const result = await archiveEInvoiceForIssuedSalesInvoice({
    organizationId: ORG_A,
    salesInvoiceId: INVOICE_DE,
    ports,
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "UNSUPPORTED");
  assert.equal(ports.metadata.rows.size, 0);
});

test("draft/unissued — rejected", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  snapshot.status = "draft";
  seedInvoice(ports, ORG_A, INVOICE_DE, snapshot);

  const result = await archiveEInvoiceForIssuedSalesInvoice({
    organizationId: ORG_A,
    salesInvoiceId: INVOICE_DE,
    ports,
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "NOT_ISSUED");
  assert.equal(ports.metadata.rows.size, 0);
});

test("duplicate invocation — idempotent reuse", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  seedInvoice(ports, ORG_A, INVOICE_DE, snapshot);

  const first = await archiveEInvoiceForIssuedSalesInvoice({
    organizationId: ORG_A,
    salesInvoiceId: INVOICE_DE,
    ports,
  });
  const second = await archiveEInvoiceForIssuedSalesInvoice({
    organizationId: ORG_A,
    salesInvoiceId: INVOICE_DE,
    ports,
  });
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.equal(second.reused, true);
  assert.equal(first.archiveId, second.archiveId);
  assert.equal(ports.metadata.rows.size, 1);
});

test("concurrent invocation — single archive artifact", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  seedInvoice(ports, ORG_A, INVOICE_DE, snapshot);

  const [a, b] = await Promise.all([
    archiveEInvoiceForIssuedSalesInvoice({
      organizationId: ORG_A,
      salesInvoiceId: INVOICE_DE,
      ports,
    }),
    archiveEInvoiceForIssuedSalesInvoice({
      organizationId: ORG_A,
      salesInvoiceId: INVOICE_DE,
      ports,
    }),
  ]);
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  if (!a.ok || !b.ok) return;
  assert.equal(ports.metadata.rows.size, 1);
  const ids = new Set([a.archiveId, b.archiveId]);
  assert.equal(ids.size, 1);
});

test("integrity conflict — different bytes rejected", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  seedInvoice(ports, ORG_A, INVOICE_DE, snapshot);

  const generated = generateEInvoiceFromIssuedSnapshot(snapshot);
  assert.equal(generated.ok, true);
  if (!generated.ok) return;
  const tampered = Buffer.from(`${generated.xml.slice(0, -10)}<!--x-->`);
  const pre = await archiveValidatedEInvoice(
    {
      actorOrganizationId: ORG_A,
      salesInvoiceId: INVOICE_DE,
      xmlBytes: tampered,
      generator: {
        module: "test",
        pipeline: "tampered",
        standardVersion: "zugferd-2.5.2",
      },
    },
    ports,
  );
  assert.equal(pre.ok, true);
  if (!pre.ok) return;

  const result = await archiveEInvoiceForIssuedSalesInvoice({
    organizationId: ORG_A,
    salesInvoiceId: INVOICE_DE,
    ports,
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "INTEGRITY_CONFLICT");
});

test("storage failure — invoice integration reports failure", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  seedInvoice(ports, ORG_A, INVOICE_DE, snapshot);
  ports.objects.failNextPut = true;

  const result = await archiveEInvoiceForIssuedSalesInvoice({
    organizationId: ORG_A,
    salesInvoiceId: INVOICE_DE,
    ports,
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "STORAGE_FAILED");
  assert.equal(ports.metadata.rows.size, 0);
});

test("validation failure — incomplete seller blocks before archive", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  snapshot.seller.vatId = null;
  seedInvoice(ports, ORG_A, INVOICE_DE, snapshot);

  const result = await archiveEInvoiceForIssuedSalesInvoice({
    organizationId: ORG_A,
    salesInvoiceId: INVOICE_DE,
    ports,
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "UNSUPPORTED");
  assert.equal(ports.metadata.rows.size, 0);
});

test("tenant attack — org B cannot archive org A invoice", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  seedInvoice(ports, ORG_A, INVOICE_DE, snapshot);

  const result = await archiveEInvoiceForIssuedSalesInvoice({
    organizationId: ORG_B,
    salesInvoiceId: INVOICE_DE,
    ports,
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "INVOICE_NOT_FOUND");
});

test("cross-tenant download blocked at archive layer", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  seedInvoice(ports, ORG_A, INVOICE_DE, snapshot);
  const archived = await archiveEInvoiceForIssuedSalesInvoice({
    organizationId: ORG_A,
    salesInvoiceId: INVOICE_DE,
    ports,
  });
  assert.equal(archived.ok, true);
  if (!archived.ok) return;

  const blocked = await loadArchivedEInvoiceForDownload(
    { organizationId: ORG_B, archiveId: archived.archiveId },
    ports,
  );
  assert.equal(blocked.ok, false);
});

test("historical immutability — archived XML unchanged after snapshot mutation", async () => {
  const ports = createMemoryArchivePorts();
  const snapshot = buildDemoDomesticIssuedSnapshot();
  seedInvoice(ports, ORG_A, INVOICE_DE, snapshot);
  const archived = await archiveEInvoiceForIssuedSalesInvoice({
    organizationId: ORG_A,
    salesInvoiceId: INVOICE_DE,
    ports,
  });
  assert.equal(archived.ok, true);
  if (!archived.ok) return;

  snapshot.invoiceNumber = "MUTATED";
  snapshot.grossMinor = 1;
  const viewed = await loadArchivedEInvoiceForView(
    { organizationId: ORG_A, archiveId: archived.archiveId },
    ports,
  );
  assert.equal(viewed.ok, true);
  if (!viewed.ok) return;
  const parsed = parseEInvoiceXml(viewed.xml);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.model.invoiceNumber, "TEST-EINV-2026-000001");
});

test("snapshot mapper copies issued invoice without recalculation", () => {
  const snapshot = buildDemoDomesticIssuedSnapshot();
  const record = buildSalesInvoiceRecordFromSnapshot(snapshot, ORG_A, INVOICE_DE);
  const mapped = salesInvoiceRecordToIssuedSnapshot(record);
  assert.equal(mapped.invoiceNumber, snapshot.invoiceNumber);
  assert.equal(mapped.grossMinor, snapshot.grossMinor);
  assert.equal(mapped.netMinor, snapshot.netMinor);
  assert.equal(mapped.vatMinor, snapshot.vatMinor);
});

test("billing freeze — core billing semantics unchanged vs baseline", () => {
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
    assert.fail(`PHASE10_BILLING_SEMANTICS_FREEZE_VIOLATION\n${diff.slice(0, 4000)}`);
  }

  const salesInvoice = readSource("src/lib/billing/sales-invoice.ts");
  assert.match(salesInvoice, /integrateIssuedSalesInvoiceWithEInvoiceArchive/);
  assert.match(salesInvoice, /invoice retained/);
  assert.doesNotMatch(salesInvoice, /rollback|delete.*sales_invoice/i);
});

test("generator freeze — src/lib/einvoice unchanged vs baseline", () => {
  const diff = gitDiff(["src/lib/einvoice/"]);
  if (diff.trim().length > 0) {
    assert.fail(`PHASE10_GENERATOR_FREEZE_VIOLATION\n${diff.slice(0, 4000)}`);
  }
});

test("archive freeze — archive core unchanged vs baseline", () => {
  const diff = gitDiff([
    "src/lib/einvoice-archive/archive.ts",
    "src/lib/einvoice-archive/types.ts",
    "supabase/migrations/20260901120000_einvoice_immutable_compliance_archive.sql",
  ]);
  if (diff.trim().length > 0) {
    assert.fail(`PHASE10_ARCHIVE_FREEZE_VIOLATION\n${diff.slice(0, 4000)}`);
  }
});

test("integration wiring — post-issuance hook and customer download route exist", () => {
  const salesInvoice = readSource("src/lib/billing/sales-invoice.ts");
  assert.match(salesInvoice, /integrateIssuedSalesInvoiceWithEInvoiceArchive/);

  const route = readSource("src/app/api/billing/sales-invoices/[invoiceId]/einvoice/route.ts");
  assert.match(route, /loadCustomerEInvoiceXmlForSalesInvoice/);
  assert.doesNotMatch(route, /generateEInvoiceFromIssuedSnapshot/);

  const panel = readSource("src/components/settings/billing-history-panel.tsx");
  assert.match(panel, /Download E-Invoice \(XML\)/);
  assert.match(panel, /hasArchivedEInvoice/);

  const service = readSource("src/lib/einvoice-integration/service.ts");
  assert.match(service, /generateEInvoiceFromIssuedSnapshot/);
  assert.match(service, /archiveValidatedEInvoice/);
  assert.match(service, /validation\.status !== "VALID"/);
});

test("audit events — archived and integration failure vocabulary", () => {
  assert.equal(EINVOICE_ARCHIVE_AUDIT_EVENTS.archived, "E_INVOICE_ARCHIVED");
  assert.equal(EINVOICE_ARCHIVE_AUDIT_EVENTS.downloaded, "E_INVOICE_DOWNLOADED");
  assert.equal(E_INVOICE_INTEGRATION_AUDIT_EVENTS.integrationFailed, "E_INVOICE_INTEGRATION_FAILED");
});

test("compliance navigation preserved", () => {
  const compliance = readSource("src/app/(dashboard)/dashboard/compliance/page.tsx");
  assert.match(compliance, /E-Invoice Archive/);
  assert.match(compliance, /\/dashboard\/compliance\/einvoice-archive/);
});

test("validate-before-archive sequence enforced in service", () => {
  const service = readSource("src/lib/einvoice-integration/service.ts");
  const generateIdx = service.indexOf("generateEInvoiceFromIssuedSnapshot(");
  const validateIdx = service.indexOf('generated.validation.status !== "VALID"');
  const archiveIdx = service.indexOf("await archiveValidatedEInvoice(");
  assert.ok(generateIdx >= 0 && validateIdx > generateIdx && archiveIdx > validateIdx);
});

test("customer download reads archive only — no regeneration in customer-download module", () => {
  const customer = readSource("src/lib/einvoice-integration/customer-download.ts");
  assert.match(customer, /loadArchivedEInvoiceForDownload/);
  assert.match(customer, /findEInvoiceArchiveBySalesInvoiceId/);
  assert.doesNotMatch(customer, /generateEInvoiceFromIssuedSnapshot/);
});
