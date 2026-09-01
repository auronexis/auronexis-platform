import type { SessionContext } from "@/lib/tenancy/context";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export function canAccessEInvoiceArchive(session: SessionContext): boolean {
  return canManageOrganizationSettings(session);
}
