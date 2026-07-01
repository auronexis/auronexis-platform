-- Incident Management Engine V1 — incident_activity audit trail

CREATE TABLE IF NOT EXISTS public.incident_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES public.incidents (id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'incident.created',
      'incident.assigned',
      'incident.status_changed',
      'incident.resolved',
      'incident.closed'
    )
  ),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_activity_org_incident
  ON public.incident_activity (organization_id, incident_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_incident_activity_incident
  ON public.incident_activity (incident_id, created_at DESC);

ALTER TABLE public.incident_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS incident_activity_select_org ON public.incident_activity;
CREATE POLICY incident_activity_select_org
  ON public.incident_activity
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS incident_activity_insert_org ON public.incident_activity;
CREATE POLICY incident_activity_insert_org
  ON public.incident_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.current_organization_id());

GRANT SELECT, INSERT ON public.incident_activity TO authenticated;
GRANT ALL ON TABLE public.incident_activity TO service_role;
