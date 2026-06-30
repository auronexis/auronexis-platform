import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { PORTAL_CLIENT_SELECT } from "@/lib/client-portal/types";
import type { ClientPortalSessionContext } from "@/lib/client-portal/types";
import { createClient } from "@/lib/supabase/server";
import type { Client, ClientPortalUser, Organization } from "@/types/database";

/** Load the authenticated client portal user, client, and organization. */
export const getClientPortalSession = cache(async (): Promise<ClientPortalSessionContext | null> => {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  const { data: portalUserData, error: portalUserError } = await supabase
    .from("client_portal_users")
    .select("*")
    .eq("auth_user_id", authUser.id)
    .eq("is_active", true)
    .maybeSingle();

  const portalUser = portalUserData as ClientPortalUser | null;

  if (portalUserError || !portalUser) {
    return null;
  }

  const [{ data: clientData, error: clientError }, { data: organizationData, error: orgError }] =
    await Promise.all([
      supabase
        .from("clients")
        .select(PORTAL_CLIENT_SELECT)
        .eq("id", portalUser.client_id)
        .maybeSingle(),
      supabase
        .from("organizations")
        .select("id, name")
        .eq("id", portalUser.organization_id)
        .maybeSingle(),
    ]);

  const client = clientData as Pick<
    Client,
    | "id"
    | "name"
    | "status"
    | "organization_id"
    | "contact_name"
    | "contact_email"
    | "owner_id"
    | "sla_policy_id"
    | "health_score"
  > | null;
  const organization = organizationData as Pick<Organization, "id" | "name"> | null;

  if (clientError || !client || orgError || !organization) {
    return null;
  }

  return {
    authUserId: authUser.id,
    email: authUser.email ?? portalUser.email,
    portalUser,
    client,
    organization,
  };
});

/** Require an authenticated portal session or redirect to portal login. */
export async function requireClientPortalSession(): Promise<ClientPortalSessionContext> {
  const session = await getClientPortalSession();

  if (session) {
    return session;
  }

  const agencySession = await getSession();
  if (agencySession) {
    redirect("/dashboard");
  }

  redirect("/client-portal/login");
}
