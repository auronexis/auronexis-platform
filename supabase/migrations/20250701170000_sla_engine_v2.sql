-- SLA Engine V2 — incident-scoped SLA events, activity audit trail, severity targets

ALTER TABLE public.sla_policies
  ADD COLUMN IF NOT EXISTS critical_response_minutes INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS critical_resolution_minutes INTEGER NOT NULL DEFAULT 240,
  ADD COLUMN IF NOT EXISTS high_response_minutes INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS high_resolution_minutes INTEGER NOT NULL DEFAULT 480,
  ADD COLUMN IF NOT EXISTS medium_response_minutes INTEGER NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS medium_resolution_minutes INTEGER NOT NULL DEFAULT 1440,
  ADD COLUMN IF NOT EXISTS low_response_minutes INTEGER NOT NULL DEFAULT 240,
  ADD COLUMN IF NOT EXISTS low_resolution_minutes INTEGER NOT NULL DEFAULT 4320;

CREATE TABLE IF NOT EXISTS public.sla_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  incident_id UUID REFERENCES public.incidents (id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients (id) ON DELETE SET NULL,
  policy_id UUID REFERENCES public.sla_policies (id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  breached BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  response_due_at TIMESTAMPTZ,
  resolution_due_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sla_events_one_per_incident
  ON public.sla_events (organization_id, incident_id)
  WHERE incident_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sla_events_org_status
  ON public.sla_events (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_sla_events_org_incident
  ON public.sla_events (organization_id, incident_id);

CREATE INDEX IF NOT EXISTS idx_sla_events_org_client
  ON public.sla_events (organization_id, client_id);

DROP TRIGGER IF EXISTS sla_events_set_updated_at ON public.sla_events;

CREATE TRIGGER sla_events_set_updated_at
  BEFORE UPDATE ON public.sla_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.sla_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sla_events_select_own_org ON public.sla_events;
CREATE POLICY sla_events_select_own_org
  ON public.sla_events
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS sla_events_insert_own_org ON public.sla_events;
CREATE POLICY sla_events_insert_own_org
  ON public.sla_events
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS sla_events_update_own_org ON public.sla_events;
CREATE POLICY sla_events_update_own_org
  ON public.sla_events
  FOR UPDATE
  TO authenticated
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

GRANT SELECT, INSERT, UPDATE ON public.sla_events TO authenticated;
GRANT ALL ON TABLE public.sla_events TO service_role;

CREATE TABLE IF NOT EXISTS public.sla_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  incident_id UUID REFERENCES public.incidents (id) ON DELETE SET NULL,
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sla_activity_org_created
  ON public.sla_activity (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sla_activity_org_incident
  ON public.sla_activity (organization_id, incident_id);

ALTER TABLE public.sla_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sla_activity_select_own_org ON public.sla_activity;
CREATE POLICY sla_activity_select_own_org
  ON public.sla_activity
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS sla_activity_insert_own_org ON public.sla_activity;
CREATE POLICY sla_activity_insert_own_org
  ON public.sla_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.current_organization_id());

GRANT SELECT, INSERT ON public.sla_activity TO authenticated;
GRANT ALL ON TABLE public.sla_activity TO service_role;
