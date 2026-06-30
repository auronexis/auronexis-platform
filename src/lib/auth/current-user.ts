import { getSession, requireSession } from "@/lib/auth/session";
import { resolveAuthorizationRole } from "@/lib/authorization/permissions";
import type { UserRole } from "@/types/database";

export type CurrentUser = {
  id: string;
  organizationId: string;
  role: UserRole;
  authorizationRole: ReturnType<typeof resolveAuthorizationRole>;
  email: string;
  name: string;
};

function toCurrentUser(
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
): CurrentUser {
  return {
    id: session.user.id,
    organizationId: session.organization.id,
    role: session.role,
    authorizationRole: resolveAuthorizationRole(session.role),
    email: session.email,
    name: session.user.full_name,
  };
}

/** Load the current app user profile for authorization checks. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  return session ? toCurrentUser(session) : null;
}

/** Require an authenticated app user or redirect to login. */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const session = await requireSession();
  return toCurrentUser(session);
}
