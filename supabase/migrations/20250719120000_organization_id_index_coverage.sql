-- Build Bible V2 Chapter 5: additive organization_id index coverage
-- Safe, idempotent. Does not alter RLS, data, or FK behaviour.

CREATE INDEX IF NOT EXISTS idx_job_executions_organization_id
  ON public.job_executions (organization_id);

CREATE INDEX IF NOT EXISTS idx_queue_jobs_organization_id
  ON public.queue_jobs (organization_id);

CREATE INDEX IF NOT EXISTS idx_queue_dead_letters_organization_id
  ON public.queue_dead_letters (organization_id);

CREATE INDEX IF NOT EXISTS idx_sales_lead_activities_organization_id
  ON public.sales_lead_activities (organization_id);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_organization_id
  ON public.stripe_webhook_events (organization_id)
  WHERE organization_id IS NOT NULL;
