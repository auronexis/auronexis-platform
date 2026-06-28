"use server";

import { requireSession } from "@/lib/auth/session";
import { bootstrapConnectors } from "@/lib/connectors/bootstrap";
import { getConnectorConfig } from "@/lib/connectors/queries";
import { revokeConnectionTokens } from "@/lib/connectors/oauth/storage";
import { runConnectorSync } from "@/lib/connectors/sync";
import type { ConnectorId, ConnectorSyncType } from "@/lib/connectors/types";
import { checkPlanFeatureForSession } from "@/lib/plans/guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function ensureConnectorAccess() {
  const session = await requireSession();
  const access = await checkPlanFeatureForSession(session, "ai_automation_builder");
  if (!access.allowed) {
    throw new Error(access.message ?? "Automation builder is required for enterprise connectors.");
  }
  if (!canManageOrganizationSettings(session)) {
    throw new Error("Only organization owners and admins can manage connectors.");
  }
  return session;
}

function toActionError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}

export async function revokeConnectorConnectionAction(
  connectionId: string,
): Promise<ActionResult<{ connectionId: string }>> {
  try {
    const session = await ensureConnectorAccess();
    const supabase = await createClient();

    const { data } = await supabase
      .from("integration_connections")
      .select("id")
      .eq("organization_id", session.organization.id)
      .eq("id", connectionId)
      .maybeSingle();

    if (!data) {
      return { ok: false, error: "Connection not found." };
    }

    await revokeConnectionTokens(session.organization.id, connectionId);
    return { ok: true, data: { connectionId } };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function runConnectorSyncAction(input: {
  connectionId: string;
  connectorId: ConnectorId;
  syncType?: ConnectorSyncType;
}): Promise<
  ActionResult<{
    jobId: string;
    status: "completed" | "failed";
    recordsChanged: number;
    durationMs: number;
    errorMessage?: string;
  }>
> {
  try {
    const session = await ensureConnectorAccess();
    bootstrapConnectors();

    const config = getConnectorConfig(input.connectorId);
    if (!config) {
      return { ok: false, error: "Unknown connector." };
    }

    const supabase = await createClient();
    const { data } = await supabase
      .from("integration_connections")
      .select("id")
      .eq("organization_id", session.organization.id)
      .eq("id", input.connectionId)
      .eq("connector_id", input.connectorId)
      .maybeSingle();

    if (!data) {
      return { ok: false, error: "Connection not found." };
    }

    const result = await runConnectorSync({
      organizationId: session.organization.id,
      connectionId: input.connectionId,
      connectorId: input.connectorId,
      config,
      syncType: input.syncType ?? "manual",
    });

    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}
