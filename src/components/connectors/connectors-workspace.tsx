"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import {
  revokeConnectorConnectionAction,
  runConnectorSyncAction,
} from "@/lib/connectors/actions";
import type { ConnectorsDashboardSnapshot } from "@/lib/connectors/types";
import { cn } from "@/lib/utils/cn";
import { formatBillingDateTime } from "@/lib/billing/types";

type ConnectorsWorkspaceProps = {
  snapshot: ConnectorsDashboardSnapshot;
  canManage: boolean;
  statusMessage?: string | null;
  statusVariant?: "success" | "error" | null;
};

const HEALTH_LABELS: Record<
  ConnectorsDashboardSnapshot["connectors"][number]["health"]["status"],
  string
> = {
  healthy: "Healthy",
  degraded: "Degraded",
  unhealthy: "Unhealthy",
  unknown: "Not connected",
};

export function ConnectorsWorkspace({
  snapshot,
  canManage,
  statusMessage,
  statusVariant,
}: ConnectorsWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleSync = (connectionId: string, connectorId: ConnectorsDashboardSnapshot["connectors"][number]["definition"]["id"]) => {
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const result = await runConnectorSyncAction({
        connectionId,
        connectorId,
        syncType: "manual",
      });

      if (!result.ok) {
        setActionError(result.error);
        return;
      }

      setActionSuccess(
        result.data.status === "completed"
          ? `Sync completed (${result.data.recordsChanged} records, ${result.data.durationMs}ms).`
          : `Sync failed: ${result.data.errorMessage ?? "Unknown error"}.`,
      );
      router.refresh();
    });
  };

  const handleRevoke = (connectionId: string, name: string) => {
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const result = await revokeConnectorConnectionAction(connectionId);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }

      setActionSuccess(`${name} disconnected. OAuth tokens were revoked in the secrets vault.`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      {statusMessage && statusVariant ? (
        <FormAlert variant={statusVariant === "success" ? "success" : "error"}>
          {statusMessage}
        </FormAlert>
      ) : null}
      {actionError ? <FormAlert variant="error">{actionError}</FormAlert> : null}
      {actionSuccess ? <FormAlert variant="success">{actionSuccess}</FormAlert> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Registered connectors", value: snapshot.registeredCount },
          { label: "Connected", value: snapshot.connectedCount },
          { label: "Healthy", value: snapshot.healthyCount },
          { label: "Tokens expiring soon", value: snapshot.expiringSoonCount },
          { label: "Last sync failures", value: snapshot.lastSyncFailures },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-surface/80 px-4 py-4">
            <p className="text-xs text-muted">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Enterprise connectors</h2>
          <p className="mt-1 text-sm text-muted">
            Native OAuth connectors for Google, Microsoft, Jira, GitHub, CRM, and helpdesk platforms.
            Tokens are stored encrypted in the secrets vault and never displayed.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.connectors.map(({ definition, connection, health }) => {
            const connected = connection?.status === "connected";
            const oauthEnabled = definition.oauth !== "none";

            return (
              <article
                key={definition.id}
                className="rounded-2xl border border-border bg-surface/80 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{definition.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-wide text-muted">{definition.id}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      health.status === "healthy"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : health.status === "degraded"
                          ? "bg-amber-500/10 text-amber-600"
                          : health.status === "unknown"
                            ? "bg-muted/20 text-muted"
                            : "bg-red-500/10 text-red-600",
                    )}
                  >
                    {HEALTH_LABELS[health.status]}
                  </span>
                </div>

                <p className="mt-3 text-sm text-muted">{definition.description}</p>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Connection</dt>
                    <dd className="font-medium text-foreground">
                      {connected ? connection.displayName : "Not connected"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Token expiry</dt>
                    <dd className="font-medium text-foreground">
                      {connection?.tokenExpiresAt
                        ? formatBillingDateTime(connection.tokenExpiresAt)
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Last sync</dt>
                    <dd className="font-medium text-foreground">
                      {connection?.lastSyncAt
                        ? formatBillingDateTime(connection.lastSyncAt)
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Sync status</dt>
                    <dd className="font-medium capitalize text-foreground">
                      {connection?.lastSyncStatus?.replace(/_/g, " ") ?? "—"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Actions</p>
                  <p className="mt-1 text-xs text-muted">
                    {definition.supportedActions.slice(0, 3).join(", ")}
                    {definition.supportedActions.length > 3 ? "…" : ""}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Triggers</p>
                  <p className="mt-1 text-xs text-muted">
                    {definition.supportedTriggers.slice(0, 3).join(", ")}
                    {definition.supportedTriggers.length > 3 ? "…" : ""}
                  </p>
                </div>

                {canManage ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {oauthEnabled && !connected ? (
                      <Link
                        href={`/api/connectors/oauth/${definition.id}/authorize`}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-transparent bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary-hover"
                      >
                        Connect
                      </Link>
                    ) : null}
                    {connected && connection ? (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isPending}
                          onClick={() => handleSync(connection.id, definition.id)}
                        >
                          Sync now
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => handleRevoke(connection.id, definition.name)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
