import { MONITORING_PROVIDERS } from "@/lib/monitoring/types";

type ConnectorFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: {
    name?: string;
    provider?: string;
    clientId?: string;
    endpoint?: string;
    createRiskOnFailure?: boolean;
    createIncidentOnCritical?: boolean;
    healthImpactEnabled?: boolean;
  };
  clients?: Array<{ id: string; name: string }>;
  submitLabel?: string;
};

export function ConnectorForm({
  action,
  defaultValues,
  clients = [],
  submitLabel = "Save connector",
}: ConnectorFormProps) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          required
          className="mt-1 w-full rounded-xl border border-border bg-surface-1 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="provider" className="text-sm font-medium text-foreground">
          Provider
        </label>
        <select
          id="provider"
          name="provider"
          defaultValue={defaultValues?.provider ?? "Manual"}
          className="mt-1 w-full rounded-xl border border-border bg-surface-1 px-3 py-2 text-sm"
        >
          {MONITORING_PROVIDERS.map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>
      </div>

      {clients.length > 0 ? (
        <div>
          <label htmlFor="clientId" className="text-sm font-medium text-foreground">
            Linked client
          </label>
          <select
            id="clientId"
            name="clientId"
            defaultValue={defaultValues?.clientId ?? ""}
            className="mt-1 w-full rounded-xl border border-border bg-surface-1 px-3 py-2 text-sm"
          >
            <option value="">Organization-wide</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        <label htmlFor="endpoint" className="text-sm font-medium text-foreground">
          Endpoint / URL
        </label>
        <input
          id="endpoint"
          name="endpoint"
          defaultValue={defaultValues?.endpoint ?? ""}
          placeholder="https://..."
          className="mt-1 w-full rounded-xl border border-border bg-surface-1 px-3 py-2 text-sm"
        />
      </div>

      <fieldset className="space-y-2 rounded-xl border border-border-subtle p-4">
        <legend className="px-1 text-sm font-medium text-foreground">Integrations</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="createRiskOnFailure"
            defaultChecked={defaultValues?.createRiskOnFailure ?? true}
          />
          Create risk on connector failure
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="createIncidentOnCritical"
            defaultChecked={defaultValues?.createIncidentOnCritical ?? false}
          />
          Create incident on critical failure
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="healthImpactEnabled"
            defaultChecked={defaultValues?.healthImpactEnabled ?? true}
          />
          Affect client health score
        </label>
      </fieldset>

      <button
        type="submit"
        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        {submitLabel}
      </button>
    </form>
  );
}
