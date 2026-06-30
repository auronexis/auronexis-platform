import { createClient } from "@/lib/supabase/server";
import { canViewRevenue } from "@/lib/rbac/permissions";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ClientStatus, AppUser } from "@/types/database";
import type { ClientOwner, ClientView, ClientWithRelations } from "@/lib/clients/types";
import {
  CLIENT_SELECT_COLUMNS,
  CLIENT_SELECT_COLUMNS_V1,
  CLIENT_SELECT_COLUMNS_V1_WITH_REVENUE,
  CLIENT_SELECT_COLUMNS_WITH_REVENUE,
} from "@/lib/clients/types";

type ListClientsOptions = {
  includeArchived?: boolean;
  status?: ClientStatus;
  search?: string;
};

export type ListClientsResult = {
  clients: ClientWithRelations[];
  error: string | null;
};

function isMissingClientColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("does not exist") || (lower.includes("could not find") && lower.includes("column"));
}

function normalizeClientRow(row: Record<string, unknown>): ClientView {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    name: String(row.name),
    status: row.status as ClientStatus,
    owner_id: (row.owner_id as string | null | undefined) ?? null,
    health_score: (row.health_score as number | null | undefined) ?? null,
    sla_policy_id: (row.sla_policy_id as string | null | undefined) ?? null,
    contact_name: (row.contact_name as string | null | undefined) ?? null,
    contact_email: (row.contact_email as string | null | undefined) ?? null,
    notes: (row.notes as string | null | undefined) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    ...(row.monthly_revenue !== undefined
      ? { monthly_revenue: (row.monthly_revenue as number | null) ?? null }
      : {}),
  };
}

async function attachOwnerNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  clients: ClientView[],
): Promise<ClientWithRelations[]> {
  const ownerIds = [...new Set(clients.map((client) => client.owner_id).filter(Boolean))] as string[];
  const ownerMap = new Map<string, ClientOwner>();

  if (ownerIds.length > 0) {
    const { data: owners, error } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("organization_id", organizationId)
      .in("id", ownerIds);

    if (error) {
      console.error("[clients] Failed to load owner names:", error.message);
    } else {
      for (const owner of (owners ?? []) as ClientOwner[]) {
        ownerMap.set(owner.id, owner);
      }
    }
  }

  return clients.map((client) => ({
    ...client,
    owner: client.owner_id ? (ownerMap.get(client.owner_id) ?? null) : null,
  }));
}

function buildClientListQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  columns: string,
  options: ListClientsOptions,
) {
  let query = supabase
    .from("clients")
    .select(columns)
    .eq("organization_id", organizationId)
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

  return query;
}

async function selectClientListRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  session: SessionContext,
  options: ListClientsOptions,
): Promise<{ rows: ClientView[]; error: string | null }> {
  const withRevenue = canViewRevenue(session.role);
  let columns = withRevenue ? CLIENT_SELECT_COLUMNS_WITH_REVENUE : CLIENT_SELECT_COLUMNS;

  let { data, error } = await buildClientListQuery(
    supabase,
    session.organization.id,
    columns,
    options,
  );

  if (error && isMissingClientColumnError(error.message)) {
    columns = withRevenue ? CLIENT_SELECT_COLUMNS_V1_WITH_REVENUE : CLIENT_SELECT_COLUMNS_V1;
    ({ data, error } = await buildClientListQuery(
      supabase,
      session.organization.id,
      columns,
      options,
    ));
  }

  if (error) {
    return { rows: [], error: error.message };
  }

  return {
    rows: (data ?? []).map((row) => normalizeClientRow(row as Record<string, unknown>)),
    error: null,
  };
}

async function selectClientById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  session: SessionContext,
  clientId: string,
): Promise<{ row: ClientView | null; error: string | null }> {
  const withRevenue = canViewRevenue(session.role);
  let columns = withRevenue ? CLIENT_SELECT_COLUMNS_WITH_REVENUE : CLIENT_SELECT_COLUMNS;

  let { data, error } = await supabase
    .from("clients")
    .select(columns)
    .eq("id", clientId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  if (error && isMissingClientColumnError(error.message)) {
    columns = withRevenue ? CLIENT_SELECT_COLUMNS_V1_WITH_REVENUE : CLIENT_SELECT_COLUMNS_V1;
    ({ data, error } = await supabase
      .from("clients")
      .select(columns)
      .eq("id", clientId)
      .eq("organization_id", session.organization.id)
      .maybeSingle());
  }

  if (error) {
    return { row: null, error: error.message };
  }

  if (!data) {
    return { row: null, error: null };
  }

  return {
    row: normalizeClientRow(data as Record<string, unknown>),
    error: null,
  };
}

/** List clients without throwing — for pages that render inline error states. */
export async function listClientsSafe(
  session: SessionContext,
  options: ListClientsOptions = {},
): Promise<ListClientsResult> {
  const supabase = await createClient();
  const { rows, error } = await selectClientListRows(supabase, session, options);

  if (error) {
    return { clients: [], error };
  }

  const clients = await attachOwnerNames(supabase, session.organization.id, rows);
  return { clients, error: null };
}

/** List clients for the current organization. Owner names resolved in a separate query. */
export async function listClients(
  session: SessionContext,
  options: ListClientsOptions = {},
): Promise<ClientWithRelations[]> {
  const { clients, error } = await listClientsSafe(session, options);

  if (error) {
    throw new Error(error);
  }

  return clients;
}

/** Load a single client by id within the current organization. */
export async function getClientById(
  session: SessionContext,
  clientId: string,
): Promise<ClientView | null> {
  const supabase = await createClient();
  const { row, error } = await selectClientById(supabase, session, clientId);

  if (error) {
    throw new Error(error);
  }

  return row;
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
