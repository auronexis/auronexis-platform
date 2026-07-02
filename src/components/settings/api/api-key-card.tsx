import { Button } from "@/components/ui/button";
import type { ApiKeyView } from "@/lib/api/types";
import { formatBillingDateTime } from "@/lib/billing/types";

type ApiKeyCardProps = {
  apiKey: ApiKeyView;
  onRevoke?: (keyId: string, name: string) => void;
  disabled?: boolean;
};

export function ApiKeyCard({ apiKey, onRevoke, disabled = false }: ApiKeyCardProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 px-4 py-3">
      <div>
        <p className="font-medium text-foreground">{apiKey.name}</p>
        <p className="text-xs text-muted">
          {apiKey.keyPrefix}… · {apiKey.keyType} · {apiKey.status} · last used{" "}
          {apiKey.lastUsedAt ? formatBillingDateTime(apiKey.lastUsedAt) : "never"}
        </p>
        {apiKey.scopes.length > 0 ? (
          <p className="mt-1 text-xs text-muted">{apiKey.scopes.join(", ")}</p>
        ) : null}
      </div>
      {apiKey.status === "active" && onRevoke ? (
        <Button
          size="sm"
          variant="ghost"
          disabled={disabled}
          onClick={() => onRevoke(apiKey.id, apiKey.name)}
        >
          Revoke
        </Button>
      ) : null}
    </div>
  );
}
