import type { ApiScope } from "@/lib/api/types";
import { ALL_API_SCOPES, API_SCOPE_LABELS } from "@/lib/api/types";

/** Scopes exposed on the Public API V1 surface. */
export const PUBLIC_API_SCOPES: ApiScope[] = [
  "clients.read",
  "health.read",
  "risks.read",
  "incidents.read",
  "reports.read",
  "activity.read",
  "webhooks.write",
];

export const PUBLIC_API_SCOPE_LABELS: Partial<Record<ApiScope, string>> = {
  "clients.read": API_SCOPE_LABELS["clients.read"],
  "health.read": "Read health snapshots",
  "risks.read": API_SCOPE_LABELS["risks.read"],
  "incidents.read": API_SCOPE_LABELS["incidents.read"],
  "reports.read": API_SCOPE_LABELS["reports.read"],
  "activity.read": "Read activity events",
  "webhooks.write": "Manage webhook endpoints",
};

export function hasPublicApiScope(scopes: ApiScope[], required: ApiScope): boolean {
  return scopes.includes(required);
}

export function parsePublicApiScopes(input: unknown): ApiScope[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter(
    (scope): scope is ApiScope =>
      typeof scope === "string" && ALL_API_SCOPES.includes(scope as ApiScope),
  );
}
