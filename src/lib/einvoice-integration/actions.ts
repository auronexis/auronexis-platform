"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { canAccessEInvoiceArchive } from "@/lib/einvoice-archive/authorization";
import { archiveEInvoiceForIssuedSalesInvoice } from "@/lib/einvoice-integration/service";

export type RetryEInvoiceIntegrationActionState = {
  error?: string;
  success?: string;
};

/** Operator/admin retry for a persisted issued invoice — idempotent and billing-safe. */
export async function retryEInvoiceIntegrationAction(
  salesInvoiceId: string,
): Promise<RetryEInvoiceIntegrationActionState> {
  const session = await requireSession();
  if (!canAccessEInvoiceArchive(session)) {
    return { error: "Unauthorized." };
  }

  const trimmed = salesInvoiceId.trim();
  if (!trimmed) {
    return { error: "Invoice not found." };
  }

  const result = await archiveEInvoiceForIssuedSalesInvoice({
    organizationId: session.organization.id,
    salesInvoiceId: trimmed,
    actorUserId: session.user.id,
  });

  if (!result.ok) {
    return { error: result.message };
  }

  revalidatePath("/dashboard/compliance/einvoice-archive");
  revalidatePath("/settings/billing");
  return {
    success: result.reused
      ? "E-Invoice archive already exists for this invoice."
      : "E-Invoice archived successfully.",
  };
}
