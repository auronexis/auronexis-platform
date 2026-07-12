"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import { testOpenAIConnectionAction } from "@/lib/integrations/center/actions";
import type { IntegrationCenterSnapshot } from "@/lib/integrations/center/types";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type IntegrationCenterWorkspaceProps = {
  snapshot: IntegrationCenterSnapshot;
};

const NO_DATA = "No data available";

function formatTimestamp(value: string | null): string {
  if (!value) {
    return NO_DATA;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: string }) {
  const positive = status === "Connected";
  const warning = status === "Degraded" || status === "Configured";
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        positive
          ? "border-success/25 bg-success/10 text-success"
          : warning
            ? "border-warning/25 bg-warning/10 text-warning"
            : "border-border bg-muted/10 text-muted",
      )}
    >
      {status}
    </span>
  );
}

function IntegrationRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function IntegrationCard({
  title,
  description,
  configureHref,
  children,
  actions,
}: {
  title: string;
  description: string;
  configureHref?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <PageSurface className="h-full">
      <div className="flex items-start justify-between gap-3">
        <PageSurfaceHeading title={title} description={description} />
        {configureHref ? (
          <Link href={configureHref} className={cn(linkText, "shrink-0 text-sm")}>
            Configure
          </Link>
        ) : null}
      </div>
      <dl className="mt-4 divide-y divide-border/50">{children}</dl>
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </PageSurface>
  );
}

export function IntegrationCenterWorkspace({ snapshot }: IntegrationCenterWorkspaceProps) {
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    latencyMs: number | null;
  } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isTesting, startTest] = useTransition();

  const handleTestOpenAI = () => {
    setTestResult(null);
    setTestError(null);
    trackAnalyticsEvent("ai_connection_test_started", { provider: "openai" });
    startTest(async () => {
      const result = await testOpenAIConnectionAction();
      if (!result.ok && result.message.includes("permission")) {
        setTestError(result.message);
        trackAnalyticsEvent("ai_connection_test_failed", { provider: "openai", code: "access_denied" });
        return;
      }
      trackAnalyticsEvent(
        result.ok ? "ai_connection_test_succeeded" : "ai_connection_test_failed",
        { provider: "openai", state: result.state ?? "unknown" },
      );
      setTestResult(result);
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-2">
        <IntegrationCard
          title="OpenAI"
          description="Primary AI provider for report assistant and automation features."
          configureHref="/settings/diagnostics"
          actions={
            snapshot.openai.canTestConnection ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleTestOpenAI}
                loading={isTesting}
                loadingText="Testing…"
                aria-label="Test OpenAI connection"
              >
                Test connection
              </Button>
            ) : null
          }
        >
          <IntegrationRow
            label="Connection status"
            value={<StatusBadge status={snapshot.openai.connectionStatus} />}
          />
          <IntegrationRow label="Provider" value={snapshot.openai.provider} />
          <IntegrationRow
            label="Current model"
            value={snapshot.openai.currentModel ?? NO_DATA}
          />
          <IntegrationRow
            label="Last successful check"
            value={formatTimestamp(snapshot.openai.lastSuccessfulCheck)}
          />
          <IntegrationRow
            label="Last failed check"
            value={formatTimestamp(snapshot.openai.lastFailedCheck)}
          />
          <IntegrationRow
            label="Latency"
            value={
              snapshot.openai.lastLatencyMs != null
                ? `${snapshot.openai.lastLatencyMs} ms`
                : NO_DATA
            }
          />
          <IntegrationRow label="Usage" value={snapshot.openai.usageSummary ?? NO_DATA} />
          {snapshot.openai.sanitizedError ? (
            <IntegrationRow label="Last error" value={snapshot.openai.sanitizedError} />
          ) : null}
        </IntegrationCard>

        <IntegrationCard
          title="Anthropic"
          description="Optional Anthropic provider for future AI workloads."
          configureHref="/settings/diagnostics"
        >
          <IntegrationRow
            label="Connection status"
            value={<StatusBadge status={snapshot.anthropic.connectionStatus} />}
          />
        </IntegrationCard>

        <IntegrationCard
          title="Slack"
          description="Workspace notifications and automation delivery."
          configureHref="/automation/connectors"
        >
          <IntegrationRow
            label="Workspace"
            value={snapshot.slack.workspace ?? NO_DATA}
          />
          <IntegrationRow
            label="Connected channels"
            value={snapshot.slack.connectedChannels ?? NO_DATA}
          />
          <IntegrationRow label="Status" value={snapshot.slack.status} />
        </IntegrationCard>

        <IntegrationCard
          title="Stripe"
          description="Subscription billing, customer portal, and invoice synchronization."
          configureHref="/settings/billing"
        >
          <IntegrationRow
            label="Connection status"
            value={<StatusBadge status={snapshot.stripe.connectionStatus} />}
          />
          <IntegrationRow label="Mode" value={snapshot.stripe.mode ?? NO_DATA} />
          <IntegrationRow label="Customer portal" value={snapshot.stripe.customerPortal} />
          <IntegrationRow label="Invoices" value={snapshot.stripe.invoices} />
        </IntegrationCard>

        <IntegrationCard
          title="Webhooks"
          description="Outbound webhook delivery for API integrations."
          configureHref="/settings/api"
        >
          <IntegrationRow
            label="Active webhooks"
            value={
              snapshot.webhooks.activeWebhooks !== null
                ? snapshot.webhooks.activeWebhooks
                : NO_DATA
            }
          />
          <IntegrationRow
            label="Last delivery"
            value={formatTimestamp(snapshot.webhooks.lastDelivery)}
          />
          <IntegrationRow
            label="Failures"
            value={
              snapshot.webhooks.failures !== null ? snapshot.webhooks.failures : NO_DATA
            }
          />
        </IntegrationCard>

        <IntegrationCard
          title="Resend"
          description="Transactional email delivery for reports and notifications."
          configureHref="/settings/email"
        >
          <IntegrationRow label="Domain status" value={snapshot.resend.domainStatus} />
          <IntegrationRow label="Verified" value={snapshot.resend.verified} />
          <IntegrationRow
            label="Last email"
            value={formatTimestamp(snapshot.resend.lastEmail)}
          />
        </IntegrationCard>

        <IntegrationCard
          title="REST API"
          description="Versioned REST API with scoped keys and usage logging."
          configureHref="/settings/api"
        >
          <IntegrationRow label="Active API keys" value={snapshot.restApi.activeKeyCount} />
          <IntegrationRow label="Requests today" value={snapshot.restApi.requestsToday} />
          <IntegrationRow
            label="Last usage"
            value={formatTimestamp(snapshot.restApi.lastUsage)}
          />
          <IntegrationRow
            label="Documentation"
            value={
              <Link href={snapshot.restApi.documentationUrl} className={linkText}>
                Open API docs
              </Link>
            }
          />
        </IntegrationCard>
      </div>

      {testResult || testError ? (
        <PageSurface>
          <PageSurfaceHeading
            title="OpenAI connection test"
            description="Result from the latest Responses API health probe."
          />
          <div className="mt-4">
            {testResult ? (
              <FormAlert variant={testResult.ok ? "success" : "error"}>
                {testResult.message}
                {testResult.latencyMs !== null ? ` (${testResult.latencyMs} ms)` : ""}
              </FormAlert>
            ) : null}
            {testError ? <FormAlert variant="error">{testError}</FormAlert> : null}
          </div>
        </PageSurface>
      ) : null}
    </div>
  );
}
