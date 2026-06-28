import type { PlanKey } from "@/lib/billing/plans";
import type { ApiScope } from "@/lib/api/types";
import { canAccessModule, type AppModule } from "@/lib/rbac/permissions";
import type { SessionContext } from "@/lib/tenancy/context";
import type { Organization, UserRole } from "@/types/database";

export type ApiContext = {
  apiKeyId: string;
  keyType: "personal" | "workspace";
  scopes: ApiScope[];
  organization: Organization;
  planKey: PlanKey;
  userId: string | null;
  userRole: UserRole;
  authUserId: string | null;
  email: string | null;
};

export function toSessionContext(ctx: ApiContext): SessionContext {
  if (!ctx.userId) {
    throw new Error("Personal user context required for session conversion.");
  }

  return {
    authUserId: ctx.authUserId ?? "",
    email: ctx.email ?? "api@auroranexis.local",
    user: {
      id: ctx.userId,
      auth_user_id: ctx.authUserId ?? "",
      organization_id: ctx.organization.id,
      email: ctx.email ?? "api@auroranexis.local",
      full_name: "API Key",
      role: ctx.userRole,
      is_disabled: false,
      created_at: ctx.organization.created_at,
      updated_at: ctx.organization.updated_at,
    },
    organization: ctx.organization,
    role: ctx.userRole,
  };
}

export function toWorkspaceSessionContext(ctx: ApiContext): SessionContext {
  const role: UserRole = ctx.userRole;
  const userId = ctx.userId ?? ctx.organization.id;

  return {
    authUserId: ctx.authUserId ?? "",
    email: ctx.email ?? "workspace-api@auroranexis.local",
    user: {
      id: userId,
      auth_user_id: ctx.authUserId ?? "",
      organization_id: ctx.organization.id,
      email: ctx.email ?? "workspace-api@auroranexis.local",
      full_name: "Workspace API Key",
      role,
      is_disabled: false,
      created_at: ctx.organization.created_at,
      updated_at: ctx.organization.updated_at,
    },
    organization: ctx.organization,
    role,
  };
}

const SCOPE_MODULE_MAP: Partial<Record<ApiScope, { module: AppModule; action: "read" | "create" | "update" | "delete" }>> = {
  "clients.read": { module: "clients", action: "read" },
  "clients.write": { module: "clients", action: "update" },
  "reports.read": { module: "reports", action: "read" },
  "reports.write": { module: "reports", action: "update" },
  "risks.read": { module: "risks", action: "read" },
  "risks.write": { module: "risks", action: "update" },
  "incidents.read": { module: "incidents", action: "read" },
  "incidents.write": { module: "incidents", action: "update" },
  "automation.read": { module: "workflows", action: "read" },
  "automation.write": { module: "workflows", action: "update" },
  "settings.read": { module: "settings", action: "read" },
  "billing.read": { module: "pricing", action: "read" },
  "integrations.read": { module: "workflows", action: "read" },
  "integrations.write": { module: "workflows", action: "update" },
};

export function hasApiScope(ctx: ApiContext, scope: ApiScope): boolean {
  return ctx.scopes.includes(scope);
}

export function requireApiScope(ctx: ApiContext, scope: ApiScope): void {
  if (!hasApiScope(ctx, scope)) {
    throw new ApiScopeError(scope);
  }
}

export class ApiScopeError extends Error {
  constructor(public readonly scope: ApiScope) {
    super(`Missing required API scope: ${scope}`);
    this.name = "ApiScopeError";
  }
}

export function assertScopeMatchesRbac(ctx: ApiContext, scope: ApiScope): void {
  requireApiScope(ctx, scope);
  const mapping = SCOPE_MODULE_MAP[scope];
  if (!mapping) {
    return;
  }

  if (!canAccessModule(ctx.userRole, mapping.module, mapping.action === "read" ? "read" : "update")) {
    throw new ApiScopeError(scope);
  }
}
