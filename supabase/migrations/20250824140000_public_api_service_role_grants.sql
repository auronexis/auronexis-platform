-- Public API platform tables: service_role grants for admin diagnostics and cron workers.
-- Without these grants, diagnostics report tableReachable=false (API readiness 40/100).

GRANT ALL ON TABLE public.api_keys TO service_role;
GRANT ALL ON TABLE public.api_request_logs TO service_role;
GRANT ALL ON TABLE public.api_webhook_endpoints TO service_role;
GRANT ALL ON TABLE public.api_webhook_deliveries TO service_role;
GRANT ALL ON TABLE public.webhook_endpoints TO service_role;
GRANT ALL ON TABLE public.webhook_deliveries TO service_role;
