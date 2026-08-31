/**
 * Read-only E-Invoice Viewer — XML → view model → UI.
 * Isolated from billing and from e-invoice generator execution.
 */

export type {
  EInvoiceViewModel,
  EInvoiceViewerParseResult,
  EInvoiceViewerParseSuccess,
  EInvoiceViewerParseFailure,
  EInvoiceViewerParty,
  EInvoiceViewerLine,
  EInvoiceViewerTax,
  EInvoiceViewerTotals,
  EInvoiceViewerTechnical,
  EInvoiceViewerWarningCode,
  EInvoiceViewerParseCode,
} from "@/lib/einvoice-viewer/types";

export {
  EINVOICE_VIEWER_SUPPORTED_GUIDELINE,
  EINVOICE_VIEWER_MAX_XML_BYTES,
} from "@/lib/einvoice-viewer/types";

export { parseEInvoiceXml } from "@/lib/einvoice-viewer/parser";
export { normalizeEInvoiceXml } from "@/lib/einvoice-viewer/normalize";
export {
  formatXmlMoney,
  formatXmlPercent,
  formatCiiDate102,
  formatServicePeriodLabel,
  unitCodeLabel,
  taxCategoryDisplayLabel,
  documentTypeLabel,
} from "@/lib/einvoice-viewer/format";
export {
  viewerFailureTitle,
  viewerFailureDetail,
  unsupportedProfileBanner,
  consistencyWarnings,
} from "@/lib/einvoice-viewer/validation-display";
export {
  EINVOICE_VIEWER_DEMO_IDS,
  EINVOICE_VIEWER_DEMO_META,
  resolveEInvoiceViewerDemoId,
  isEInvoiceViewerPreviewAllowed,
  type EInvoiceViewerDemoId,
} from "@/lib/einvoice-viewer/demo-catalog";
