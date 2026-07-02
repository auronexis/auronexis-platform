-- Monitoring Connectors V1 — operational signal collection

CREATE TABLE IF NOT EXISTS public.monitoring_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_check_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT monitoring_connectors_status_check CHECK (
    status IN ('active', 'paused', 'failed', 'disabled', 'archived')
  )
);

CREATE INDEX IF NOT EXISTS idx_monitoring_connectors_org_status
  ON public.monitoring_connectors (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_monitoring_connectors_org_provider
  ON public.monitoring_connectors (organization_id, provider);

DROP TRIGGER IF EXISTS monitoring_connectors_set_updated_at ON public.monitoring_connectors;

CREATE TRIGGER monitoring_connectors_set_updated_at
  BEFORE UPDATE ON public.monitoring_connectors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.monitoring_connectors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS monitoring_connectors_select_own_org ON public.monitoring_connectors;
CREATE POLICY monitoring_connectors_select_own_org
  ON public.monitoring_connectors
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS monitoring_connectors_insert_own_org ON public.monitoring_connectors;
CREATE POLICY monitoring_connectors_insert_own_org
  ON public.monitoring_connectors
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS monitoring_connectors_update_own_org ON public.monitoring_connectors;
CREATE POLICY monitoring_connectors_update_own_org
  ON public.monitoring_connectors
  FOR UPDATE
  TO authenticated
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

GRANT SELECT, INSERT, UPDATE ON public.monitoring_connectors TO authenticated;
GRANT ALL ON TABLE public.monitoring_connectors TO service_role;

CREATE TABLE IF NOT EXISTS public.monitoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  connector_id UUID REFERENCES public.monitoring_connectors (id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients (id) ON DELETE SET NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  payload JSONB,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_org_created
  ON public.monitoring_events (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_org_connector
  ON public.monitoring_events (organization_id, connector_id);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_org_client
  ON public.monitoring_events (organization_id, client_id);

ALTER TABLE public.monitoring_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS monitoring_events_select_own_org ON public.monitoring_events;
CREATE POLICY monitoring_events_select_own_org
  ON public.monitoring_events
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS monitoring_events_insert_own_org ON public.monitoring_events;
CREATE POLICY monitoring_events_insert_own_org
  ON public.monitoring_events
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.current_organization_id());

GRANT SELECT, INSERT ON public.monitoring_events TO authenticated;
GRANT ALL ON TABLE public.monitoring_events TO service_role;

CREATE TABLE IF NOT EXISTS public.monitoring_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  connector_id UUID REFERENCES public.monitoring_connectors (id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_activity_org_created
  ON public.monitoring_activity (organization_id, created_at DESC);

ALTER TABLE public.monitoring_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS monitoring_activity_select_own_org ON public.monitoring_activity;
CREATE POLICY monitoring_activity_select_own_org
  ON public.monitoring_activity
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS monitoring_activity_insert_own_org ON public.monitoring_activity;
CREATE POLICY monitoring_activity_insert_own_org
  ON public.monitoring_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.current_organization_id());

GRANT SELECT, INSERT ON public.monitoring_activity TO authenticated;
GRANT ALL ON TABLE public.monitoring_activity TO service_role;

-- Extend client_risks source for monitoring-driven risks
ALTER TABLE public.client_risks DROP CONSTRAINT IF EXISTS client_risks_source_check;
ALTER TABLE public.client_risks
  ADD CONSTRAINT client_risks_source_check CHECK (
    source IN ('manual', 'health_engine', 'sla', 'report', 'activity', 'portal', 'monitoring')
  );
