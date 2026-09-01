import { copyBytes, sha256Hex } from "@/lib/einvoice-archive/hash";
import type {
  ArchiveAuditPort,
  ArchiveMetadataStorePort,
  ArchiveObjectStorePort,
  EInvoiceArchivePorts,
  IssuedInvoiceLookupPort,
  PutIfAbsentResult,
} from "@/lib/einvoice-archive/ports";
import type {
  ArchiveOperationalPatch,
  EInvoiceArchiveRecord,
  IssuedInvoiceArchiveSource,
} from "@/lib/einvoice-archive/types";

export class MemoryObjectStore implements ArchiveObjectStorePort {
  readonly objects = new Map<string, Uint8Array>();
  failNextPut = false;
  corruptOnGet = false;

  async putIfAbsent(key: string, bytes: Uint8Array, _contentType: string): Promise<PutIfAbsentResult> {
    void _contentType;
    if (this.failNextPut) {
      this.failNextPut = false;
      return { ok: false, code: "STORAGE_FAILED", message: "storage unavailable" };
    }
    if (this.objects.has(key)) {
      return { ok: true, created: false };
    }
    this.objects.set(key, copyBytes(bytes));
    return { ok: true, created: true };
  }

  async get(key: string): Promise<Uint8Array | null> {
    const stored = this.objects.get(key);
    if (!stored) return null;
    if (this.corruptOnGet) {
      const mutated = copyBytes(stored);
      mutated[0] = (mutated[0] ?? 0) ^ 0xff;
      return mutated;
    }
    return copyBytes(stored);
  }
}

export class MemoryMetadataStore implements ArchiveMetadataStorePort {
  readonly rows = new Map<string, EInvoiceArchiveRecord>();
  failNextInsert = false;

  private idempotencyKey(row: {
    organizationId: string;
    salesInvoiceId: string;
    artifactKind: string;
    artifactProfileVersion: string;
  }): string {
    return `${row.organizationId}:${row.salesInvoiceId}:${row.artifactKind}:${row.artifactProfileVersion}`;
  }

  async findByIdempotencyKey(input: {
    organizationId: string;
    salesInvoiceId: string;
    artifactKind: string;
    artifactProfileVersion: string;
  }): Promise<EInvoiceArchiveRecord | null> {
    const key = this.idempotencyKey(input);
    for (const row of this.rows.values()) {
      if (this.idempotencyKey(row) === key) {
        return { ...row, retention: { ...row.retention }, generator: { ...row.generator } };
      }
    }
    return null;
  }

  async findById(input: {
    organizationId: string;
    id: string;
  }): Promise<EInvoiceArchiveRecord | null> {
    const row = this.rows.get(input.id);
    if (!row || row.organizationId !== input.organizationId) {
      return null;
    }
    return { ...row, retention: { ...row.retention }, generator: { ...row.generator } };
  }

  async insert(record: EInvoiceArchiveRecord) {
    if (this.failNextInsert) {
      this.failNextInsert = false;
      return { ok: false as const, code: "METADATA_FAILED" as const, message: "metadata unavailable" };
    }
    const existing = await this.findByIdempotencyKey(record);
    if (existing) {
      return { ok: false as const, code: "UNIQUE_CONFLICT" as const, message: "duplicate archive" };
    }
    this.rows.set(record.id, {
      ...record,
      retention: { ...record.retention },
      generator: { ...record.generator },
    });
    return { ok: true as const, record: { ...record } };
  }

  async updateOperational(input: {
    organizationId: string;
    id: string;
    patch: ArchiveOperationalPatch;
  }) {
    const row = this.rows.get(input.id);
    if (!row || row.organizationId !== input.organizationId) {
      return { ok: false as const, message: "not found" };
    }
    if (input.patch.integrityStatus !== undefined) {
      row.integrityStatus = input.patch.integrityStatus;
    }
    if (input.patch.lastVerifiedAt !== undefined) {
      row.lastVerifiedAt = input.patch.lastVerifiedAt;
    }
    if (input.patch.lastVerificationErrorCode !== undefined) {
      row.lastVerificationErrorCode = input.patch.lastVerificationErrorCode;
    }
    if (input.patch.legalHold !== undefined) {
      row.legalHold = input.patch.legalHold;
    }
    if (input.patch.legalHoldReason !== undefined) {
      row.legalHoldReason = input.patch.legalHoldReason;
    }
    if (input.patch.legalHoldUpdatedAt !== undefined) {
      row.legalHoldUpdatedAt = input.patch.legalHoldUpdatedAt;
    }
    return { ok: true as const };
  }

  async list(input: { organizationId: string }): Promise<EInvoiceArchiveRecord[]> {
    return [...this.rows.values()]
      .filter((row) => row.organizationId === input.organizationId)
      .map((row) => ({ ...row, retention: { ...row.retention }, generator: { ...row.generator } }));
  }
}

export class MemoryInvoiceLookup implements IssuedInvoiceLookupPort {
  readonly invoices = new Map<string, IssuedInvoiceArchiveSource>();

  seed(invoice: IssuedInvoiceArchiveSource): void {
    this.invoices.set(`${invoice.organizationId}:${invoice.salesInvoiceId}`, invoice);
  }

  async findIssued(input: {
    organizationId: string;
    salesInvoiceId: string;
  }): Promise<IssuedInvoiceArchiveSource | null> {
    return this.invoices.get(`${input.organizationId}:${input.salesInvoiceId}`) ?? null;
  }
}

export class MemoryAuditLog implements ArchiveAuditPort {
  readonly events: Array<{ eventType: string; organizationId: string; entityId: string; metadata?: Record<string, unknown> }> =
    [];

  async emit(input: {
    organizationId: string;
    userId?: string | null;
    entityId: string;
    eventType: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    this.events.push({
      eventType: input.eventType,
      organizationId: input.organizationId,
      entityId: input.entityId,
      metadata: input.metadata,
    });
  }
}

export function createMemoryArchivePorts(): EInvoiceArchivePorts & {
  objects: MemoryObjectStore;
  metadata: MemoryMetadataStore;
  invoices: MemoryInvoiceLookup;
  audit: MemoryAuditLog;
} {
  return {
    objects: new MemoryObjectStore(),
    metadata: new MemoryMetadataStore(),
    invoices: new MemoryInvoiceLookup(),
    audit: new MemoryAuditLog(),
  };
}

export { sha256Hex };
