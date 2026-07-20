import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PUBLIC_API_SCOPES, PUBLIC_API_SCOPE_LABELS } from "@/lib/public-api/scopes";
import type { ApiKeyType, ApiScope } from "@/lib/api/types";

type CreateApiKeyDialogProps = {
  onSubmit: (formData: FormData) => void;
  loading?: boolean;
};

export function CreateApiKeyDialog({ onSubmit, loading = false }: CreateApiKeyDialogProps) {
  const scopeOptions = PUBLIC_API_SCOPES.map((scope) => ({
    value: scope,
    label: PUBLIC_API_SCOPE_LABELS[scope] ?? scope,
  }));

  return (
    <form action={onSubmit} className="grid gap-4 md:grid-cols-2">
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
      <Select
        name="keyMode"
        label="Environment"
        defaultValue="live"
        options={[
          { value: "live", label: "Live (ax_live_…)" },
          { value: "test", label: "Test (ax_test_…)" },
        ]}
      />
      <div className="md:col-span-2">
        <p className="mb-2 text-sm font-medium text-foreground">Scopes</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {scopeOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                name="scopes"
                value={option.value as ApiScope}
                defaultChecked={option.value === "clients.read"}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
      <Button type="submit" loading={loading}>
        Create API key
      </Button>
    </form>
  );
}

export type { ApiKeyType };
