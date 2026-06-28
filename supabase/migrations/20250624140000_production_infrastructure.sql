-- Phase 5 Sprint 0 — Production infrastructure (Stripe idempotency, cron jobs, queue)

-- ---------------------------------------------------------------------------
-- Stripe webhook idempotency
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'processed', 'failed', 'duplicate')),
  organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  retry_count INT NOT NULL DEFAULT 0,
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id
  ON public.stripe_webhook_events (stripe_event_id);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status_received
  ON public.stripe_webhook_events (status, received_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_events_stripe_event_unique
  ON public.billing_events (stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stripe_webhook_events_select_owner_admin ON public.stripe_webhook_events;
CREATE POLICY stripe_webhook_events_select_owner_admin
  ON public.stripe_webhook_events FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR (
      organization_id = public.current_organization_id()
      AND public.current_user_role() IN ('owner', 'admin')
    )
  );

GRANT SELECT ON public.stripe_webhook_events TO authenticated;
GRANT ALL ON TABLE public.stripe_webhook_events TO service_role;

-- ---------------------------------------------------------------------------
-- Cron job infrastructure
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  schedule_cron TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_schedules (
  job_id TEXT PRIMARY KEY REFERENCES public.job_definitions (id) ON DELETE CASCADE,
  next_run_at TIMESTAMPTZ NOT NULL,
  last_run_at TIMESTAMPTZ,
  locked_until TIMESTAMPTZ,
  lock_token UUID
);

CREATE TABLE IF NOT EXISTS public.job_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL REFERENCES public.job_definitions (id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations (id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_job_executions_job_started
  ON public.job_executions (job_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_executions_status
  ON public.job_executions (status, started_at DESC);

ALTER TABLE public.job_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_definitions_select_authenticated ON public.job_definitions;
CREATE POLICY job_definitions_select_authenticated
  ON public.job_definitions FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS job_schedules_select_authenticated ON public.job_schedules;
CREATE POLICY job_schedules_select_authenticated
  ON public.job_schedules FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS job_executions_select_owner_admin ON public.job_executions;
CREATE POLICY job_executions_select_owner_admin
  ON public.job_executions FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR (
      organization_id = public.current_organization_id()
      AND public.current_user_role() IN ('owner', 'admin')
    )
  );

GRANT SELECT ON public.job_definitions TO authenticated;
GRANT SELECT ON public.job_schedules TO authenticated;
GRANT SELECT ON public.job_executions TO authenticated;
GRANT ALL ON TABLE public.job_definitions TO service_role;
GRANT ALL ON TABLE public.job_schedules TO service_role;
GRANT ALL ON TABLE public.job_executions TO service_role;

INSERT INTO public.job_definitions (id, name, description, schedule_cron, enabled) VALUES
  ('report_schedules', 'Report schedules', 'Generate draft reports for due schedules', '0 * * * *', TRUE),
  ('sla_alerts', 'SLA alerts', 'Evaluate SLA breaches and dispatch alerts', '*/15 * * * *', TRUE),
  ('connector_sync', 'Connector sync', 'Run scheduled connector synchronizations', '0 */6 * * *', TRUE),
  ('billing_snapshots', 'Billing snapshots', 'Record subscription usage snapshots', '0 2 * * *', TRUE),
  ('predictive_refresh', 'Predictive refresh', 'Refresh predictive intelligence forecasts', '0 3 * * *', TRUE),
  ('automation_maintenance', 'Automation maintenance', 'Prune stale automation execution metadata', '0 4 * * 0', TRUE),
  ('retention_cleanup', 'Retention cleanup', 'Simulate retention impact (no auto-delete)', '0 5 1 * *', TRUE),
  ('queue_worker', 'Queue worker', 'Process pending background queue jobs', '*/5 * * * *', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.job_schedules (job_id, next_run_at) VALUES
  ('report_schedules', NOW()),
  ('sla_alerts', NOW()),
  ('connector_sync', NOW()),
  ('billing_snapshots', NOW()),
  ('predictive_refresh', NOW()),
  ('automation_maintenance', NOW()),
  ('retention_cleanup', NOW()),
  ('queue_worker', NOW())
ON CONFLICT (job_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Queue infrastructure
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.queue_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations (id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (
    status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'paused')
  ),
  priority INT NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_jobs_queue_status_scheduled
  ON public.queue_jobs (queue_name, status, scheduled_at ASC)
  WHERE status IN ('pending', 'paused');

CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_jobs_idempotency
  ON public.queue_jobs (queue_name, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND status NOT IN ('completed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.queue_dead_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_job_id UUID NOT NULL REFERENCES public.queue_jobs (id) ON DELETE CASCADE,
  queue_name TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  attempts INT NOT NULL DEFAULT 0,
  dead_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_dead_letters_queue_dead
  ON public.queue_dead_letters (queue_name, dead_at DESC);

DROP TRIGGER IF EXISTS queue_jobs_set_updated_at ON public.queue_jobs;
CREATE TRIGGER queue_jobs_set_updated_at
  BEFORE UPDATE ON public.queue_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.queue_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_dead_letters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS queue_jobs_select_owner_admin ON public.queue_jobs;
CREATE POLICY queue_jobs_select_owner_admin
  ON public.queue_jobs FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR (
      organization_id = public.current_organization_id()
      AND public.current_user_role() IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS queue_dead_letters_select_owner_admin ON public.queue_dead_letters;
CREATE POLICY queue_dead_letters_select_owner_admin
  ON public.queue_dead_letters FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR (
      organization_id = public.current_organization_id()
      AND public.current_user_role() IN ('owner', 'admin')
    )
  );

GRANT SELECT ON public.queue_jobs TO authenticated;
GRANT SELECT ON public.queue_dead_letters TO authenticated;
GRANT ALL ON TABLE public.queue_jobs TO service_role;
GRANT ALL ON TABLE public.queue_dead_letters TO service_role;
