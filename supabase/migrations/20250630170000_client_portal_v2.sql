-- Client Portal V2 — read access for health, activity, SLA; last login tracking (idempotent)

ALTER TABLE public.client_portal_users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

DROP POLICY IF EXISTS health_snapshots_select_portal_client ON public.health_snapshots;

CREATE POLICY health_snapshots_select_portal_client
  ON public.health_snapshots
  FOR SELECT
  TO authenticated
  USING (
    client_id = public.current_portal_client_id()
    AND organization_id = public.current_portal_organization_id()
    AND public.current_portal_client_id() IS NOT NULL
  );

DROP POLICY IF EXISTS activity_events_select_portal_client ON public.activity_events;

CREATE POLICY activity_events_select_portal_client
  ON public.activity_events
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_portal_organization_id()
    AND public.current_portal_client_id() IS NOT NULL
    AND event_type IN (
      'client.updated',
      'health.changed',
      'report.created',
      'report.updated',
      'sla.updated',
      'portal.login',
      'portal.viewed'
    )
    AND (
      (entity_type = 'client' AND entity_id = public.current_portal_client_id())
      OR (
        entity_type = 'report'
        AND entity_id IN (
          SELECT id
          FROM public.reports
          WHERE client_id = public.current_portal_client_id()
        )
      )
    )
  );

DROP POLICY IF EXISTS sla_policies_select_portal_client ON public.sla_policies;

CREATE POLICY sla_policies_select_portal_client
  ON public.sla_policies
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_portal_organization_id()
    AND public.current_portal_client_id() IS NOT NULL
    AND (
      id IN (
        SELECT sla_policy_id
        FROM public.clients
        WHERE id = public.current_portal_client_id()
          AND sla_policy_id IS NOT NULL
      )
      OR is_default = TRUE
    )
  );

DROP POLICY IF EXISTS users_select_portal_client_owner ON public.users;

CREATE POLICY users_select_portal_client_owner
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_portal_organization_id()
    AND public.current_portal_client_id() IS NOT NULL
    AND id IN (
      SELECT owner_id
      FROM public.clients
      WHERE id = public.current_portal_client_id()
        AND owner_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS client_portal_users_update_self_login ON public.client_portal_users;

CREATE POLICY client_portal_users_update_self_login
  ON public.client_portal_users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid() AND is_active = TRUE)
  WITH CHECK (auth_user_id = auth.uid() AND is_active = TRUE);
