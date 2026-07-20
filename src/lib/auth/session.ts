import { cache } from "react";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import type { SessionContext } from "@/lib/tenancy/context";
import type { AppUser, Organization } from "@/types/database";
import type { Database } from "@/types/database";

async function loadSessionContext(
  getAllCookies: () => { name: string; value: string }[],
  setAllCookies?: (cookies: { name: string; value: string; options: CookieOptions }[]) => void,
): Promise<SessionContext | null> {
  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll: getAllCookies,
      setAll: setAllCookies ?? (() => undefined),
    },
  });

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
    .select(
      "id, name, slug, plan, language, currency, timezone, date_format, time_format, week_start, measurement_system, created_at, updated_at",
    )
    .eq("id", appUser.organization_id)
    .maybeSingle();

  let organization = organizationData as Organization | null;

  if (orgError || !organization) {
    const missingRegionalColumn =
      orgError?.code === "42703" ||
      orgError?.code === "PGRST204" ||
      Boolean(orgError?.message?.includes("currency")) ||
      Boolean(orgError?.message?.includes("timezone")) ||
      Boolean(orgError?.message?.includes("date_format"));

    if (!missingRegionalColumn) {
      return null;
    }

    const fallback = await supabase
      .from("organizations")
      .select("id, name, slug, plan, language, created_at, updated_at")
      .eq("id", appUser.organization_id)
      .maybeSingle();

    if (fallback.error || !fallback.data) {
      return null;
    }

    organization = {
      ...(fallback.data as Omit<
        Organization,
        "currency" | "timezone" | "date_format" | "time_format" | "week_start" | "measurement_system"
      >),
      currency: "USD",
      timezone: "UTC",
      date_format: "DD/MM/YYYY",
      time_format: "24h",
      week_start: "monday",
      measurement_system: "metric",
    };
  }

  if (!organization.currency) {
    organization = { ...organization, currency: "USD" };
  }
  if (!organization.timezone) {
    organization = { ...organization, timezone: "UTC" };
  }
  if (!organization.date_format) {
    organization = { ...organization, date_format: "DD/MM/YYYY" };
  }
  if (!organization.time_format) {
    organization = { ...organization, time_format: "24h" };
  }
  if (!organization.week_start) {
    organization = { ...organization, week_start: "monday" };
  }
  if (!organization.measurement_system) {
    organization = { ...organization, measurement_system: "metric" };
  }

  return {
    authUserId: authUser.id,
    email: authUser.email ?? appUser.email,
    user: appUser,
    organization,
    role: appUser.role,
  };
}

/** Load session from Supabase cookies — safe for route handlers and server components. */
export async function readSessionContext(): Promise<SessionContext | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return loadSessionContext(
    () => cookieStore.getAll(),
    (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => {
        cookieStore.set(name, value, options);
      });
    },
  );
}

/** Load session directly from an incoming request — used by `/api/docs` HTML route. */
export async function readSessionContextFromRequest(
  request: NextRequest,
): Promise<SessionContext | null> {
  return loadSessionContext(() => request.cookies.getAll());
}

/**
 * Load the authenticated user, application profile, and organization.
 * Cached per request — safe to call from layouts and Server Components.
 */
export const getSession = cache(readSessionContext);

/** Require an authenticated session or redirect to login. */
export async function requireSession(): Promise<SessionContext> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
