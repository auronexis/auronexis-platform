import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { verifyCronAuthorization } from "@/lib/env";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import {
  buildPreviewSalesInvoice,
  type PreviewSalesInvoicePlanKey,
} from "@/lib/billing/sales-invoice-preview";
import {
  buildSalesInvoicePdfFilename,
  generateSalesInvoicePdf,
  renderSalesInvoiceHtml,
} from "@/lib/billing/sales-invoice-render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAuthorized(request: Request): Promise<boolean> {
  if (verifyCronAuthorization(request)) {
    return true;
  }

  const session = await getSession();
  return Boolean(session && canManageOrganizationSettings(session));
}

function resolvePreviewPlan(value: string | null): PreviewSalesInvoicePlanKey {
  return value === "business" ? "business" : "professional";
}

/**
 * Operator/dev sales invoice preview — in-memory only, no DB writes, no Mollie.
 * Requires owner/admin session or Bearer CRON_SECRET.
 */
export async function GET(request: Request): Promise<Response> {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const planKey = resolvePreviewPlan(url.searchParams.get("plan"));
  const format = url.searchParams.get("format")?.toLowerCase() ?? "html";
  const { invoice } = buildPreviewSalesInvoice(planKey);

  if (format === "pdf") {
    const pdf = await generateSalesInvoicePdf(invoice, { preview: true, locale: "en" });
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${buildSalesInvoicePdfFilename(invoice.invoiceNumber)}"`,
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const html = renderSalesInvoiceHtml(invoice, { preview: true, locale: "en" });
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function POST(): Promise<Response> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
