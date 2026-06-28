import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { CompliancePolicyStatus, ComplianceFrameworkKey } from "@/lib/compliance/types";

export async function ensureDefaultPolicies(organizationId: string): Promise<void> {
  const admin = createAdminClient();
  const defaults: Array<{
    framework: ComplianceFrameworkKey;
    policy_key: string;
    title: string;
    status: CompliancePolicyStatus;
  }> = [
    { framework: "soc2", policy_key: "access_control", title: "Access control policy", status: "active" },
    { framework: "soc2", policy_key: "change_management", title: "Change management policy", status: "draft" },
    { framework: "gdpr", policy_key: "data_processing", title: "Data processing policy", status: "active" },
    { framework: "iso27001", policy_key: "information_security", title: "Information security policy", status: "draft" },
  ];

  for (const policy of defaults) {
    await admin.from("compliance_policies").upsert(
      {
        organization_id: organizationId,
        framework: policy.framework,
        policy_key: policy.policy_key,
        title: policy.title,
        status: policy.status,
        config: {},
      } as never,
      { onConflict: "organization_id,framework,policy_key" },
    );
  }
}

export async function countActivePolicies(organizationId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("compliance_policies")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "active");
  return count ?? 0;
}

export async function listPolicies(organizationId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("compliance_policies")
    .select("*")
    .eq("organization_id", organizationId)
    .order("framework", { ascending: true });
  return data ?? [];
}
