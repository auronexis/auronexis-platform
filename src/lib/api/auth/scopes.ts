import type { ApiScope } from "@/lib/api/types";
import { ALL_API_SCOPES } from "@/lib/api/types";

export function parseApiScopes(input: unknown): ApiScope[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter((scope): scope is ApiScope =>
    typeof scope === "string" && ALL_API_SCOPES.includes(scope as ApiScope),
  );
}

export function validateApiScopes(scopes: ApiScope[]): ApiScope[] {
  const unique = Array.from(new Set(scopes));
  if (unique.length === 0) {
    throw new Error("At least one API scope is required.");
  }
  return unique;
}

export function scopesAllowRead(resource: "clients" | "reports" | "risks" | "incidents" | "automation" | "integrations"): ApiScope {
  return `${resource}.read` as ApiScope;
}

export function scopesAllowWrite(resource: "clients" | "reports" | "risks" | "incidents" | "automation" | "integrations"): ApiScope {
  return `${resource}.write` as ApiScope;
}
