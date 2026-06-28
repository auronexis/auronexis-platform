-- Team Management + Activity Feed v1

-- ---------------------------------------------------------------------------
-- team_invitations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'viewer')),
  token TEXT NOT NULL UNIQUE,
  invited_by_user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_organization_id
  ON public.team_invitations (organization_id);

CREATE INDEX IF NOT EXISTS idx_team_invitations_token
  ON public.team_invitations (token);

CREATE INDEX IF NOT EXISTS idx_team_invitations_email
  ON public.team_invitations (organization_id, email);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_invitations_select_owner_admin
  ON public.team_invitations
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY team_invitations_insert_owner_admin
  ON public.team_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

-- ---------------------------------------------------------------------------
-- activity_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL CHECK (
    entity_type IN ('client', 'risk', 'incident', 'report', 'financial', 'team', 'organization')
  ),
  entity_id UUID,
  action TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_organization_id
  ON public.activity_events (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_events_entity_type
  ON public.activity_events (organization_id, entity_type, created_at DESC);

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_events_select_own_org
  ON public.activity_events
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

-- ---------------------------------------------------------------------------
-- Extended policies for team + organization management
-- ---------------------------------------------------------------------------
CREATE POLICY organizations_update_owner_admin
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY users_update_team_owner
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() = 'owner'
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() = 'owner'
  );

CREATE POLICY users_update_team_admin
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() = 'admin'
    AND role IN ('staff', 'viewer')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() = 'admin'
    AND role IN ('staff', 'viewer')
  );

GRANT SELECT, INSERT ON public.team_invitations TO authenticated;
GRANT SELECT ON public.activity_events TO authenticated;
GRANT UPDATE ON public.organizations TO authenticated;

GRANT ALL ON TABLE public.team_invitations TO service_role;
GRANT ALL ON TABLE public.activity_events TO service_role;
