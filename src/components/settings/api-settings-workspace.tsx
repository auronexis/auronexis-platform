"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  createApiKeyAction,
  createWebhookEndpointAction,
  revokeApiKeyAction,
} from "@/lib/api/keys/actions";
import {
  ALL_API_SCOPES,
  API_SCOPE_LABELS,
  API_WEBHOOK_EVENTS,
  type ApiDashboardSnapshot,
  type ApiKeyType,
  type ApiScope,
} from "@/lib/api/types";
import { formatBillingDateTime } from "@/lib/billing/types";

type ApiSettingsWorkspaceProps = {
  snapshot: ApiDashboardSnapshot;
};

export function ApiSettingsWorkspace({ snapshot }: ApiSettingsWorkspaceProps) {
  const [keys, setKeys] = useState(snapshot.keys);
  const [plaintextKey, setPlaintextKey] = useState<string | null>(null);
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const scopeOptions = ALL_API_SCOPES.map((scope) => ({
    value: scope,
    label: API_SCOPE_LABELS[scope],
  }));

  const handleCreateKey = (formData: FormData) => {
    setError(null);
    setSuccess(null);
    setPlaintextKey(null);

    const scopes = formData.getAll("scopes").map(String) as ApiScope[];

    startTransition(async () => {
      const result = await createApiKeyAction({
        name: String(formData.get("name") ?? ""),
        keyType: String(formData.get("keyType") ?? "workspace") as ApiKeyType,
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
        url: String(formData.get("url") ?? ""),
        description: String(formData.get("description") ?? "") || undefined,
        events: formData.getAll("events").map(String),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setWebhookSecret(result.data.signingSecret);
      setSuccess(`Webhook endpoint registered for ${result.data.url}.`);
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
            Keys are hashed at rest. The plaintext value is shown only once after creation.
          </p>
        </div>
        <form action={handleCreateKey} className="grid gap-4 md:grid-cols-2">
          <Input name="name" label="Key name" placeholder="Production integration" required />
          <Select
            name="keyType"
            label="Key type"
            defaultValue="workspace"
            options={[
              { value: "workspace", label: "Workspace API key" },
              { value: "personal", label: "Personal API key" },
            ]}
          />
          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-medium text-foreground">Scopes</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {scopeOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" name="scopes" value={option.value} defaultChecked />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" loading={isPending}>
            Create API key
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">API keys</h2>
        <div className="space-y-2">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 px-4 py-3"
            >
              <div>
                <p className="font-medium text-foreground">{key.name}</p>
                <p className="text-xs text-muted">
                  {key.keyPrefix}… · {key.keyType} · {key.status} · last used{" "}
                  {key.lastUsedAt ? formatBillingDateTime(key.lastUsedAt) : "never"}
                </p>
              </div>
              {key.status === "active" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => handleRevoke(key.id, key.name)}
                >
                  Revoke
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface/80 p-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Outbound webhooks</h2>
          <p className="mt-1 text-sm text-muted">
            Deliveries are signed with HMAC SHA-256 using a secret shown once at endpoint creation.
          </p>
        </div>
        <form action={handleCreateWebhook} className="grid gap-4 md:grid-cols-2">
          <Input name="url" label="Endpoint URL" type="url" placeholder="https://example.com/webhooks/auroranexis" required />
          <Input name="description" label="Description" placeholder="Optional description" />
          <div className="md:col-span-2 grid gap-2 sm:grid-cols-2">
            {API_WEBHOOK_EVENTS.map((event) => (
              <label key={event} className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" name="events" value={event} defaultChecked />
                {event}
              </label>
            ))}
          </div>
          <Button type="submit" loading={isPending}>
            Add webhook endpoint
          </Button>
        </form>
      </section>
    </div>
  );
}
