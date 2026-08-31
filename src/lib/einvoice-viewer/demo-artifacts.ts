/**
 * Server-only certified demo XML loaders — exact artifact bytes.
 */

import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EINVOICE_VIEWER_DEMO_META,
  type EInvoiceViewerDemoId,
} from "@/lib/einvoice-viewer/demo-catalog";

export function loadCertifiedDemoXml(demoId: EInvoiceViewerDemoId): string {
  const meta = EINVOICE_VIEWER_DEMO_META[demoId];
  const path = join(process.cwd(), "artifacts", "einvoice-demo", meta.filename);
  return readFileSync(path, "utf8");
}
