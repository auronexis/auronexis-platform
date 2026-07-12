import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { Suspense } from "react";
import { Activity } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PublicAppLink } from "@/components/marketing/public-app-link";
import { StatusBadge, type StatusLevel } from "@/components/marketing/status-badge";
import { STATUS_COMPONENTS_STATIC } from "@/lib/marketing/content";
import {
  filterPublicStatusComponents,
  resolvePublicAiStatus,
  resolvePublicOverallStatus,
  type PublicStatusComponent,
} from "@/lib/marketing/public-status";
import { COMPANY_NAME } from "@/lib/company/contact";
import { checkDatabaseHealth, type DatabaseHealthLevel } from "@/lib/diagnostics/platform-health";
import { getCronDiagnosticsSnapshot } from "@/lib/jobs/health";
import { getQueueDiagnosticsSnapshot } from "@/lib/queue/health";
import { getStripeWebhookDiagnostics } from "@/lib/stripe/idempotency";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = createPageMetadataForPath("/status");

/** Live probes require runtime env — skip static prerender at build time. */
export const dynamic = "force-dynamic";

type StatusComponent = PublicStatusComponent;

function mapHealth(ok: boolean, degraded = false): StatusLevel {
  if (ok) return "operational";
  if (degraded) return "degraded";
  return "incident";
}

function mapDatabaseLevel(level: DatabaseHealthLevel): StatusLevel {
  if (level === "healthy") return "operational";
  if (level === "degraded") return "degraded";
  return "incident";
}

async function getLiveStatusOverrides(): Promise<Record<string, StatusComponent>> {
  const [database, stripeWebhook, cron, queue] = await Promise.all([
    checkDatabaseHealth(),
    getStripeWebhookDiagnostics(),
    getCronDiagnosticsSnapshot(),
    getQueueDiagnosticsSnapshot(),
  ]);

  const aiStatus = await resolvePublicAiStatus();

  return {
    Platform: {
      name: "Platform",
      status: mapDatabaseLevel(database.level),
      detail: database.level === "healthy" ? "Application services available" : database.message,
    },
    API: {
      name: "API",
      status: database.level === "unavailable" ? "incident" : "operational",
      detail: "Application and authenticated API routes",
    },
    Database: {
      name: "Database",
      status: mapDatabaseLevel(database.level),
      detail: database.level === "healthy" ? "Data services available" : "Data services impacted",
    },
    Billing: {
      name: "Billing",
      status: process.env.STRIPE_SECRET_KEY ? "operational" : "degraded",
      detail: process.env.STRIPE_SECRET_KEY
        ? "Subscription billing available"
        : "Billing availability limited",
    },
    AI: {
      name: "AI",
      status: aiStatus.status,
      detail: aiStatus.detail,
    },
    Connectors: {
      name: "Connectors",
      status: "operational",
      detail: "Integration infrastructure available",
    },
    Automation: {
      name: "Automation",
      status: mapHealth(queue.tableReachable && queue.status !== "unavailable", queue.status === "degraded"),
      detail: "Workflow execution services",
    },
    Stripe: {
      name: "Stripe",
      status: mapHealth(stripeWebhook.tableReachable, stripeWebhook.failedEvents > 0),
      detail: "Payment processing",
    },
    Cron: {
      name: "Cron",
      status: mapHealth(cron.tableReachable && cron.status !== "unavailable", cron.status === "degraded"),
      detail: "Scheduled maintenance jobs",
    },
    Queue: {
      name: "Queue",
      status: mapHealth(queue.tableReachable && queue.status !== "unavailable", queue.status === "degraded"),
      detail: "Background processing",
    },
    Observability: {
      name: "Observability",
      status:
        process.env.NEXT_PUBLIC_SENTRY_DSN ||
        process.env.NEXT_PUBLIC_POSTHOG_KEY ||
        process.env.SENTRY_DSN
          ? "operational"
          : "maintenance",
      detail: "Platform monitoring",
    },
  };
}

export default async function StatusPage() {
  const overrides = await getLiveStatusOverrides();
  const components: StatusComponent[] = filterPublicStatusComponents(
    STATUS_COMPONENTS_STATIC.map((item) => {
      const live = overrides[item.name];
      return live ?? { name: item.name, status: item.status, detail: item.detail };
    }),
  );

  const overall = resolvePublicOverallStatus(components);

  const readinessColorStyles = {
    green: "border-success/30 bg-success/5 text-success",
    blue: "border-primary/30 bg-primary/5 text-primary",
    amber: "border-warning/30 bg-warning/5 text-warning",
    orange: "border-warning/40 bg-warning/10 text-warning",
    red: "border-danger/30 bg-danger/5 text-danger",
  } as const;

  return (
    <MarketingShell>
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-6">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-primary" aria-hidden />
            <div>
              <h1 className="text-xl font-semibold text-white">{COMPANY_NAME} Status</h1>
              <p className="text-sm text-primary-foreground/75">
                Customer-impacting platform services and availability.
              </p>
            </div>
          </div>
          <Suspense
            fallback={
              <span className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/60">App</span>
            }
          >
            <PublicAppLink className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/90 hover:text-white hover:underline" />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <div
          className={cn(
            "rounded-2xl border p-6",
            readinessColorStyles[overall.color],
          )}
        >
          <p className="text-sm opacity-80">Overall status</p>
          <p className="mt-2 text-2xl font-semibold">{overall.label}</p>
          <p className="mt-1 text-sm font-medium opacity-90">{overall.tierLabel}</p>
        </div>

        <ul className="mt-8 space-y-3">
          {components.map((component) => (
            <li
              key={component.name}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-white">{component.name}</p>
                <p className="text-sm text-primary-foreground/75">{component.detail}</p>
              </div>
              <StatusBadge status={component.status} />
            </li>
          ))}
        </ul>
      </main>
    </MarketingShell>
  );
}
