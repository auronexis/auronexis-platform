-- Build Bible V2 Chapter 5 follow-up: ai_request_logs FK index coverage
-- Additive and idempotent. Does not alter RLS or data.

CREATE INDEX IF NOT EXISTS idx_ai_request_logs_org_client
  ON public.ai_request_logs (organization_id, client_id);

CREATE INDEX IF NOT EXISTS idx_ai_request_logs_org_report
  ON public.ai_request_logs (organization_id, report_id);
