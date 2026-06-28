import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { AppUser, Organization } from "@/types/database";
/**
 * Load the authenticated user, application profile, and organization.
 * Cached per request — safe to call from layouts and Server Components.
 */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  const { data: appUserData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  const appUser = appUserData as AppUser | null;

  if (userError || !appUser || appUser.is_disabled) {
    return null;
  }

  const { data: organizationData, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", appUser.organization_id)
    .maybeSingle();

  const organization = organizationData as Organization | null;
  if (orgError || !organization) {
    return null;
  }

  return {
    authUserId: authUser.id,
    email: authUser.email ?? appUser.email,
    user: appUser,
    organization,
    role: appUser.role,
  };
});

/** Require an authenticated session or redirect to login. */
export async function requireSession(): Promise<SessionContext> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
