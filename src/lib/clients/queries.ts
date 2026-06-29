import { createClient } from "@/lib/supabase/server";
import { canViewRevenue } from "@/lib/rbac/permissions";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ClientStatus, AppUser } from "@/types/database";
import type { ClientView, ClientWithRelations } from "@/lib/clients/types";
import {
  CLIENT_LIST_SELECT,
  CLIENT_LIST_SELECT_WITH_REVENUE,
  CLIENT_SELECT_COLUMNS,
  CLIENT_SELECT_COLUMNS_WITH_REVENUE,
} from "@/lib/clients/types";

type ListClientsOptions = {
  includeArchived?: boolean;
  status?: ClientStatus;
  search?: string;
};

/** List clients for the current organization with owner names. */
export async function listClients(
  session: SessionContext,
  options: ListClientsOptions = {},
): Promise<ClientWithRelations[]> {
  const supabase = await createClient();
  const columns = canViewRevenue(session.role)
    ? CLIENT_LIST_SELECT_WITH_REVENUE
    : CLIENT_LIST_SELECT;

  let query = supabase
    .from("clients")
    .select(columns)
    .eq("organization_id", session.organization.id)
    .order("name", { ascending: true });

  if (options.status) {
    query = query.eq("status", options.status);
  } else if (!options.includeArchived) {
    query = query.neq("status", "archived");
  }

  const search = options.search?.trim();
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ClientWithRelations[];
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

/** Active organization members for owner assignment. */
export async function listOrgUsers(session: SessionContext): Promise<AppUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, role, organization_id, auth_user_id, is_disabled, created_at, updated_at")
    .eq("organization_id", session.organization.id)
    .eq("is_disabled", false)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AppUser[];
}
