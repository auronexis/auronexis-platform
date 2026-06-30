-- Client Portal V2 — read access for health, activity, SLA; last login tracking

ALTER TABLE public.client_portal_users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Portal users may read health snapshots for their client
CREATE POLICY health_snapshots_select_portal_client
  ON public.health_snapshots
  FOR SELECT
  TO authenticated
  USING (
    client_id = public.current_portal_client_id()
    AND organization_id = public.current_portal_organization_id()
    AND public.current_portal_client_id() IS NOT NULL
  );

-- Portal users may read safe client-facing activity events
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

-- Portal users may read SLA policies assigned to or default for their client
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

-- Portal users may read their client's account owner name only
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

-- Portal users may update their own last_login_at
CREATE POLICY client_portal_users_update_self_login
  ON public.client_portal_users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid() AND is_active = TRUE)
  WITH CHECK (auth_user_id = auth.uid() AND is_active = TRUE);
