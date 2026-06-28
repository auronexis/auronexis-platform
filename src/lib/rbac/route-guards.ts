import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { canAccessModule, type AppModule } from "@/lib/rbac/permissions";

/** Redirect when the current user lacks read access to a module. */
export async function requireModuleAccess(module: AppModule): Promise<void> {
  const session = await requireSession();

  if (!canAccessModule(session.role, module, "read")) {
    redirect("/dashboard");
  }
}
