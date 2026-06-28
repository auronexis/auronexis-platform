"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createIntegrationSecretAction,
  deleteIntegrationSecretAction,
  rotateIntegrationSecretAction,
} from "@/lib/integrations/secrets/actions";
import {
  INTEGRATION_SECRET_STATUS_LABELS,
  INTEGRATION_SECRET_TYPE_LABELS,
  INTEGRATION_SECRET_TYPES,
  type IntegrationSecretReferenceView,
} from "@/lib/integrations/secrets/types";
import { INTEGRATION_PROVIDER_OPTIONS } from "@/lib/integrations/provider-options";
import { formatBillingDateTime } from "@/lib/billing/types";

type IntegrationSecretsWorkspaceProps = {
  initialSecrets: IntegrationSecretReferenceView[];
  encryptionKeyConfigured: boolean;
  encryptionKeyWarning: string | null;
};

export function IntegrationSecretsWorkspace({
  initialSecrets,
  encryptionKeyConfigured,
  encryptionKeyWarning,
}: IntegrationSecretsWorkspaceProps) {
  const [secrets, setSecrets] = useState(initialSecrets);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [rotateTarget, setRotateTarget] = useState<IntegrationSecretReferenceView | null>(null);
  const [isPending, startTransition] = useTransition();

  const providerOptions = useMemo(
    () =>
      INTEGRATION_PROVIDER_OPTIONS.map((provider) => ({
        value: provider.id,
        label: provider.name,
      })),
    [],
  );

  const secretTypeOptions = INTEGRATION_SECRET_TYPES.map((type) => ({
    value: type,
    label: INTEGRATION_SECRET_TYPE_LABELS[type],
  }));

  const handleCreate = (formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);

    startTransition(async () => {
      const result = await createIntegrationSecretAction({
        providerId: String(formData.get("providerId") ?? ""),
        secretType: String(formData.get("secretType") ?? "api_key") as IntegrationSecretReferenceView["secretType"],
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? "") || undefined,
        plaintextValue: String(formData.get("plaintextValue") ?? ""),
      });

      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      setSecrets((current) => [result.data, ...current]);
      setShowCreateForm(false);
      setFormSuccess(
        `Secret "${result.data.name}" saved. The value is masked as ${result.data.maskedPreview} and will not be shown again.`,
      );
    });
  };

  const handleRotate = (formData: FormData) => {
    if (!rotateTarget) {
      return;
    }

    setFormError(null);
    setFormSuccess(null);

    startTransition(async () => {
      const result = await rotateIntegrationSecretAction({
        secretId: rotateTarget.id,
        plaintextValue: String(formData.get("plaintextValue") ?? ""),
      });

      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      setSecrets((current) =>
        current.map((secret) => (secret.id === result.data.id ? result.data : secret)),
      );
      setRotateTarget(null);
      setFormSuccess(`Secret "${result.data.name}" rotated. New masked preview: ${result.data.maskedPreview}.`);
    });
  };

  const handleDelete = (secret: IntegrationSecretReferenceView) => {
    setFormError(null);
    setFormSuccess(null);

    startTransition(async () => {
      const result = await deleteIntegrationSecretAction(secret.id);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      setSecrets((current) => current.filter((item) => item.id !== secret.id));
      setFormSuccess(`Secret "${secret.name}" deleted.`);
    });
  };

  return (
    <div className="space-y-6">
      {!encryptionKeyConfigured && encryptionKeyWarning ? (
        <FormAlert variant="warning">{encryptionKeyWarning}</FormAlert>
      ) : null}

      {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}
      {formSuccess ? <FormAlert variant="success">{formSuccess}</FormAlert> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Store provider credentials encrypted at rest. Values are never shown again after save.
        </p>
        <Button type="button" variant="primary" size="sm" onClick={() => setShowCreateForm((value) => !value)}>
          {showCreateForm ? "Cancel" : "Add secret"}
        </Button>
      </div>

      {showCreateForm ? (
        <form
          className="space-y-4 rounded-2xl border border-border bg-surface/80 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            handleCreate(new FormData(event.currentTarget));
          }}
        >
          <h3 className="text-base font-semibold text-foreground">Add integration secret</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              id="providerId"
              name="providerId"
              label="Provider"
              required
              options={providerOptions}
            />
            <Select
              id="secretType"
              name="secretType"
              label="Secret type"
              required
              defaultValue="api_key"
              options={secretTypeOptions}
            />
            <Input name="name" label="Name" required placeholder="Production Slack webhook" />
            <Input
              name="plaintextValue"
              label="Secret value"
              required
              type="password"
              autoComplete="new-password"
              placeholder="Paste credential once"
            />
          </div>
          <Textarea
            id="description"
            name="description"
            label="Description"
            rows={2}
            placeholder="Optional notes for admins"
          />
          <Button type="submit" loading={isPending} disabled={!encryptionKeyConfigured}>
            Save secret
          </Button>
        </form>
      ) : null}

      {rotateTarget ? (
        <form
          className="space-y-4 rounded-2xl border border-border bg-surface/80 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            handleRotate(new FormData(event.currentTarget));
          }}
        >
          <h3 className="text-base font-semibold text-foreground">Rotate {rotateTarget.name}</h3>
          <Input
            name="plaintextValue"
            label="New secret value"
            required
            type="password"
            autoComplete="new-password"
          />
          <div className="flex gap-2">
            <Button type="submit" loading={isPending} disabled={!encryptionKeyConfigured}>
              Rotate secret
            </Button>
            <Button type="button" variant="secondary" onClick={() => setRotateTarget(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-surface/80">
            <tr>
              {["Name", "Provider", "Type", "Status", "Masked", "Created", "Last used", "Rotation due", ""].map(
                (heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted">
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {secrets.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted">
                  No integration secrets stored yet.
                </td>
              </tr>
            ) : (
              secrets.map((secret) => (
                <tr key={secret.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{secret.name}</td>
                  <td className="px-4 py-3 text-muted">{secret.providerId}</td>
                  <td className="px-4 py-3 text-muted">
                    {INTEGRATION_SECRET_TYPE_LABELS[secret.secretType]}
                  </td>
                  <td className="px-4 py-3">{INTEGRATION_SECRET_STATUS_LABELS[secret.status]}</td>
                  <td className="px-4 py-3 font-mono text-xs">{secret.maskedPreview}</td>
                  <td className="px-4 py-3 text-muted">{formatBillingDateTime(secret.createdAt)}</td>
                  <td className="px-4 py-3 text-muted">
                    {secret.lastUsedAt ? formatBillingDateTime(secret.lastUsedAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {secret.rotationDueAt ? formatBillingDateTime(secret.rotationDueAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setRotateTarget(secret)}
                      >
                        Rotate
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDelete(secret)}
                        loading={isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
