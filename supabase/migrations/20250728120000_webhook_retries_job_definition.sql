-- Seed webhook_retries job definition/schedule (code registry already registers the handler).
-- Without this row, job_executions inserts fail FK to job_definitions and abort cron dispatch.

INSERT INTO public.job_definitions (id, name, description, schedule_cron, enabled) VALUES
  (
    'webhook_retries',
    'Webhook retries',
    'Retry pending outbound webhook deliveries',
    '*/5 * * * *',
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.job_schedules (job_id, next_run_at) VALUES
  ('webhook_retries', NOW())
ON CONFLICT (job_id) DO NOTHING;
