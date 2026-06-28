import type { ApiContext } from "@/lib/api/auth/context";
import { toSessionContext, toWorkspaceSessionContext } from "@/lib/api/auth/context";
import type { SessionContext } from "@/lib/tenancy/context";

export function apiContextToSession(ctx: ApiContext): SessionContext {
  if (ctx.keyType === "workspace") {
    return toWorkspaceSessionContext(ctx);
  }

  if (!ctx.userId) {
    return toWorkspaceSessionContext(ctx);
  }

  return toSessionContext(ctx);
}
