import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function recordConsent(input: {
  organizationId: string;
  subjectEmail: string;
  consentType: string;
  granted: boolean;
  subjectType?: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("consent_records").insert({
    organization_id: input.organizationId,
    subject_email: input.subjectEmail,
    subject_type: input.subjectType ?? "portal_user",
    consent_type: input.consentType,
    granted: input.granted,
    withdrawn_at: input.granted ? null : new Date().toISOString(),
  } as never);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listConsentRecords(organizationId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("consent_records")
    .select("*")
    .eq("organization_id", organizationId)
    .order("recorded_at", { ascending: false })
    .limit(50);
  return data ?? [];
}
