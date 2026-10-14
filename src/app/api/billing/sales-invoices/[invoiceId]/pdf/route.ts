import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import {
  generateIssuedSalesInvoicePdfForOrganization,
  salesInvoicePdfResponseHeaders,
} from "@/lib/billing/sales-invoice-pdf";
import { checkExpensiveExportThrottle } from "@/lib/security/expensive-export-throttle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ invoiceId: string }>;
};

/**
 * Authenticated on-demand Auroranexis sales invoice PDF.
 * Tenant-scoped: invoice must belong to the caller's organization and be issued.
 * Does not mutate invoices or payments. Distinct from Mollie payment receipts.
 * Expensive generation is rate-limited per org+user (10/min, shared store).
 */
export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const session = await getSession();
  if (!session || !canManageOrganizationSettings(session)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const exportThrottle = await checkExpensiveExportThrottle({
    organizationId: session.organization.id,
    userId: session.user.id,
    operation: "sales-invoice-pdf",
  });
  if (!exportThrottle.allowed) {
    return NextResponse.json(
      {
        error: exportThrottle.backendUnavailable
          ? "Unable to generate the invoice PDF right now. Please try again."
          : "Too many PDF requests. Please try again later.",
      },
      {
        status: exportThrottle.backendUnavailable ? 503 : 429,
        headers: {
          "Retry-After": exportThrottle.backendUnavailable
            ? "60"
            : String(exportThrottle.retryAfterSeconds),
        },
      },
    );
  }

  const { invoiceId: rawId } = await context.params;
  const invoiceId = rawId?.trim();
  if (!invoiceId) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  const result = await generateIssuedSalesInvoicePdfForOrganization({
    organizationId: session.organization.id,
    invoiceId,
  });

  if (!result.ok) {
    if (result.reason === "pdf_failed") {
      return NextResponse.json(
        { error: "Unable to generate the invoice PDF right now. Try again later." },
        { status: 500 },
      );
    }
    // Cross-tenant and missing both surface as 404 — do not leak existence.
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  void request;
  return new Response(new Uint8Array(result.pdf), {
    status: 200,
    headers: salesInvoicePdfResponseHeaders(result.filename),
  });
}

export async function POST(): Promise<Response> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
