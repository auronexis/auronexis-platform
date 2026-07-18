import "server-only";

import { getApiDashboardSnapshot } from "@/lib/api/diagnostics";
import { getOpenAIIntegrationSnapshot } from "@/lib/ai/openai";
import { getAIUsageSummaryForSession } from "@/lib/ai/usage/queries";
import { countCustomerInvoices } from "@/lib/billing/invoices";
import { getBillingUiStatus } from "@/lib/billing/ui-status";
import { getConnectorConnectionByConnectorId } from "@/lib/connectors/queries";
import { checkSlackHealth } from "@/lib/connectors/slack/health";
import { getEmailProviderId, isEmailConfigured } from "@/lib/env/email";
import type {
  IntegrationCenterSnapshot,
  IntegrationConnectionLabel,
} from "@/lib/integrations/center/types";
import { getOrganizationPlanContextForSession } from "@/lib/plans/queries";
import { getStripeWebhookDiagnostics } from "@/lib/diagnostics/webhook-archive";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import { canManageOrganizationSettings } from "@/lib/team/guards";

const NO_DATA = "No data available";
const NO_USAGE = "No usage recorded yet";

function connectionLabel(connected: boolean): IntegrationConnectionLabel {
  return connected ? "Connected" : "Not Connected";
}

function resolvePaddleMode(): string | null {
  const environment = process.env.PADDLE_ENVIRONMENT?.trim().toLowerCase();
  if (environment === "production") {
    return "Live";
  }
  if (environment === "sandbox") {
    return "Test";
  }
  return null;
}

async function getLastReportEmail(organizationId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("report_email_deliveries")
    .select("sent_at, created_at, status")
    .eq("organization_id", organizationId)
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as { sent_at: string | null; created_at: string };
  return row.sent_at ?? row.created_at;
}

async function getLastApiUsage(organizationId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_request_logs")
    .select("created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return (data as { created_at: string }).created_at;
}

async function getLastWebhookDelivery(organizationId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("webhook_deliveries")
    .select("delivered_at, created_at, status")
    .eq("organization_id", organizationId)
    .eq("status", "delivered")
    .order("delivered_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as { delivered_at: string | null; created_at: string };
  return row.delivered_at ?? row.created_at;
}

async function countWebhookFailures(organizationId: string): Promise<number | null> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("webhook_deliveries")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "failed");

  if (error) {
    return null;
  }

  return count ?? 0;
}

function formatUsageSummary(input: {
  callsThisMonth: number;
  limit: number;
  unlimitedCredits?: boolean;
  totalTokensThisMonth: number | null;
}): string | null {
  if (!input.callsThisMonth) {
    return null;
  }

  const limitLabel = input.unlimitedCredits ? "unlimited" : String(input.limit);
  const tokens =
    input.totalTokensThisMonth !== null
      ? `, ${input.totalTokensThisMonth.toLocaleString()} tokens`
      : "";

  return `${input.callsThisMonth.toLocaleString()} calls this month (${limitLabel} limit${tokens})`;
}

/** Operational integration status for the Enterprise Integration Center. */
export async function getIntegrationCenterSnapshot(
  session: SessionContext,
): Promise<IntegrationCenterSnapshot> {
  const plan = await getOrganizationPlanContextForSession(session);
  const anthropicConnected = Boolean(process.env.ANTHROPIC_API_KEY?.trim());

  const [
    openaiSnapshot,
    aiUsage,
    slackConnection,
    apiSnapshot,
    stripeWebhooks,
    invoiceCount,
    lastEmail,
    lastApiUsage,
    lastWebhookDelivery,
    webhookFailures,
  ] = await Promise.all([
    getOpenAIIntegrationSnapshot(session.organization.id),
    getAIUsageSummaryForSession(session, plan.planKey),
    getConnectorConnectionByConnectorId(session, "slack"),
    getApiDashboardSnapshot(session),
    getStripeWebhookDiagnostics(),
    countCustomerInvoices(session.organization.id),
    getLastReportEmail(session.organization.id),
    getLastApiUsage(session.organization.id),
    getLastWebhookDelivery(session.organization.id),
    countWebhookFailures(session.organization.id),
  ]);

  const paddleStatus = getBillingUiStatus();
  const paddleConnected = paddleStatus.portalAvailable || paddleStatus.checkoutAvailable;

  let slackStatus = NO_DATA;
  if (slackConnection) {
    const health = await checkSlackHealth(session.organization.id, slackConnection.id);
    slackStatus = health.status === "healthy" ? "Connected" : health.status;
  } else {
    slackStatus = "Not connected";
  }

  const emailProvider = getEmailProviderId();
  const emailConfigured = isEmailConfigured();

  const usageSummary =
    openaiSnapshot.usageSummary ??
    (aiUsage.callsThisMonth > 0 ? formatUsageSummary(aiUsage) : NO_USAGE);

  return {
    openai: {
      connectionStatus: openaiSnapshot.connectionStatus as IntegrationConnectionLabel,
      state: openaiSnapshot.state,
      provider: openaiSnapshot.provider,
      currentModel: openaiSnapshot.currentModel,
      lastSuccessfulCheck: openaiSnapshot.lastSuccessfulCheck,
      lastFailedCheck: openaiSnapshot.lastFailedCheck,
      lastLatencyMs: openaiSnapshot.lastLatencyMs,
      sanitizedError: openaiSnapshot.sanitizedError,
      usageSummary,
      canTestConnection: canManageOrganizationSettings(session),
    },
    anthropic: {
      connectionStatus: connectionLabel(anthropicConnected),
    },
    slack: {
      workspace: slackConnection?.displayName ?? null,
      connectedChannels: null,
      status: slackStatus,
    },
    paddle: {
      connectionStatus: connectionLabel(paddleConnected),
      mode: resolvePaddleMode(),
      customerPortal: paddleStatus.portalAvailable ? "Available" : "Not available",
      invoices: invoiceCount > 0 ? `${invoiceCount} synced` : NO_DATA,
    },
    webhooks: {
      activeWebhooks: apiSnapshot.webhookEndpointCount,
      lastDelivery: lastWebhookDelivery ?? (stripeWebhooks.lastWebhookReceivedAt ?? null),
      failures: webhookFailures,
    },
    resend: {
      domainStatus: emailConfigured ? `${emailProvider} configured` : "Not configured",
      verified: emailProvider === "resend" ? NO_DATA : NO_DATA,
      lastEmail,
    },
    restApi: {
      activeKeyCount: apiSnapshot.activeKeyCount,
      requestsToday: apiSnapshot.requestsToday,
      lastUsage: lastApiUsage,
      documentationUrl: "/api/docs",
    },
  };
}
