import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { sessionHasPermission } from "@/lib/authorization/guards";
import type { Permission } from "@/lib/authorization/permissions";
import { canAccessModule, type AppModule } from "@/lib/rbac/permissions";

const MODULE_READ_PERMISSION: Partial<Record<AppModule, Permission>> = {
  risks: "risks.read",
};

/** Redirect when the current user lacks read access to a module. */
export async function requireModuleAccess(module: AppModule): Promise<void> {
  const session = await requireSession();
  const mappedPermission = MODULE_READ_PERMISSION[module];

  if (mappedPermission) {
    if (!sessionHasPermission(session, mappedPermission)) {
      redirect("/dashboard");
    }
    return;
  }

  if (!canAccessModule(session.role, module, "read")) {
    redirect("/dashboard");
  }
}
