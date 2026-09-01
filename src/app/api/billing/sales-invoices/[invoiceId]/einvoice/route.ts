import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import {
  customerEInvoiceResponseHeaders,
  loadCustomerEInvoiceXmlForSalesInvoice,
} from "@/lib/einvoice-integration/customer-download";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ invoiceId: string }>;
};

/**
 * Authenticated customer E-Invoice XML download from immutable archive only.
 * Tenant-scoped: invoice must belong to the caller's organization and be issued with an archive.
 */
export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const session = await getSession();
  if (!session || !canManageOrganizationSettings(session)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { invoiceId: rawId } = await context.params;
  const invoiceId = rawId?.trim();
  if (!invoiceId) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  const result = await loadCustomerEInvoiceXmlForSalesInvoice({
    organizationId: session.organization.id,
    salesInvoiceId: invoiceId,
    actorUserId: session.user.id,
  });

  if (!result.ok) {
    if (result.reason === "download_failed") {
      return NextResponse.json(
        { error: "Unable to retrieve the E-Invoice right now. Try again later." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  return new Response(new Uint8Array(result.bytes), {
    status: 200,
    headers: customerEInvoiceResponseHeaders(result.filename),
  });
}

export async function POST(): Promise<Response> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
