import Link from "next/link";
import { FormAlert } from "@/components/ui/form-alert";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import {
  formatMoneyFromCents,
  shortenStripeId,
} from "@/lib/billing/status";
import type { BillingProductionDiagnostics } from "@/lib/billing/production-diagnostics";
import {
  classifySubscriptionRow,
  getSubscriptionHygieneLabel,
  getWebhookEventStatusLabel,
  maskStripeId,
  type BillingHygieneFlag,
} from "@/lib/billing/hygiene";
import { formatBillingDateTime } from "@/lib/billing/types";
import { cn } from "@/lib/utils/cn";

type BillingDiagnosticsPanelProps = {
  data: BillingProductionDiagnostics;
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

function PresenceBadge({ present }: { present: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
        present
          ? "border-success/25 bg-success/10 text-success"
          : "border-warning/25 bg-warning/10 text-warning",
      )}
    >
      {present ? "Present" : "Missing"}
    </span>
  );
}

function WarningList({ warnings }: { warnings: BillingHygieneFlag[] }) {
  if (warnings.length === 0) {
    return <p className="text-sm text-muted">No sanity warnings detected.</p>;
  }

  return (
    <ul className="space-y-2">
      {warnings.map((warning) => (
        <li key={`${warning.code}-${warning.entityId ?? "global"}`}>
          {warning.severity === "info" ? (
            <div className="rounded-lg border border-border/70 bg-muted/5 px-3 py-2 text-sm text-muted">
              <span className="font-medium text-foreground">{warning.code.replaceAll("_", " ")}:</span>{" "}
              {warning.message}
            </div>
          ) : (
            <FormAlert variant="warning">
              <span className="font-medium">{warning.code.replaceAll("_", " ")}:</span> {warning.message}
            </FormAlert>
          )}
        </li>
      ))}
    </ul>
  );
}

function RowKindBadge({ kind }: { kind: string }) {
  const styles: Record<string, string> = {
    production: "border-success/25 bg-success/10 text-success",
    stale: "border-border bg-muted/10 text-muted",
    demo: "border-warning/25 bg-warning/10 text-warning",
    internal: "border-border bg-muted/10 text-muted",
    inconsistent: "border-danger/25 bg-danger/10 text-danger",
    unknown: "border-border bg-muted/10 text-muted",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
        styles[kind] ?? styles.unknown,
      )}
    >
      {kind}
    </span>
  );
}

export function BillingDiagnosticsPanel({ data }: BillingDiagnosticsPanelProps) {
  const subscription = data.subscription;
  const subscriptionKind = classifySubscriptionRow(subscription, {
    mappedPlanKey: data.resolvedPlanKey,
  });
  const statusLabel = getSubscriptionHygieneLabel(subscription);

  return (
    <div className="space-y-6">
      <FormAlert variant="warning">
        Internal billing diagnostics only. No records are deleted automatically. Customer-facing billing
        remains on{" "}
        <Link href="/settings/billing" className="font-medium underline">
          Subscription &amp; Billing
        </Link>
        .
      </FormAlert>

      <DiagnosticsSection
        title="Workspace"
        description="Production billing context for this organization."
      >
        <dl>
          <Row label="Organization name" value={data.organizationName} />
          <Row
            label="Organization ID"
            value={<code className="font-mono text-xs">{data.organizationId}</code>}
          />
        </dl>
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Sanity checks"
        description="Diagnostics only — these warnings do not block billing or feature access."
      >
        <WarningList warnings={[...data.hygieneFlags, ...data.sanityWarnings]} />
      </DiagnosticsSection>

      <DiagnosticsSection
        title="organization_subscriptions"
        description="Current subscription row synced from Stripe webhooks and checkout."
      >
        {subscription ? (
          <dl>
            <Row label="Row kind" value={<RowKindBadge kind={subscriptionKind} />} />
            <Row label="Status label" value={statusLabel} />
            <Row label="Raw status" value={subscription.status} />
            <Row
              label="Stripe customer ID"
              value={
                <span className="inline-flex flex-wrap items-center gap-2">
                  <PresenceBadge present={data.hasStripeCustomerId} />
                  <code className="font-mono text-xs">{maskStripeId(subscription.stripe_customer_id)}</code>
                </span>
              }
            />
            <Row
              label="Stripe subscription ID"
              value={
                <span className="inline-flex flex-wrap items-center gap-2">
                  <PresenceBadge present={data.hasStripeSubscriptionId} />
                  <code className="font-mono text-xs">
                    {maskStripeId(subscription.stripe_subscription_id)}
                  </code>
                </span>
              }
            />
            <Row
              label="Stripe price ID"
              value={<code className="font-mono text-xs">{maskStripeId(subscription.stripe_price_id)}</code>}
            />
            <Row label="Resolved plan" value={data.resolvedPlanLabel ?? "—"} />
            <Row label="Resolved plan key" value={data.resolvedPlanKey ?? "—"} />
            <Row
              label="Current period start"
              value={formatBillingDateTime(subscription.current_period_start) ?? "—"}
            />
            <Row
              label="Current period end"
              value={formatBillingDateTime(subscription.current_period_end) ?? "—"}
            />
            <Row
              label="Updated at"
              value={formatBillingDateTime(subscription.updated_at) ?? "—"}
            />
          </dl>
        ) : (
          <p className="text-sm text-muted">No organization_subscriptions row found.</p>
        )}
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Latest customer_invoices"
        description={`Latest ${data.invoices.length} invoice rows — stale/demo rows are labeled, never deleted.`}
      >
        {data.invoices.length === 0 ? (
          <p className="text-sm text-muted">No customer_invoices rows synced yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-muted">
                  <th className="py-2 pr-4 font-medium">Invoice</th>
                  <th className="py-2 pr-4 font-medium">Label</th>
                  <th className="py-2 pr-4 font-medium">Kind</th>
                  <th className="py-2 pr-4 font-medium">Due</th>
                  <th className="py-2 pr-4 font-medium">Paid</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border/40">
                    <td className="py-3 pr-4 font-mono text-xs">
                      {shortenStripeId(invoice.stripeInvoiceId)}
                    </td>
                    <td className="py-3 pr-4">{invoice.hygieneLabel}</td>
                    <td className="py-3 pr-4">
                      <RowKindBadge kind={invoice.rowKind} />
                    </td>
                    <td className="py-3 pr-4">
                      {formatMoneyFromCents(invoice.amountDue, invoice.currency)}
                    </td>
                    <td className="py-3 pr-4">
                      {formatMoneyFromCents(invoice.amountPaid, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Latest stripe_webhook_events"
        description={`Latest ${data.webhookEvents.length} webhook rows linked to this workspace.`}
      >
        {data.webhookEvents.length === 0 ? (
          <p className="text-sm text-muted">
            No stripe_webhook_events rows with this organization_id or linked billing_events yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-muted">
                  <th className="py-2 pr-4 font-medium">Event ID</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Received</th>
                  <th className="py-2 pr-4 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {data.webhookEvents.map((event) => (
                  <tr key={event.id} className="border-b border-border/40">
                    <td className="py-3 pr-4 font-mono text-xs">{shortenStripeId(event.stripeEventId)}</td>
                    <td className="py-3 pr-4">{event.eventType}</td>
                    <td className="py-3 pr-4">{getWebhookEventStatusLabel(event.status)}</td>
                    <td className="py-3 pr-4 text-muted">
                      {formatBillingDateTime(event.receivedAt) ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-muted">{event.errorMessage ? "Yes" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DiagnosticsSection>

      <DiagnosticsSection
        title="Latest billing_events"
        description={`Latest ${data.billingEvents.length} billing audit events for this organization.`}
      >
        {data.billingEvents.length === 0 ? (
          <p className="text-sm text-muted">No billing_events rows recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-muted">
                  <th className="py-2 pr-4 font-medium">Event type</th>
                  <th className="py-2 pr-4 font-medium">Stripe event</th>
                  <th className="py-2 pr-4 font-medium">Created</th>
                  <th className="py-2 pr-4 font-medium">Payload</th>
                </tr>
              </thead>
              <tbody>
                {data.billingEvents.map((event) => (
                  <tr key={event.id} className="border-b border-border/40">
                    <td className="py-3 pr-4">{event.eventType}</td>
                    <td className="py-3 pr-4 font-mono text-xs">
                      {event.stripeEventId ? shortenStripeId(event.stripeEventId) : "—"}
                    </td>
                    <td className="py-3 pr-4 text-muted">
                      {formatBillingDateTime(event.createdAt) ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-muted">{event.payloadSummary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DiagnosticsSection>

      <p className="text-xs text-muted">
        Status tone reference: subscription labels use{" "}
        <code className="font-mono">getBillingStatusLabel()</code>; invoice labels use{" "}
        <code className="font-mono">getInvoiceDisplayLabel()</code>; webhook labels use{" "}
        <code className="font-mono">getWebhookEventStatusLabel()</code>.
      </p>
    </div>
  );
}
