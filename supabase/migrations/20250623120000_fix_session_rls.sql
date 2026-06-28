-- Fix session bootstrap: users must read their own row before current_organization_id() works.

DROP POLICY IF EXISTS users_select_same_org ON public.users;
DROP POLICY IF EXISTS organizations_select_own ON public.organizations;

-- Allow each user to read their own profile (required for session bootstrap).
CREATE POLICY users_select_own
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Allow org members to read teammate profiles within the same organization.
CREATE POLICY users_select_same_org
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND auth_user_id <> auth.uid()
  );

-- Organization visible to members (uses own-row policy in the EXISTS subquery).
CREATE POLICY organizations_select_member
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.organization_id = organizations.id
        AND users.auth_user_id = auth.uid()
        AND users.is_disabled = FALSE
    )
  );

-- Table privileges required for RLS policies to take effect.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.organizations TO authenticated;
GRANT SELECT, UPDATE ON public.users TO authenticated;

GRANT ALL ON TABLE public.organizations TO service_role;
GRANT ALL ON TABLE public.users TO service_role;
