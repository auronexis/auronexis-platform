/**
 * Thin normalize/re-export boundary — view model is produced by parser.
 * Kept as a dedicated module per Viewer architecture.
 */

import { parseEInvoiceXml } from "@/lib/einvoice-viewer/parser";
import type { EInvoiceViewerParseResult, EInvoiceViewModel } from "@/lib/einvoice-viewer/types";

export function normalizeEInvoiceXml(xml: string): EInvoiceViewerParseResult {
  return parseEInvoiceXml(xml);
}

export type { EInvoiceViewModel };
