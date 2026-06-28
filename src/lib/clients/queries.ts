import { createClient } from "@/lib/supabase/server";
import { canViewRevenue } from "@/lib/rbac/permissions";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ClientView } from "@/lib/clients/types";
import {
  CLIENT_SELECT_COLUMNS,
  CLIENT_SELECT_COLUMNS_WITH_REVENUE,
} from "@/lib/clients/types";

type ListClientsOptions = {
  includeArchived?: boolean;
};

/** List clients for the current organization. Revenue omitted for Staff/Viewer. */
export async function listClients(
  session: SessionContext,
  options: ListClientsOptions = {},
): Promise<ClientView[]> {
  const supabase = await createClient();
  const columns = canViewRevenue(session.role)
    ? CLIENT_SELECT_COLUMNS_WITH_REVENUE
    : CLIENT_SELECT_COLUMNS;

  let query = supabase
    .from("clients")
    .select(columns)
    .eq("organization_id", session.organization.id)
    .order("name", { ascending: true });

  if (!options.includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ClientView[];
}

/** Load a single client by id within the current organization. */
export async function getClientById(
  session: SessionContext,
  clientId: string,
): Promise<ClientView | null> {
  const supabase = await createClient();
  const columns = canViewRevenue(session.role)
    ? CLIENT_SELECT_COLUMNS_WITH_REVENUE
    : CLIENT_SELECT_COLUMNS;

  const { data, error } = await supabase
    .from("clients")
    .select(columns)
    .eq("id", clientId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ClientView | null) ?? null;
}
