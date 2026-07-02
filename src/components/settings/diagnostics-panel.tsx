import Link from "next/link";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import { FormAlert } from "@/components/ui/form-alert";
import { formatAIProviderLabel, isAIProviderConfigured } from "@/lib/ai/provider-labels";
import { formatBillingDateTime } from "@/lib/billing/types";
import type { WorkspaceDiagnostics } from "@/lib/diagnostics/types";
import { getMatchedPlanLabel, getPlanFeatureLabel } from "@/lib/diagnostics/queries";
import { PLAN_SOURCE_LABELS } from "@/lib/plans/plan-source-labels";
import { cn } from "@/lib/utils/cn";

type DiagnosticsPanelProps = {
  data: WorkspaceDiagnostics;
};

function DiagnosticsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <PageSurface>
      <PageSurfaceHeading title={title} description={description} />
      {children}
    </PageSurface>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border/60 py-3 last:border-b-0 sm:grid-cols-[220px_1fr] sm:items-start sm:gap-4">
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-foreground">{value}</dd>
    </div>
  );
}

function EnvGridHeader() {
  return (
    <div className="mb-1 hidden border-b border-border/60 pb-2 md:grid md:grid-cols-[minmax(0,280px)_80px_120px_minmax(0,1fr)] md:items-center md:gap-4 md:text-xs md:font-semibold md:uppercase md:tracking-wider md:text-muted">
      <span>Variable</span>
      <span>Badge</span>
      <span>Status</span>
      <span>Value</span>
    </div>
  );
}

function EnvRow({
  name,
  present,
  preview,
}: {
  name: string;
  present: boolean;
  preview?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-border/60 py-3 last:border-b-0 sm:grid-cols-2 md:grid-cols-[minmax(0,280px)_80px_120px_minmax(0,1fr)] md:items-center md:gap-4">
      <div className="min-w-0 truncate text-sm font-medium text-foreground md:font-normal md:text-muted">
        <span className="mr-2 text-xs uppercase tracking-wide text-muted md:hidden">Variable</span>
        {name}
      </div>
      <div className="flex min-w-0 items-center gap-2 md:block">
        <span className="text-xs text-muted md:hidden">Badge</span>
        <BoolBadge value={present} />
      </div>
      <div className="min-w-0 truncate whitespace-nowrap text-sm text-foreground">
        <span className="mr-2 text-xs text-muted md:hidden">Status</span>
        {present ? "Present" : "Missing"}
      </div>
      <div className="min-w-0 overflow-hidden truncate font-mono text-xs text-muted">
        <span className="mr-2 font-sans text-xs text-muted md:hidden">Value</span>
        {preview ?? "—"}
      </div>
    </div>
  );
}

function EnvGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <EnvGridHeader />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function StatusListRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 rounded-lg border border-border/60 px-3 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
      <span className="min-w-0 truncate font-medium text-foreground">{label}</span>
      <span className="min-w-0 truncate text-muted sm:text-right">{value}</span>
    </div>
  );
}

function InlineBadgeRow({
  badge,
  text,
}: {
  badge: boolean;
  text: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-3">
      <BoolBadge value={badge} />
      <span className="min-w-0 break-words">{text}</span>
    </div>
  );
}

function BoolBadge({ value }: { value: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
        value
          ? "border-success/25 bg-success/10 text-success"
          : "border-border bg-muted/10 text-muted",
      )}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}


export function DiagnosticsPanel({ data }: DiagnosticsPanelProps) {
  const subscription = data.subscription.row;
  const aiConfigured = isAIProviderConfigured(data.ai.resolvedProviderId);
  const resolvedProviderLabel = formatAIProviderLabel(data.ai.resolvedProviderId, {
    isDevelopment: data.isDevelopment,
  });

  return (
    <div className="space-y-6">
      {data.plan.devOverrideActive ? (
        <FormAlert variant="warning">
          Development override active — plan resolves to{" "}
          <strong>{data.plan.planLabel}</strong> via DEV_FORCE_PLAN. Stripe subscription rows are
          unchanged.
        </FormAlert>
      ) : null}

      <DiagnosticsSection
        title="Organization"
        description="Current workspace identity and signed-in user."
      >
        <dl>
          <Row label="Organization name" value={data.organization.name} />
          <Row
            label="Organization ID"
            value={<code className="font-mono text-xs">{data.organization.organizationId}</code>}
          />
          <Row label="Slug" value={data.organization.slug ?? "—"} />
          <Row
            label="Current user ID"
            value={<code className="font-mono text-xs">{data.organization.userId}</code>}
          />
          <Row label="Current user role" value={data.organization.userRole} />
          <Row label="User email" value={data.organization.userEmail} />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Plan resolution"
        description="How the effective plan is chosen for this organization."
      >
        <dl>
          <Row label="Resolved plan key" value={data.plan.planKey} />
          <Row label="Resolved plan label" value={data.plan.planLabel} />
          <Row label="Plan source" value={PLAN_SOURCE_LABELS[data.plan.planSource]} />
          <Row label="Active subscription flag" value={<BoolBadge value={data.plan.isActiveSubscription} />} />
          <Row label="Subscription price ID" value={data.plan.subscriptionPriceId ?? "—"} />
          <Row
            label="Mapped plan from price ID"
            value={getMatchedPlanLabel(data.plan.mappedPlanKeyFromPriceId)}
          />
          <Row label="Subscription status" value={data.plan.subscriptionStatus ?? "—"} />
        </dl>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground">Enabled features</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.enabledFeatures.map((item) => (
              <li
                key={item.key}
                className="grid grid-cols-1 gap-2 rounded-md border border-border bg-muted/5 px-3 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
              >
                <span className="min-w-0 truncate">{getPlanFeatureLabel(item.key)}</span>
                <BoolBadge value={item.enabled} />
              </li>
            ))}
          </ul>
        </div>

        {data.lockedFeatures.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-foreground">Locked features</h3>
            <ul className="mt-3 space-y-2">
              {data.lockedFeatures.map((item) => (
                <li
                  key={item.feature}
                  className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted"
                >
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span> — requires {item.requiredPlanLabel}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DiagnosticsSection>

      <DiagnosticsSection title="Subscription" description="organization_subscriptions row for this org.">
        {data.subscription.missingMessage ? (
          <FormAlert variant="warning">{data.subscription.missingMessage}</FormAlert>
        ) : null}
        <dl>
          <Row label="Row exists" value={<BoolBadge value={data.subscription.exists} />} />
          <Row label="Status" value={subscription?.status ?? "—"} />
          <Row label="Stripe customer ID" value={subscription?.stripe_customer_id ?? "—"} />
          <Row label="Stripe subscription ID" value={subscription?.stripe_subscription_id ?? "—"} />
          <Row label="Stripe price ID" value={subscription?.stripe_price_id ?? "—"} />
          <Row
            label="Matched plan from price ID"
            value={getMatchedPlanLabel(data.matchedPlanFromSubscriptionPriceId)}
          />
          <Row
            label="Current period start"
            value={formatBillingDateTime(subscription?.current_period_start ?? null) ?? "—"}
          />
          <Row
            label="Current period end"
            value={formatBillingDateTime(subscription?.current_period_end ?? null) ?? "—"}
          />
          <Row
            label="Cancel at period end"
            value={<BoolBadge value={Boolean(subscription?.cancel_at_period_end)} />}
          />
          <Row
            label="Updated at"
            value={formatBillingDateTime(subscription?.updated_at ?? null) ?? "—"}
          />
        </dl>
      </DiagnosticsSection>

      {data.isDevelopment ? (
        <>
          <DiagnosticsSection
            title="Stripe environment"
            description="Billing price IDs and Stripe credentials — secrets are never shown."
          >
            <EnvGrid>
              <EnvRow {...data.stripeEnv.starterPriceId} />
              <EnvRow {...data.stripeEnv.professionalPriceId} />
              <EnvRow {...data.stripeEnv.businessPriceId} />
              <EnvRow {...data.stripeEnv.enterprisePriceId} />
              <EnvRow {...data.stripeEnv.webhookSecret} />
              <EnvRow {...data.stripeEnv.secretKey} />
              <EnvRow {...data.stripeEnv.publishableKey} />
            </EnvGrid>
          </DiagnosticsSection>

          <DiagnosticsSection
            title="Supabase environment"
            description="Database and auth configuration — keys are masked."
          >
            <EnvGrid>
              <EnvRow {...data.platformEnv.supabaseUrl} />
              <EnvRow {...data.platformEnv.supabaseAnonKey} />
              <EnvRow {...data.platformEnv.supabaseServiceRoleKey} />
            </EnvGrid>
          </DiagnosticsSection>

          <DiagnosticsSection
            title="OpenAI environment"
            description="Report assistant provider configuration."
          >
            <EnvGrid>
              <EnvRow {...data.platformEnv.openaiApiKey} />
              <EnvRow {...data.platformEnv.openaiModel} />
              <EnvRow {...data.platformEnv.aiProvider} />
            </EnvGrid>
            <dl className="mt-4">
              <Row label="Resolved provider" value={resolvedProviderLabel} />
              <Row
                label="Report assistant allowed"
                value={<BoolBadge value={data.ai.aiFeatureAllowed} />}
              />
            </dl>
          </DiagnosticsSection>

          <DiagnosticsSection
            title="Anthropic environment"
            description="Optional Anthropic provider configuration."
          >
            <EnvGrid>
              <EnvRow {...data.platformEnv.anthropicApiKey} />
            </EnvGrid>
          </DiagnosticsSection>
        </>
      ) : null}

      <DiagnosticsSection
        title="Enterprise admin"
        description="Platform operator access for enterprise approval workflows."
      >
        <dl>
          <Row label="Platform operators" value={data.platformEnv.platformOperators.label} />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Stripe webhooks"
        description="Idempotent webhook processing — event IDs deduplicated, retries safe."
      >
        <dl>
          <Row
            label="Events table reachable"
            value={<BoolBadge value={data.stripeWebhook.tableReachable} />}
          />
          <Row label="Processed events" value={data.stripeWebhook.processedEvents} />
          <Row label="Duplicates prevented" value={data.stripeWebhook.duplicatesPrevented} />
          <Row label="Failed events" value={data.stripeWebhook.failedEvents} />
          <Row label="Retry count" value={data.stripeWebhook.retryCount} />
          <Row
            label="Last webhook received"
            value={
              data.stripeWebhook.lastWebhookReceivedAt
                ? formatBillingDateTime(data.stripeWebhook.lastWebhookReceivedAt)
                : "—"
            }
          />
          <Row label="Last event type" value={data.stripeWebhook.lastWebhookEventType ?? "—"} />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection title="AI readiness" description="Report assistant usage and session metrics.">
        <dl>
          {!aiConfigured ? (
            <>
              <Row label="AI status" value="AI disabled" />
              <Row label="Provider" value="No provider configured" />
            </>
          ) : (
            <Row label="Provider" value={resolvedProviderLabel} />
          )}
          <Row
            label="Monthly AI calls"
            value={`${data.ai.usageSummary.callsThisMonth} / ${data.ai.usageSummary.limit}`}
          />
          <Row
            label="Estimated tokens this month"
            value={
              !aiConfigured
                ? "—"
                : data.ai.usageSummary.totalTokensThisMonth != null
                  ? data.ai.usageSummary.totalTokensThisMonth.toLocaleString()
                  : "—"
            }
          />
          <Row
            label="Report assistant allowed"
            value={<BoolBadge value={data.ai.aiFeatureAllowed} />}
          />
        </dl>
      </DiagnosticsSection>

      {data.isDevelopment ? (
        <DiagnosticsSection
          title="AI diagnostics"
          description="Developer-only generation metrics — never shown to customers."
        >
          <dl>
            <Row
              label="Provider health"
              value={
                <InlineBadgeRow
                  badge={data.ai.diagnostics.providerHealthOk}
                  text={data.ai.diagnostics.providerHealthMessage}
                />
              }
            />
            <Row label="Last latency" value={data.ai.diagnostics.lastLatencyMs ?? "—"} />
            <Row label="Average latency" value={data.ai.diagnostics.averageLatencyMs ?? "—"} />
            <Row label="Failed calls (session buffer)" value={data.ai.diagnostics.failedCallsEstimate} />
            <Row label="Retries (session buffer)" value={data.ai.diagnostics.retriesEstimate} />
            <Row label="Timeouts (session buffer)" value={data.ai.diagnostics.timeoutsEstimate} />
            <Row label="Cancelled (session buffer)" value={data.ai.diagnostics.cancelledEstimate} />
            <Row label="React cache enabled" value={<BoolBadge value={data.ai.diagnostics.cacheEnabled} />} />
            <Row label="Development mode" value={<BoolBadge value={data.ai.diagnostics.developmentMode} />} />
            <Row label="Core version" value={data.ai.diagnostics.versions.core} />
            <Row label="Prompt version" value={data.ai.diagnostics.versions.prompts} />
            <Row label="Context version" value={data.ai.diagnostics.versions.context} />
            <Row label="Knowledge version" value={data.ai.diagnostics.versions.knowledge} />
            <Row label="Automation version" value={data.ai.diagnostics.versions.automation} />
          </dl>
          {data.ai.diagnostics.recentMetrics.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="px-2 py-2">Module</th>
                    <th className="px-2 py-2">Action</th>
                    <th className="px-2 py-2">Total ms</th>
                    <th className="px-2 py-2">Context ms</th>
                    <th className="px-2 py-2">Provider ms</th>
                    <th className="px-2 py-2">Success</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ai.diagnostics.recentMetrics.map((metric) => (
                    <tr key={`${metric.startedAt}-${metric.action}`} className="border-b border-border/60">
                      <td className="px-2 py-2">{metric.module}</td>
                      <td className="px-2 py-2">{metric.action}</td>
                      <td className="px-2 py-2">{metric.totalMs}</td>
                      <td className="px-2 py-2">{metric.contextBuildMs}</td>
                      <td className="px-2 py-2">{metric.providerLatencyMs}</td>
                      <td className="px-2 py-2">{metric.success ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </DiagnosticsSection>
      ) : null}

      <DiagnosticsSection title="Permissions" description="Effective access for the signed-in user.">
        <dl>
          <Row label="canAccessSettings" value={<BoolBadge value={data.permissions.canAccessSettings} />} />
          <Row label="canCreateReport" value={<BoolBadge value={data.permissions.canCreateReport} />} />
          <Row
            label="canUse ai_report_assistant"
            value={<BoolBadge value={data.permissions.canUseAiReportAssistant} />}
          />
          <Row
            label="canUse report_templates"
            value={<BoolBadge value={data.permissions.canUseReportTemplates} />}
          />
          <Row
            label="canUse report_schedules"
            value={<BoolBadge value={data.permissions.canUseReportSchedules} />}
          />
          <Row
            label="canUse email_delivery"
            value={<BoolBadge value={data.permissions.canUseEmailDelivery} />}
          />
          <Row label="canUse risks" value={<BoolBadge value={data.permissions.canUseRisks} />} />
          <Row label="canUse incidents" value={<BoolBadge value={data.permissions.canUseIncidents} />} />
          <Row
            label="canUse profitability"
            value={<BoolBadge value={data.permissions.canUseProfitability} />}
          />
          <Row label="canUse white_label" value={<BoolBadge value={data.permissions.canUseWhiteLabel} />} />
          <Row
            label="canUse notifications"
            value={<BoolBadge value={data.permissions.canUseNotifications} />}
          />
        </dl>
      </DiagnosticsSection>

      {data.isDevelopment ? (
        <DiagnosticsSection
          title="Developer plan override"
          description="Local testing only — ignored in production."
        >
          <dl>
            <Row label="DEV_FORCE_PLAN configured" value={<BoolBadge value={data.devForcePlanEnvPresent} />} />
            <Row label="DEV_FORCE_PLAN value" value={data.devForcePlanValue ?? "—"} />
          </dl>
          <p className="mt-4 text-sm text-muted">
            Set <code className="font-mono text-xs">DEV_FORCE_PLAN=starter|professional|business|enterprise</code>{" "}
            in your local environment to override plan resolution without changing Stripe rows.
          </p>
        </DiagnosticsSection>
      ) : null}

      <DiagnosticsSection
        title="Automation persistence"
        description="Workflow storage, migration, and repository health."
      >
        <dl>
          <Row label="Storage backend" value={data.automation.storageBackend} />
          <Row label="Repository status" value={data.automation.repositoryStatus} />
          <Row label="Database latency" value={
            data.automation.databaseLatencyMs != null
              ? `${data.automation.databaseLatencyMs}ms`
              : "—"
          } />
          <Row label="Workflow count" value={data.automation.workflowCount} />
          <Row label="Draft count" value={data.automation.draftCount} />
          <Row label="Execution count" value={data.automation.executionCount} />
          <Row label="Version count" value={data.automation.versionCount} />
          <Row label="Webhook count" value={data.automation.webhookCount} />
          <Row label="Migration status" value={data.automation.migrationStatus} />
          <Row
            label="Local storage migrated"
            value={
              data.automation.localStorageMigratedAt
                ? formatBillingDateTime(data.automation.localStorageMigratedAt)
                : "Not yet"
            }
          />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Automation engine"
        description="Live workflow execution metrics for today."
      >
        <dl>
          <Row label="Engine version" value={data.automation.engine.engineVersion} />
          <Row label="Active workflows" value={data.automation.engine.activeWorkflowCount} />
          <Row label="Executions today" value={data.automation.engine.executionsToday} />
          <Row label="Failed today" value={data.automation.engine.failedExecutionsToday} />
          <Row
            label="Average duration"
            value={
              data.automation.engine.averageExecutionDurationMs != null
                ? `${data.automation.engine.averageExecutionDurationMs}ms`
                : "—"
            }
          />
          <Row label="Last execution status" value={data.automation.engine.lastExecutionStatus ?? "—"} />
          <Row label="Skipped actions today" value={data.automation.engine.placeholderActionsToday} />
          <Row label="Queue status" value={data.automation.engine.queueStatus} />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Integrations"
        description="Registered providers, configuration health, and simulation support."
      >
        <dl>
          <Row label="Registered providers" value={data.integrations.registeredProviderCount} />
          <Row label="Configured providers" value={data.integrations.configuredProviderCount} />
          <Row label="Ready providers" value={data.integrations.readyProviderCount} />
          <Row label="Missing secret references" value={data.integrations.missingSecretCount} />
          <Row
            label="Simulation"
            value={data.integrations.simulationEnabled ? "Available" : "Disabled"}
          />
        </dl>
        <div className="mt-4 space-y-2">
          {data.integrations.registeredProviders.map((provider) => (
            <StatusListRow
              key={provider.id}
              label={provider.name}
              value={<span className="capitalize">{provider.status.replace(/_/g, " ")}</span>}
            />
          ))}
        </div>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Integration Runtime"
        description="Live delivery metrics for Slack, Teams, Discord, and webhooks."
      >
        <dl>
          <Row label="Active live providers" value={data.integrationRuntime.activeProviders} />
          <Row label="Successful today" value={data.integrationRuntime.successfulToday} />
          <Row label="Failed today" value={data.integrationRuntime.failedToday} />
          <Row label="Retrying" value={data.integrationRuntime.retryingCount} />
          <Row label="Dead letters" value={data.integrationRuntime.deadLetterCount} />
          <Row
            label="Average latency"
            value={
              data.integrationRuntime.averageLatencyMs != null
                ? `${data.integrationRuntime.averageLatencyMs}ms`
                : "—"
            }
          />
          <Row label="Rate limited today" value={data.integrationRuntime.rateLimitedToday} />
          <Row label="Queue size" value={data.integrationRuntime.queueSize} />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Predictive Intelligence"
        description="Deterministic forecast engine metrics. Predictions use verified database signals only."
      >
        <dl>
          <Row label="Engine version" value={data.predictive.engineVersion} />
          <Row label="Forecast count" value={data.predictive.forecastCount} />
          <Row label="Average confidence" value={`${data.predictive.averageConfidence}%`} />
          <Row label="Cache hit ratio" value={`${data.predictive.cacheHitRatio}%`} />
          <Row
            label="Refresh duration"
            value={
              data.predictive.refreshDurationMs != null
                ? `${data.predictive.refreshDurationMs}ms`
                : "—"
            }
          />
          <Row
            label="Prediction latency"
            value={
              data.predictive.predictionLatencyMs != null
                ? `${data.predictive.predictionLatencyMs}ms`
                : "—"
            }
          />
          <Row
            label="Last generated"
            value={
              data.predictive.lastGeneratedAt
                ? new Date(data.predictive.lastGeneratedAt).toLocaleString()
                : "—"
            }
          />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Monitoring connectors"
        description="Native connector health, OAuth tokens, and sync status."
      >
        <dl>
          <Row label="Registered connectors" value={data.connectors.registeredConnectors} />
          <Row label="Connected providers" value={data.connectors.connectedProviders} />
          <Row label="OAuth configured" value={data.connectors.oauthConfiguredConnectors} />
          <Row label="Valid tokens" value={data.connectors.validTokens} />
          <Row label="Expired tokens" value={data.connectors.expiredTokens} />
          <Row label="Refresh failures" value={data.connectors.refreshFailures} />
          <Row label="Unhealthy connections" value={data.connectors.unhealthyConnections} />
          <Row
            label="Last sync"
            value={
              data.connectors.lastSyncAt
                ? new Date(data.connectors.lastSyncAt).toLocaleString()
                : "—"
            }
          />
          <Row
            label="API quota telemetry"
            value={data.connectors.apiQuotaAvailable ? "Available" : "Not reported"}
          />
        </dl>
        <div className="mt-4 space-y-2">
          {data.connectors.providers.map((provider) => (
            <StatusListRow
              key={provider.connectorId}
              label={provider.name}
              value={
                <span className="capitalize">
                  {provider.connected
                    ? provider.tokenValid
                      ? provider.healthStatus
                      : "token invalid"
                    : "not connected"}
                </span>
              }
            />
          ))}
        </div>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Public API & webhooks"
        description="Versioned REST API metrics, rate limits, webhook deliveries, and key inventory."
      >
        <dl>
          <Row label="OpenAPI version" value={data.publicApi.openApiVersion} />
          <Row label="API version" value={data.publicApi.apiVersion} />
          <Row
            label="Tables reachable"
            value={<BoolBadge value={data.publicApi.tableReachable} />}
          />
          <Row label="Requests today" value={data.publicApi.requestsToday} />
          <Row
            label="Average latency"
            value={
              data.publicApi.averageLatencyMs != null
                ? `${data.publicApi.averageLatencyMs}ms`
                : "—"
            }
          />
          <Row label="Failed requests today" value={data.publicApi.failedRequestsToday} />
          <Row label="Rate limited today" value={data.publicApi.rateLimitedToday} />
          <Row label="Webhook deliveries today" value={data.publicApi.webhookDeliveriesToday} />
          <Row label="Active API keys" value={data.publicApi.activeApiKeys} />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="White Label"
        description="Brand, theme, portal, email, PDF, domain, and asset configuration status."
      >
        <dl>
          <Row
            label="Feature enabled"
            value={<BoolBadge value={data.permissions.canUseWhiteLabel} />}
          />
          <Row
            label="Settings table reachable"
            value={<BoolBadge value={data.whiteLabel.tableReachable} />}
          />
          <Row label="Brand configured" value={<BoolBadge value={data.whiteLabel.brandConfigured} />} />
          <Row label="Theme configured" value={<BoolBadge value={data.whiteLabel.themeConfigured} />} />
          <Row label="Portal configured" value={<BoolBadge value={data.whiteLabel.portalConfigured} />} />
          <Row
            label="Email branding"
            value={<BoolBadge value={data.whiteLabel.emailBrandingConfigured} />}
          />
          <Row label="PDF branding" value={<BoolBadge value={data.whiteLabel.pdfBrandingConfigured} />} />
          <Row
            label="Custom domain"
            value={<BoolBadge value={data.whiteLabel.customDomainConfigured} />}
          />
          <Row label="Assets configured" value={data.whiteLabel.assetsConfigured} />
          <Row label="Cache enabled" value={<BoolBadge value={data.whiteLabel.cacheEnabled} />} />
          <Row label="Published" value={<BoolBadge value={data.whiteLabel.published} />} />
        </dl>
        {data.permissions.canUseWhiteLabel ? (
          <p className="mt-4 text-sm text-muted">
            Manage branding at{" "}
            <Link href="/settings/branding" className="font-medium text-primary hover:underline">
              White Label Branding
            </Link>
            .
          </p>
        ) : null}
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Billing platform"
        description="Subscription state, Stripe connectivity, usage metering, invoices, webhooks, and forecast health."
      >
        <dl>
          <Row label="Platform version" value={data.billing.platformVersion} />
          <Row label="Current plan" value={data.billing.currentPlanKey} />
          <Row label="Subscription state" value={data.billing.subscriptionState ?? "—"} />
          <Row label="Stripe connected" value={<BoolBadge value={data.billing.stripeConnected} />} />
          <Row label="Usage metering" value={<BoolBadge value={data.billing.usageMeteringEnabled} />} />
          <Row label="Invoice count" value={data.billing.invoiceCount} />
          <Row label="Webhook events (7d)" value={data.billing.webhookEventsLast7Days} />
          <Row label="Upcoming renewal" value={data.billing.upcomingRenewal ?? "—"} />
          <Row label="Forecast status" value={data.billing.forecastStatus} />
          <Row label="Approaching limits" value={data.billing.approachingLimits} />
          <Row label="Reached limits" value={data.billing.reachedLimits} />
        </dl>
        <p className="mt-4 text-sm text-muted">
          Manage billing at{" "}
          <Link href="/settings/billing" className="font-medium text-primary hover:underline">
            Subscription & Billing
          </Link>{" "}
          or review usage on{" "}
          <Link href="/settings/usage" className="font-medium text-primary hover:underline">
            Usage
          </Link>
          .
        </p>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Compliance platform"
        description="Audit trail, retention coverage, framework readiness, evidence exports, GDPR requests, and security incidents."
      >
        <dl>
          <Row label="Platform version" value={data.compliance.platformVersion} />
          <Row
            label="Tables reachable"
            value={<BoolBadge value={data.compliance.tablesReachable} />}
          />
          <Row label="Audit events total" value={data.compliance.auditEventsTotal} />
          <Row label="Audit growth (7d)" value={data.compliance.auditGrowth7d} />
          <Row label="Retention coverage" value={`${data.compliance.retentionCoveragePercent}%`} />
          <Row
            label="Framework readiness"
            value={`${data.compliance.frameworkReadinessPercent}%`}
          />
          <Row
            label="Evidence available"
            value={<BoolBadge value={data.compliance.evidenceAvailable} />}
          />
          <Row label="Open security incidents" value={data.compliance.openSecurityIncidents} />
          <Row label="Open GDPR requests" value={data.compliance.openGdprRequests} />
          <Row label="Active policies" value={data.compliance.activePolicies} />
          <Row
            label="Last export"
            value={
              data.compliance.lastExportAt
                ? formatBillingDateTime(data.compliance.lastExportAt)
                : "—"
            }
          />
        </dl>
        <p className="mt-4 text-sm text-muted">
          Manage compliance at{" "}
          <Link href="/dashboard/compliance" className="font-medium text-primary hover:underline">
            Compliance Center
          </Link>{" "}
          or explore the{" "}
          <Link
            href="/dashboard/compliance/audit"
            className="font-medium text-primary hover:underline"
          >
            Audit Explorer
          </Link>
          .
        </p>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Integration secrets"
        description="Encrypted credential vault readiness. Secret values are never displayed."
      >
        <dl>
          <Row
            label="Secrets table reachable"
            value={<BoolBadge value={data.secrets.tableReachable} />}
          />
          <Row
            label="Encryption key configured"
            value={<BoolBadge value={data.secrets.encryptionKeyConfigured} />}
          />
          <Row label="Stored secrets" value={data.secrets.secretCount} />
          <Row label="Active secrets" value={data.secrets.activeSecretCount} />
          <Row label="Providers with credentials" value={data.secrets.providersWithCredentials} />
          <Row label="Expired secrets" value={data.secrets.expiredSecretCount} />
          <Row label="Rotation due" value={data.secrets.rotationDueCount} />
        </dl>
        {data.secrets.encryptionKeyWarning ? (
          <p className="mt-4 text-sm text-muted">{data.secrets.encryptionKeyWarning}</p>
        ) : null}
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Cron infrastructure"
        description="Registered background jobs, execution history, and schedule health."
      >
        <dl>
          <Row
            label="Tables reachable"
            value={<BoolBadge value={data.cron.tableReachable} />}
          />
          <Row label="Registered jobs" value={data.cron.registeredJobs} />
          <Row label="Enabled jobs" value={data.cron.enabledJobs} />
          <Row label="Failed jobs (24h)" value={data.cron.failedJobsLast24h} />
          <Row
            label="Average duration"
            value={
              data.cron.averageDurationMs != null
                ? `${data.cron.averageDurationMs}ms`
                : "—"
            }
          />
          <Row
            label="Next run"
            value={
              data.cron.nextRunAt ? formatBillingDateTime(data.cron.nextRunAt) : "—"
            }
          />
          <Row
            label="Last run"
            value={
              data.cron.lastRunAt ? formatBillingDateTime(data.cron.lastRunAt) : "—"
            }
          />
          <Row label="Queue backlog" value={data.cron.queueBacklog} />
          <Row label="Status" value={data.cron.status} />
        </dl>
        <div className="mt-4 space-y-2">
          {data.cron.jobs.map((job) => (
            <StatusListRow
              key={job.id}
              label={job.name}
              value={<span className="capitalize">{job.enabled ? job.lastStatus ?? "scheduled" : "disabled"}</span>}
            />
          ))}
        </div>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Queue infrastructure"
        description="Background queue workers — retries, dead letters, and processing metrics."
      >
        <dl>
          <Row
            label="Tables reachable"
            value={<BoolBadge value={data.queue.tableReachable} />}
          />
          <Row label="Jobs pending" value={data.queue.jobsPending} />
          <Row label="Jobs running" value={data.queue.jobsRunning} />
          <Row label="Jobs failed" value={data.queue.jobsFailed} />
          <Row label="Jobs retried" value={data.queue.jobsRetried} />
          <Row label="Dead letters" value={data.queue.deadLetters} />
          <Row
            label="Average processing time"
            value={
              data.queue.averageProcessingTimeMs != null
                ? `${data.queue.averageProcessingTimeMs}ms`
                : "—"
            }
          />
          <Row label="Status" value={data.queue.status} />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Stripe staging readiness"
        description="Checkout, portal, webhooks, invoices, and billing health for staging and production."
      >
        <dl>
          <Row label="Stripe readiness" value={<BoolBadge value={data.stripeStaging.stripeReadiness} />} />
          <Row label="Portal readiness" value={<BoolBadge value={data.stripeStaging.portalReadiness} />} />
          <Row label="Webhook readiness" value={<BoolBadge value={data.stripeStaging.webhookReadiness} />} />
          <Row label="Invoice readiness" value={<BoolBadge value={data.stripeStaging.invoiceReadiness} />} />
          <Row label="Billing readiness" value={<BoolBadge value={data.stripeStaging.billingReadiness} />} />
          <Row label="Checkout configured" value={<BoolBadge value={data.stripeStaging.checkoutConfigured} />} />
          <Row label="Subscription active" value={<BoolBadge value={data.stripeStaging.subscriptionActive} />} />
          <Row label="Processed webhooks" value={data.stripeStaging.processedWebhooks} />
          <Row label="Failed webhooks" value={data.stripeStaging.failedWebhooks} />
          <Row label="Invoice count" value={data.stripeStaging.invoiceCount} />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Production readiness"
        description="Pilot and production infrastructure score — no secrets displayed."
      >
        <dl>
          <Row label="Overall score" value={`${data.productionReadiness.overallScore}/100`} />
          <Row label="Recommendation" value={data.productionReadiness.label} />
          <Row label="Stripe readiness" value={`${data.productionReadiness.stripeReadiness}/100`} />
          <Row label="Cron readiness" value={`${data.productionReadiness.cronReadiness}/100`} />
          <Row label="Queue readiness" value={`${data.productionReadiness.queueReadiness}/100`} />
          <Row label="OAuth readiness" value={`${data.productionReadiness.oauthReadiness}/100`} />
          <Row
            label="Connector readiness"
            value={`${data.productionReadiness.connectorReadiness}/100`}
          />
          <Row
            label="Billing readiness"
            value={`${data.productionReadiness.billingReadiness}/100`}
          />
          <Row label="API readiness" value={`${data.productionReadiness.apiReadiness}/100`} />
          <Row
            label="Compliance readiness"
            value={`${data.productionReadiness.complianceReadiness}/100`}
          />
          <Row label="AI readiness" value={`${data.productionReadiness.aiReadiness}/100`} />
          <Row
            label="Predictive readiness"
            value={`${data.productionReadiness.predictiveReadiness}/100`}
          />
          <Row
            label="Launch polish readiness"
            value={`${data.productionReadiness.launchPolishReadiness}/100`}
          />
          <Row
            label="Pilot acquisition readiness"
            value={`${data.productionReadiness.pilotAcquisitionReadiness}/100`}
          />
          <Row
            label="Deployment readiness"
            value={`${data.productionReadiness.deploymentReadiness}/100`}
          />
          <Row
            label="Pilot execution readiness"
            value={`${data.productionReadiness.pilotExecutionReadiness}/100`}
          />
          <Row
            label="Go-live readiness"
            value={`${data.productionReadiness.goLiveReadiness}/100`}
          />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Security readiness"
        description="Security hardening — Turnstile, throttling, headers, uploads, CSRF, and OAuth state."
      >
        <dl>
          <Row label="Status" value={data.securityReadiness.label} />
          <Row label="Security score" value={`${data.securityReadiness.score}/100`} />
          <Row label="Abuse protection score" value={`${data.abuseProtection.score}/100`} />
          <Row
            label="Turnstile configured"
            value={<BoolBadge value={data.securityReadiness.turnstileConfigured} />}
          />
          <Row
            label="Login throttling"
            value={<BoolBadge value={data.securityReadiness.loginThrottlingEnabled} />}
          />
          <Row
            label="API throttling"
            value={<BoolBadge value={data.securityReadiness.apiThrottlingEnabled} />}
          />
          <Row
            label="SVG sanitization"
            value={<BoolBadge value={data.securityReadiness.svgSanitizationEnabled} />}
          />
          <Row
            label="Upload restrictions"
            value={<BoolBadge value={data.securityReadiness.uploadRestrictionsEnabled} />}
          />
          <Row
            label="CSRF / origin validation"
            value={<BoolBadge value={data.securityReadiness.csrfValidationEnabled} />}
          />
          <Row
            label="OAuth state validation"
            value={<BoolBadge value={data.securityReadiness.oauthStateValidationEnabled} />}
          />
          <Row label="CSP headers" value={<BoolBadge value={data.securityReadiness.cspHeadersEnabled} />} />
          <Row label="HSTS" value={<BoolBadge value={data.securityReadiness.hstsEnabled} />} />
          <Row
            label="Frame protection"
            value={<BoolBadge value={data.securityReadiness.frameProtectionEnabled} />}
          />
          <Row
            label="Spam protection"
            value={<BoolBadge value={data.abuseProtection.spamProtectionEnabled} />}
          />
          <Row
            label="429 responses"
            value={<BoolBadge value={data.abuseProtection.returns429Responses} />}
          />
          <Row
            label="Webhook abuse prevention"
            value={<BoolBadge value={data.abuseProtection.webhookAbusePreventionEnabled} />}
          />
          <Row
            label="Unrestricted public endpoints"
            value={data.abuseProtection.unrestrictedPublicEndpoints}
          />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Go-live readiness"
        description="Deployment, monitoring, security, OAuth, billing, operations, legal, support, staging, and infrastructure."
      >
        <dl>
          <Row label="Status" value={data.goLive.label} />
          <Row label="Go-live score" value={`${data.goLive.score}/100`} />
          <Row label="Deployment" value={`${data.goLive.deploymentScore}/100`} />
          <Row label="Monitoring" value={`${data.goLive.monitoringScore}/100`} />
          <Row label="Security" value={`${data.goLive.securityScore}/100`} />
          <Row label="OAuth" value={`${data.goLive.oauthScore}/100`} />
          <Row label="Billing" value={`${data.goLive.billingScore}/100`} />
          <Row label="Operations" value={`${data.goLive.operationsScore}/100`} />
          <Row label="Legal" value={`${data.goLive.legalScore}/100`} />
          <Row label="Support" value={`${data.goLive.supportScore}/100`} />
          <Row label="Staging" value={`${data.goLive.stagingScore}/100`} />
          <Row label="Infrastructure" value={`${data.goLive.infrastructureScore}/100`} />
          <Row label="Domain health" value={`${data.goLive.domainScore}/100`} />
          <Row label="Mail health" value={`${data.goLive.mailScore}/100`} />
          <Row
            label="Deployment ready"
            value={<BoolBadge value={data.goLive.deploymentReady} />}
          />
          <Row
            label="Monitoring ready"
            value={<BoolBadge value={data.goLive.monitoringReady} />}
          />
          <Row label="Security ready" value={<BoolBadge value={data.goLive.securityReady} />} />
          <Row label="Billing ready" value={<BoolBadge value={data.goLive.billingReady} />} />
          <Row label="OAuth ready" value={<BoolBadge value={data.goLive.oauthReady} />} />
          <Row label="Staging ready" value={<BoolBadge value={data.goLive.stagingReady} />} />
          <Row label="Support ready" value={<BoolBadge value={data.goLive.supportReady} />} />
          <Row label="Legal ready" value={<BoolBadge value={data.goLive.legalReady} />} />
          <Row label="Operations ready" value={<BoolBadge value={data.goLive.operationsReady} />} />
          <Row
            label="Infrastructure ready"
            value={<BoolBadge value={data.goLive.infrastructureReady} />}
          />
          <Row label="Domain ready" value={<BoolBadge value={data.goLive.domainReady} />} />
          <Row label="Mail ready" value={<BoolBadge value={data.goLive.mailReady} />} />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Pilot execution readiness"
        description="Demo environment, personas, customer journey, and pilot program assets."
      >
        <dl>
          <Row label="Status" value={data.pilotExecution.label} />
          <Row label="Overall score" value={`${data.pilotExecution.score}/100`} />
          <Row label="Website readiness" value={`${data.pilotExecution.websiteReady}/100`} />
          <Row label="Legal readiness" value={`${data.pilotExecution.legalReady}/100`} />
          <Row label="Support readiness" value={`${data.pilotExecution.supportReady}/100`} />
          <Row label="Pilot program readiness" value={`${data.pilotExecution.pilotProgramReady}/100`} />
          <Row
            label="Demo workspace"
            value={<BoolBadge value={data.pilotExecution.demoWorkspaceConfigured} />}
          />
          <Row
            label="Persona orgs"
            value={<BoolBadge value={data.pilotExecution.personaOrgsConfigured} />}
          />
          <Row
            label="Pilot accounts"
            value={<BoolBadge value={data.pilotExecution.pilotAccountsConfigured} />}
          />
          <Row
            label="Customer journey docs"
            value={<BoolBadge value={data.pilotExecution.customerJourneyDocumented} />}
          />
          <Row label="E2E suite" value={<BoolBadge value={data.pilotExecution.e2eSuiteReady} />} />
          <Row label="Pilot assets" value={<BoolBadge value={data.pilotExecution.pilotAssetsReady} />} />
          <Row label="Deployment ready" value={<BoolBadge value={data.pilotExecution.deploymentReady} />} />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Deployment readiness"
        description="Vercel, domains, cron, health probe, SEO, and SSL configuration."
      >
        <dl>
          <Row label="Status" value={data.deploymentReadiness.label} />
          <Row label="Overall score" value={`${data.deploymentReadiness.score}/100`} />
          <Row
            label="Vercel cron"
            value={<BoolBadge value={data.deploymentReadiness.vercelCronConfigured} />}
          />
          <Row
            label="Health endpoint"
            value={<BoolBadge value={data.deploymentReadiness.healthEndpointReady} />}
          />
          <Row label="Robots.txt" value={<BoolBadge value={data.deploymentReadiness.robotsReady} />} />
          <Row label="Sitemap" value={<BoolBadge value={data.deploymentReadiness.sitemapReady} />} />
          <Row
            label="OpenGraph metadata"
            value={<BoolBadge value={data.deploymentReadiness.openGraphReady} />}
          />
          <Row label="SSL / HTTPS" value={<BoolBadge value={data.deploymentReadiness.sslReady} />} />
          <Row
            label="Version documented"
            value={<BoolBadge value={data.deploymentReadiness.envVarsDocumented} />}
          />
          <Row
            label="Custom domain"
            value={<BoolBadge value={data.deploymentReadiness.customDomainReady} />}
          />
          <Row
            label="Production domains"
            value={<BoolBadge value={data.deploymentReadiness.productionDomainsConfigured} />}
          />
          <Row
            label="Domain redirects"
            value={<BoolBadge value={data.deploymentReadiness.redirectsConfigured} />}
          />
          <Row
            label="Cache headers"
            value={<BoolBadge value={data.deploymentReadiness.cacheHeadersConfigured} />}
          />
          <Row
            label="Cron secret"
            value={<BoolBadge value={data.deploymentReadiness.cronSecretConfigured} />}
          />
          <Row
            label="Vercel deployment"
            value={<BoolBadge value={data.deploymentReadiness.vercelDeploymentDetected} />}
          />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Pilot acquisition readiness"
        description="Website, legal, support, and pilot program surfaces for customer acquisition."
      >
        <dl>
          <Row label="Status" value={data.pilotAcquisition.label} />
          <Row label="Overall score" value={`${data.pilotAcquisition.score}/100`} />
          <Row label="Website readiness" value={`${data.pilotAcquisition.websiteReadiness}/100`} />
          <Row label="Legal readiness" value={`${data.pilotAcquisition.legalReadiness}/100`} />
          <Row label="Support readiness" value={`${data.pilotAcquisition.supportReadiness}/100`} />
          <Row label="Pilot readiness" value={`${data.pilotAcquisition.pilotReadiness}/100`} />
          <Row label="Complete" value={<BoolBadge value={data.pilotAcquisition.complete} />} />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Revenue readiness"
        description="Sales pipeline, lead capture, founding program, and revenue generation readiness (Phase 7)."
      >
        <dl>
          <Row label="Status" value={data.revenueReadiness.label} />
          <Row label="Overall score" value={`${data.revenueReadiness.score}/100`} />
          <Row label="Sales readiness" value={`${data.revenueReadiness.salesReadiness}/100`} />
          <Row label="Customer readiness" value={`${data.revenueReadiness.customerReadiness}/100`} />
          <Row label="Revenue readiness" value={`${data.revenueReadiness.revenueReadiness}/100`} />
          <Row label="Pipeline stages" value={<BoolBadge value={data.revenueReadiness.pipelineStagesConfigured} />} />
          <Row label="Lead capture" value={<BoolBadge value={data.revenueReadiness.leadCaptureConfigured} />} />
          <Row label="Contact inbox" value={<BoolBadge value={data.revenueReadiness.inboxConfigured} />} />
          <Row label="Founding program" value={<BoolBadge value={data.revenueReadiness.foundingProgramConfigured} />} />
          <Row label="Sales assets" value={<BoolBadge value={data.revenueReadiness.salesAssetsReady} />} />
          <Row label="Booking links" value={<BoolBadge value={data.revenueReadiness.bookingLinksConfigured} />} />
          <Row label="CRM tables" value={<BoolBadge value={data.revenueReadiness.crmTablesReady} />} />
          <Row label="Version v1.0.x" value={<BoolBadge value={data.revenueReadiness.versionReady} />} />
          <Row label="Complete" value={<BoolBadge value={data.revenueReadiness.complete} />} />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Acquisition readiness"
        description="Outbound workspace, lead enrichment, templates, automation, and customer success (Phase 7 Sprint 2)."
      >
        <dl>
          <Row label="Status" value={data.acquisitionReadiness.label} />
          <Row label="Overall score" value={`${data.acquisitionReadiness.score}/100`} />
          <Row label="Sales readiness" value={`${data.acquisitionReadiness.salesReadiness}/100`} />
          <Row label="Acquisition readiness" value={`${data.acquisitionReadiness.acquisitionReadiness}/100`} />
          <Row label="Revenue readiness" value={`${data.acquisitionReadiness.revenueReadiness}/100`} />
          <Row label="Customer success readiness" value={`${data.acquisitionReadiness.customerSuccessReadiness}/100`} />
          <Row label="Outbound lists" value={<BoolBadge value={data.acquisitionReadiness.outboundListsConfigured} />} />
          <Row label="Lead enrichment" value={<BoolBadge value={data.acquisitionReadiness.enrichmentConfigured} />} />
          <Row label="Outreach templates" value={<BoolBadge value={data.acquisitionReadiness.templatesConfigured} />} />
          <Row label="Sales automation" value={<BoolBadge value={data.acquisitionReadiness.automationConfigured} />} />
          <Row label="Customer success" value={<BoolBadge value={data.acquisitionReadiness.customerSuccessConfigured} />} />
          <Row label="Acquisition tables" value={<BoolBadge value={data.acquisitionReadiness.acquisitionTablesReady} />} />
          <Row label="Acquisition docs" value={<BoolBadge value={data.acquisitionReadiness.acquisitionDocsReady} />} />
          <Row label="Version v1.0.1" value={<BoolBadge value={data.acquisitionReadiness.versionReady} />} />
          <Row label="Complete" value={<BoolBadge value={data.acquisitionReadiness.complete} />} />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="First customer readiness"
        description="Lead sourcing, sales execution, customer delivery, and onboarding for first paying customer (Phase 7 Sprint 3)."
      >
        <dl>
          <Row label="Status" value={data.firstCustomerReadiness.label} />
          <Row label="Overall score" value={`${data.firstCustomerReadiness.score}/100`} />
          <Row label="Customer readiness" value={`${data.firstCustomerReadiness.customerReadiness}/100`} />
          <Row label="Sales execution" value={`${data.firstCustomerReadiness.salesExecutionReadiness}/100`} />
          <Row label="Delivery readiness" value={`${data.firstCustomerReadiness.deliveryReadiness}/100`} />
          <Row label="Onboarding readiness" value={`${data.firstCustomerReadiness.onboardingReadiness}/100`} />
          <Row label="Lead sourcing" value={<BoolBadge value={data.firstCustomerReadiness.leadSourcingConfigured} />} />
          <Row label="Execution dashboard" value={<BoolBadge value={data.firstCustomerReadiness.executionDashboardConfigured} />} />
          <Row label="Customer onboarding" value={<BoolBadge value={data.firstCustomerReadiness.onboardingConfigured} />} />
          <Row label="Proposal generator" value={<BoolBadge value={data.firstCustomerReadiness.proposalGeneratorConfigured} />} />
          <Row label="Portal onboarding" value={<BoolBadge value={data.firstCustomerReadiness.portalOnboardingConfigured} />} />
          <Row label="First customer tables" value={<BoolBadge value={data.firstCustomerReadiness.firstCustomerTablesReady} />} />
          <Row label="First customer docs" value={<BoolBadge value={data.firstCustomerReadiness.firstCustomerDocsReady} />} />
          <Row label="Version v1.0.2" value={<BoolBadge value={data.firstCustomerReadiness.versionReady} />} />
          <Row label="Complete" value={<BoolBadge value={data.firstCustomerReadiness.complete} />} />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Launch candidate readiness"
        description="Production deployment, Supabase, Vercel, sales execution, onboarding, security, and revenue for v1.0.3 launch candidate."
      >
        <dl>
          <Row label="Status" value={data.launchCandidateReadiness.label} />
          <Row label="Overall score" value={`${data.launchCandidateReadiness.score}/100`} />
          <Row label="Launch readiness" value={`${data.launchCandidateReadiness.launchReadiness}/100`} />
          <Row label="Deployment" value={`${data.launchCandidateReadiness.deploymentReadiness}/100`} />
          <Row label="Sales execution" value={`${data.launchCandidateReadiness.salesReadiness}/100`} />
          <Row label="Onboarding" value={`${data.launchCandidateReadiness.onboardingReadiness}/100`} />
          <Row label="Security" value={`${data.launchCandidateReadiness.securityReadiness}/100`} />
          <Row label="Revenue" value={`${data.launchCandidateReadiness.revenueReadiness}/100`} />
          <Row label="Version v1.0.3" value={<BoolBadge value={data.launchCandidateReadiness.versionReady} />} />
          <Row label="Production domains" value={<BoolBadge value={data.launchCandidateReadiness.productionDomainsReady} />} />
          <Row label="Supabase production" value={<BoolBadge value={data.launchCandidateReadiness.supabaseProductionReady} />} />
          <Row label="Vercel production" value={<BoolBadge value={data.launchCandidateReadiness.vercelProductionReady} />} />
          <Row label="Top 100 agencies" value={<BoolBadge value={data.launchCandidateReadiness.top100Populated} />} />
          <Row label="Launch targets" value={<BoolBadge value={data.launchCandidateReadiness.launchTargetsConfigured} />} />
          <Row label="Launch docs" value={<BoolBadge value={data.launchCandidateReadiness.launchDocsReady} />} />
          <Row label="Complete" value={<BoolBadge value={data.launchCandidateReadiness.complete} />} />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Launch polish"
        description="Legal pages, support identity, documentation, status page, footers, and help center."
      >
        <dl>
          <Row label="Status" value={data.launchPolish.label} />
          <Row label="Score" value={`${data.launchPolish.score}/100`} />
          <Row label="Legal pages" value={<BoolBadge value={data.launchPolish.legalPagesReady} />} />
          <Row label="Support email" value={<BoolBadge value={data.launchPolish.supportEmailConfigured} />} />
          <Row label="Documentation" value={<BoolBadge value={data.launchPolish.documentationReady} />} />
          <Row label="Status page" value={<BoolBadge value={data.launchPolish.statusPageReady} />} />
          <Row label="Footer links" value={<BoolBadge value={data.launchPolish.footerLinksReady} />} />
          <Row label="Help center" value={<BoolBadge value={data.launchPolish.helpCenterReady} />} />
          <Row label="Marketing site" value={<BoolBadge value={data.launchPolish.marketingSiteReady} />} />
          <Row label="Complete" value={<BoolBadge value={data.launchPolish.complete} />} />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Platform health"
        description="Build, environment, database, and billing readiness."
      >
        <dl>
          <Row label="Build version" value={data.platform.buildVersion} />
          <Row label="Environment" value={data.platform.environment} />
          <Row label="NODE_ENV" value={data.platform.nodeEnv} />
          <Row label="Deployment URL" value={data.platform.deploymentUrl ?? "—"} />
          <Row
            label="Database"
            value={
              <InlineBadgeRow
                badge={data.platform.databaseHealth.ok}
                text={
                  <>
                    {data.platform.databaseHealth.message}
                    {data.platform.databaseHealth.latencyMs != null
                      ? ` (${data.platform.databaseHealth.latencyMs}ms)`
                      : null}
                  </>
                }
              />
            }
          />
          <Row
            label="Stripe configuration"
            value={
              <InlineBadgeRow
                badge={data.platform.stripeHealth.ok}
                text={data.platform.stripeHealth.message}
              />
            }
          />
          <Row label="React cache" value={<BoolBadge value={data.platform.cacheEnabled} />} />
          <Row label="Plan source" value={PLAN_SOURCE_LABELS[data.platform.planSource] ?? data.platform.planSource} />
          <Row label="Developer mode" value={<BoolBadge value={data.platform.developerMode} />} />
        </dl>
      </DiagnosticsSection>

      <p className="text-xs text-muted">
        Need billing help? Review{" "}
        <Link href="/settings/billing" className="font-medium text-primary hover:underline">
          Subscription & Billing
        </Link>
        .
      </p>
    </div>
  );
}
