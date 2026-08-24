/**
 * Persist contract / DPA acceptance evidence (tenant-scoped).
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { ContractAcceptanceEvidence } from "@/lib/billing/contracting";

export async function persistContractAcceptance(input: {
  organizationId: string;
  userId: string | null;
  evidence: ContractAcceptanceEvidence;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("organization_contract_acceptances").insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    kind: input.evidence.kind,
    document_version: input.evidence.documentVersion,
    accepted_at: input.evidence.acceptedAt,
    source: input.evidence.source,
    user_agent: input.evidence.userAgent ?? null,
  } as never);

  if (error) {
    throw new Error(`Failed to persist contract acceptance: ${error.message}`);
  }
}

export async function listContractAcceptancesForOrganization(
  organizationId: string,
): Promise<
  Array<{
    kind: string;
    documentVersion: string;
    acceptedAt: string;
    source: string;
  }>
> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_contract_acceptances")
    .select("kind, document_version, accepted_at, source")
    .eq("organization_id", organizationId)
    .order("accepted_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list contract acceptances: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    kind: String((row as { kind: string }).kind),
    documentVersion: String((row as { document_version: string }).document_version),
    acceptedAt: String((row as { accepted_at: string }).accepted_at),
    source: String((row as { source: string }).source),
  }));
}
