"use client";

import { useState, useTransition } from "react";
import { FormAlert } from "@/components/ui/form-alert";
import {
  ApiEmptyState,
  ApiKeyCard,
  CreateApiKeyDialog,
  CreateWebhookDialog,
  WebhookDeliveryList,
  WebhookEndpointCard,
} from "@/components/settings/api";
import {
  createApiKeyAction,
  createWebhookEndpointAction,
  disableWebhookEndpointAction,
  revokeApiKeyAction,
} from "@/lib/api/keys/actions";
import type { ApiDashboardSnapshot, ApiKeyType, ApiScope } from "@/lib/api/types";
import type { ApiKeyMode } from "@/lib/api/keys/hash";

type ApiSettingsWorkspaceProps = {
  snapshot: ApiDashboardSnapshot;
};

export function ApiSettingsWorkspace({ snapshot }: ApiSettingsWorkspaceProps) {
  const [keys, setKeys] = useState(snapshot.keys);
  const [endpoints, setEndpoints] = useState(snapshot.webhookEndpoints);
  const [plaintextKey, setPlaintextKey] = useState<string | null>(null);
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreateKey = (formData: FormData) => {
    setError(null);
    setSuccess(null);
    setPlaintextKey(null);

    const scopes = formData.getAll("scopes").map(String) as ApiScope[];

    startTransition(async () => {
      const result = await createApiKeyAction({
        name: String(formData.get("name") ?? ""),
        keyType: String(formData.get("keyType") ?? "workspace") as ApiKeyType,
        keyMode: String(formData.get("keyMode") ?? "live") as ApiKeyMode,
        scopes,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setKeys((current) => [result.data, ...current]);
      setPlaintextKey(result.data.plaintextKey);
      setSuccess(`API key "${result.data.name}" created. Copy the key now — it will not be shown again.`);
    });
  };

  const handleRevoke = (keyId: string, name: string) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await revokeApiKeyAction(keyId);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setKeys((current) =>
        current.map((key) => (key.id === keyId ? { ...key, status: "revoked" } : key)),
      );
      setSuccess(`API key "${name}" revoked.`);
    });
  };

  const handleCreateWebhook = (formData: FormData) => {
    setError(null);
    setSuccess(null);
    setWebhookSecret(null);

    startTransition(async () => {
      const result = await createWebhookEndpointAction({
        name: String(formData.get("name") ?? ""),
        url: String(formData.get("url") ?? ""),
        events: formData.getAll("events").map(String),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setWebhookSecret(result.data.signingSecret);
      setEndpoints((current) => [
        {
          id: result.data.endpointId,
          organizationId: snapshot.keys[0]?.organizationId ?? "",
          url: result.data.url,
          description: String(formData.get("name") ?? "Webhook endpoint"),
          events: formData.getAll("events").map(String),
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...current,
      ]);
      setSuccess(`Webhook endpoint registered for ${result.data.url}.`);
    });
  };

  const handleDisableEndpoint = (endpointId: string) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await disableWebhookEndpointAction(endpointId);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setEndpoints((current) =>
        current.map((endpoint) =>
          endpoint.id === endpointId ? { ...endpoint, status: "disabled" } : endpoint,
        ),
      );
      setSuccess("Webhook endpoint disabled.");
    });
  };

  return (
    <div className="space-y-8">
      {error ? <FormAlert variant="error">{error}</FormAlert> : null}
      {success ? <FormAlert variant="success">{success}</FormAlert> : null}
      {plaintextKey ? (
        <FormAlert variant="warning">
          Plaintext API key (shown once): <code className="break-all">{plaintextKey}</code>
        </FormAlert>
      ) : null}
      {webhookSecret ? (
        <FormAlert variant="warning">
          Webhook signing secret (shown once): <code className="break-all">{webhookSecret}</code>
        </FormAlert>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active API keys", value: snapshot.activeKeyCount },
          { label: "Requests today", value: snapshot.requestsToday },
          { label: "Rate limited today", value: snapshot.rateLimitedToday },
          { label: "Webhook deliveries today", value: snapshot.webhookDeliveriesToday },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-surface/80 px-4 py-4">
            <p className="text-xs text-muted">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface/80 p-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Create API key</h2>
          <p className="mt-1 text-sm text-muted">
            Keys are hashed at rest. Use Authorization: Bearer ax_live_… or ax_test_…
          </p>
        </div>
        <CreateApiKeyDialog onSubmit={handleCreateKey} loading={isPending} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">API keys</h2>
        {keys.length === 0 ? (
          <ApiEmptyState
            title="No API keys yet"
            description="Create a key to authenticate Public API requests."
          />
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <ApiKeyCard
                key={key.id}
                apiKey={key}
                onRevoke={handleRevoke}
                disabled={isPending}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface/80 p-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Outbound webhooks</h2>
          <p className="mt-1 text-sm text-muted">
            Deliveries are signed with HMAC SHA-256. Headers: x-auroranexis-signature,
            x-auroranexis-timestamp, x-auroranexis-event, x-auroranexis-delivery-id.
          </p>
        </div>
        <CreateWebhookDialog onSubmit={handleCreateWebhook} loading={isPending} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Webhook endpoints</h2>
        {endpoints.length === 0 ? (
          <ApiEmptyState
            title="No webhook endpoints"
            description="Register an endpoint to receive outbound events."
          />
        ) : (
          <div className="space-y-2">
            {endpoints.map((endpoint) => (
              <WebhookEndpointCard
                key={endpoint.id}
                endpoint={endpoint}
                onDisable={handleDisableEndpoint}
                disabled={isPending}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Recent deliveries</h2>
        <WebhookDeliveryList deliveries={snapshot.recentDeliveries} />
      </section>
    </div>
  );
}
