import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getIntegrationEncryptionKeyStatus } from "@/lib/integrations/secrets/encryption";
import type { IntegrationSecretsDiagnosticsSnapshot } from "@/lib/integrations/secrets/types";
import type { SessionContext } from "@/lib/tenancy/context";
import type { IntegrationSecret } from "@/types/database";

export async function getIntegrationSecretsDiagnostics(
  session: SessionContext,
): Promise<IntegrationSecretsDiagnosticsSnapshot> {
  const keyStatus = getIntegrationEncryptionKeyStatus();
  const supabase = await createClient();
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from("integration_secrets")
      .select("id, provider_id, status, expires_at, rotation_due_at")
      .eq("organization_id", session.organization.id);

    if (error) {
      return {
        tableReachable: false,
        encryptionKeyConfigured: keyStatus.configured,
        encryptionKeyWarning: keyStatus.warning,
        secretCount: 0,
        activeSecretCount: 0,
        providersWithCredentials: 0,
        expiredSecretCount: 0,
        rotationDueCount: 0,
      };
    }

    const rows = (data ?? []) as Array<
      Pick<IntegrationSecret, "id" | "provider_id" | "status" | "expires_at" | "rotation_due_at">
    >;

    const activeRows = rows.filter((row) => row.status === "active");
    const providerIds = new Set(
      activeRows.map((row) => row.provider_id).filter(Boolean),
    );

    const expiredSecretCount = rows.filter((row) => {
      if (row.status === "expired") {
        return true;
      }

      return row.expires_at != null && row.expires_at <= now;
    }).length;

    const rotationDueCount = rows.filter(
      (row) => row.rotation_due_at != null && row.rotation_due_at <= now,
    ).length;

    return {
      tableReachable: true,
      encryptionKeyConfigured: keyStatus.configured,
      encryptionKeyWarning: keyStatus.warning,
      secretCount: rows.length,
      activeSecretCount: activeRows.length,
      providersWithCredentials: providerIds.size,
      expiredSecretCount,
      rotationDueCount,
    };
  } catch {
    return {
      tableReachable: false,
      encryptionKeyConfigured: keyStatus.configured,
      encryptionKeyWarning: keyStatus.warning,
      secretCount: 0,
      activeSecretCount: 0,
      providersWithCredentials: 0,
      expiredSecretCount: 0,
      rotationDueCount: 0,
    };
  }
}
