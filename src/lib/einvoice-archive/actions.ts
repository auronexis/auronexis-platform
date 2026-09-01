"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { canAccessEInvoiceArchive } from "@/lib/einvoice-archive/authorization";
import { createProductionArchivePorts } from "@/lib/einvoice-archive/supabase-ports";
import { verifyArchivedEInvoiceIntegrity } from "@/lib/einvoice-archive/archive";

export type EInvoiceArchiveActionState = {
  error?: string;
  success?: string;
};

export async function verifyEInvoiceArchiveAction(archiveId: string): Promise<EInvoiceArchiveActionState> {
  const session = await requireSession();
  if (!canAccessEInvoiceArchive(session)) {
    return { error: "Unauthorized." };
  }
  const result = await verifyArchivedEInvoiceIntegrity(
    {
      organizationId: session.organization.id,
      archiveId,
      actorUserId: session.user.id,
    },
    createProductionArchivePorts(),
  );
  if (!result.ok) {
    return { error: result.message };
  }
  revalidatePath(`/dashboard/compliance/einvoice-archive/${archiveId}`);
  return { success: "Integrity VERIFIED." };
}
