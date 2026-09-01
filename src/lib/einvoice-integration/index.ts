export type {
  EInvoiceIntegrationFailure,
  EInvoiceIntegrationFailureCode,
  EInvoiceIntegrationResult,
  EInvoiceIntegrationSuccess,
} from "@/lib/einvoice-integration/types";

export {
  EINVOICE_INTEGRATION_GENERATOR,
  E_INVOICE_INTEGRATION_AUDIT_EVENTS,
} from "@/lib/einvoice-integration/types";

export { salesInvoiceRecordToIssuedSnapshot } from "@/lib/einvoice-integration/snapshot";
export { archiveEInvoiceForIssuedSalesInvoice } from "@/lib/einvoice-integration/service";
export { integrateIssuedSalesInvoiceWithEInvoiceArchive } from "@/lib/einvoice-integration/post-issuance";
export {
  createIntegrationArchivePorts,
  supabaseIssuedInvoiceLookup,
} from "@/lib/einvoice-integration/ports";
export {
  findEInvoiceArchiveBySalesInvoiceId,
  listEInvoiceArchiveIdsBySalesInvoiceIds,
} from "@/lib/einvoice-integration/queries";
export {
  loadCustomerEInvoiceXmlForSalesInvoice,
  customerEInvoiceResponseHeaders,
  type CustomerEInvoiceDownloadResult,
} from "@/lib/einvoice-integration/customer-download";

export {
  retryEInvoiceIntegrationAction,
  type RetryEInvoiceIntegrationActionState,
} from "@/lib/einvoice-integration/actions";
