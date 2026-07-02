-- Client Portal V3 — portal visibility columns and tightened RLS

ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS portal_visible BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS client_summary TEXT;

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS portal_summary TEXT;

ALTER TABLE public.activity_events
  ADD COLUMN IF NOT EXISTS portal_visible BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_incidents_portal_visible_client
  ON public.incidents (organization_id, client_id, portal_visible)
  WHERE portal_visible = TRUE;

CREATE INDEX IF NOT EXISTS idx_activity_events_portal_visible
  ON public.activity_events (organization_id, portal_visible, created_at DESC)
  WHERE portal_visible = TRUE;

-- Portal incidents: only explicitly shared incidents
DROP POLICY IF EXISTS incidents_select_portal_client ON public.incidents;
CREATE POLICY incidents_select_portal_client
  ON public.incidents
  FOR SELECT
  TO authenticated
  USING (
    client_id = public.current_portal_client_id()
    AND organization_id = public.current_portal_organization_id()
    AND public.current_portal_client_id() IS NOT NULL
    AND portal_visible = TRUE
  );

-- Portal SLA events for compliance summary
DROP POLICY IF EXISTS sla_events_select_portal_client ON public.sla_events;
CREATE POLICY sla_events_select_portal_client
  ON public.sla_events
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_portal_organization_id()
    AND client_id = public.current_portal_client_id()
    AND public.current_portal_client_id() IS NOT NULL
  );

-- Portal activity: safe event types only
DROP POLICY IF EXISTS activity_events_select_portal_client ON public.activity_events;
CREATE POLICY activity_events_select_portal_client
  ON public.activity_events
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_portal_organization_id()
    AND public.current_portal_client_id() IS NOT NULL
    AND (
      event_type IN (
        'report.published',
        'health.changed',
        'sla.resolved',
        'sla.breached',
        'portal.login',
        'portal.viewed',
        'portal.report_viewed',
        'portal.incident_viewed',
        'portal.support_viewed'
      )
      OR (
        portal_visible = TRUE
        AND event_type IN ('incident.created', 'incident.resolved')
        AND entity_type = 'incident'
        AND entity_id IN (
          SELECT id
          FROM public.incidents
          WHERE client_id = public.current_portal_client_id()
            AND portal_visible = TRUE
        )
      )
    )
    AND (
      (entity_type = 'client' AND entity_id = public.current_portal_client_id())
      OR (
        entity_type = 'report'
        AND entity_id IN (
          SELECT id
          FROM public.reports
          WHERE client_id = public.current_portal_client_id()
            AND status = 'published'
        )
      )
      OR (
        entity_type = 'incident'
        AND entity_id IN (
          SELECT id
          FROM public.incidents
          WHERE client_id = public.current_portal_client_id()
            AND portal_visible = TRUE
        )
      )
      OR entity_type IS NULL
      OR entity_id IS NULL
    )
  );
