import type {
  ArchiveOperationalPatch,
  EInvoiceArchiveRecord,
  IssuedInvoiceArchiveSource,
} from "@/lib/einvoice-archive/types";

export type PutIfAbsentResult =
  | { ok: true; created: boolean }
  | { ok: false; code: "STORAGE_FAILED"; message: string };

export type ArchiveObjectStorePort = {
  putIfAbsent(key: string, bytes: Uint8Array, contentType: string): Promise<PutIfAbsentResult>;
  get(key: string): Promise<Uint8Array | null>;
};

export type ArchiveMetadataInsertResult =
  | { ok: true; record: EInvoiceArchiveRecord }
  | { ok: false; code: "UNIQUE_CONFLICT" | "METADATA_FAILED"; message: string };

export type ArchiveMetadataStorePort = {
  findByIdempotencyKey(input: {
    organizationId: string;
    salesInvoiceId: string;
    artifactKind: string;
    artifactProfileVersion: string;
  }): Promise<EInvoiceArchiveRecord | null>;
  findById(input: { organizationId: string; id: string }): Promise<EInvoiceArchiveRecord | null>;
  insert(record: EInvoiceArchiveRecord): Promise<ArchiveMetadataInsertResult>;
  updateOperational(input: {
    organizationId: string;
    id: string;
    patch: ArchiveOperationalPatch;
  }): Promise<{ ok: true } | { ok: false; message: string }>;
  list(input: {
    organizationId: string;
  }): Promise<EInvoiceArchiveRecord[]>;
};

export type IssuedInvoiceLookupPort = {
  findIssued(input: {
    organizationId: string;
    salesInvoiceId: string;
  }): Promise<IssuedInvoiceArchiveSource | null>;
};

export type ArchiveAuditPort = {
  emit(input: {
    organizationId: string;
    userId?: string | null;
    entityId: string;
    eventType: string;
    severity?: "info" | "low" | "medium" | "high" | "critical";
    metadata?: Record<string, unknown>;
  }): Promise<void>;
};

export type EInvoiceArchivePorts = {
  invoices: IssuedInvoiceLookupPort;
  objects: ArchiveObjectStorePort;
  metadata: ArchiveMetadataStorePort;
  audit?: ArchiveAuditPort;
};
