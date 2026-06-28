import Link from "next/link";
import type { IntegrationHealthSnapshot } from "@/lib/integrations/types";
import type { IntegrationSimulationResult } from "@/lib/integrations/types";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

export type ProviderCredentialView = {
  providerId: string;
  configuredSecretCount: number;
  activeSecretCount: number;
};

type IntegrationsCatalogProps = {
  providers: IntegrationHealthSnapshot[];
  credentialSummaries?: ProviderCredentialView[];
  canManageSecrets?: boolean;
};

const STATUS_LABELS: Record<IntegrationHealthSnapshot["status"], string> = {
  configured: "Configured",
  missing_credentials: "Missing credentials",
  invalid_config: "Invalid config",
  disabled: "Disabled",
  simulation_available: "Simulation available",
};

export function IntegrationsCatalog({
  providers,
  credentialSummaries = [],
  canManageSecrets = false,
}: IntegrationsCatalogProps) {
  const summaryByProvider = new Map(
    credentialSummaries.map((summary) => [summary.providerId, summary]),
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {providers.map((provider) => {
        const summary = summaryByProvider.get(provider.providerId);

        return (
          <article
            key={provider.providerId}
            className="rounded-2xl border border-border bg-surface/80 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">{provider.providerName}</h3>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted">{provider.providerId}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {STATUS_LABELS[provider.status]}
              </span>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Stored secrets</dt>
                <dd className="font-medium text-foreground">
                  {summary ? summary.activeSecretCount : provider.configuredSecretCount}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Missing credentials</dt>
                <dd className="font-medium text-foreground">
                  {summary?.activeSecretCount === 0 ? "Yes" : provider.missingSecretIds.length > 0 ? "Yes" : "No"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Simulation</dt>
                <dd className="font-medium text-foreground">
                  {provider.simulationSupported ? "Supported" : "Unavailable"}
                </dd>
              </div>
            </dl>
            {provider.notes[0] ? (
              <p className="mt-4 text-xs text-muted">{provider.notes[0]}</p>
            ) : null}
            {canManageSecrets ? (
              <Link
                href="/automation/integrations/secrets"
                className={cn(linkText, "mt-4 inline-flex text-xs")}
              >
                Manage secrets
              </Link>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

type IntegrationSimulationPreviewProps = {
  sample: IntegrationSimulationResult;
};

export function IntegrationSimulationPreview({ sample }: IntegrationSimulationPreviewProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-5">
      <h3 className="text-base font-semibold text-foreground">Simulation preview</h3>
      <p className="mt-1 text-sm text-muted">
        Sample request for {sample.providerName}. No outbound network calls are made.
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="text-muted">Secret reference</dt>
          <dd className="font-medium capitalize text-foreground">{sample.secretReferenceStatus}</dd>
        </div>
        <div>
          <dt className="text-muted">Method</dt>
          <dd className="font-mono text-foreground">{sample.requestPreview.method}</dd>
        </div>
        <div>
          <dt className="text-muted">URL</dt>
          <dd className="break-all font-mono text-xs text-foreground">{sample.requestPreview.url}</dd>
        </div>
        <div>
          <dt className="text-muted">Headers</dt>
          <dd className="mt-1 rounded-lg bg-background/80 p-3 font-mono text-xs text-foreground">
            {JSON.stringify(sample.requestPreview.headers, null, 2)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Payload</dt>
          <dd className="mt-1 rounded-lg bg-background/80 p-3 font-mono text-xs text-foreground">
            {JSON.stringify(sample.requestPreview.body ?? {}, null, 2)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
