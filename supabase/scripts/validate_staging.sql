-- Staging / production Supabase validation queries
-- Run in Supabase SQL Editor after `supabase db push`

-- Migration history (recent)
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 15;

-- Table count (public schema)
SELECT COUNT(*) AS public_table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- RLS enabled tables
SELECT COUNT(*) AS rls_enabled_table_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = TRUE;

-- Tables missing RLS (should be empty or service-only)
SELECT c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = FALSE
ORDER BY c.relname;

-- Storage buckets
SELECT id, name, public, file_size_limit
FROM storage.buckets
ORDER BY name;

-- Production infrastructure tables
SELECT 'stripe_webhook_events' AS tbl, COUNT(*) FROM public.stripe_webhook_events
UNION ALL SELECT 'job_definitions', COUNT(*) FROM public.job_definitions
UNION ALL SELECT 'job_schedules', COUNT(*) FROM public.job_schedules
UNION ALL SELECT 'queue_jobs', COUNT(*) FROM public.queue_jobs
UNION ALL SELECT 'integration_connections', COUNT(*) FROM public.integration_connections
UNION ALL SELECT 'automation_workflows', COUNT(*) FROM public.automation_workflows;

-- Demo workspace check (after seed)
SELECT
  o.slug,
  (SELECT COUNT(*) FROM public.clients c WHERE c.organization_id = o.id) AS clients,
  (SELECT COUNT(*) FROM public.reports r WHERE r.organization_id = o.id) AS reports,
  (SELECT COUNT(*) FROM public.risks rk WHERE rk.organization_id = o.id) AS risks,
  (SELECT COUNT(*) FROM public.incidents i WHERE i.organization_id = o.id) AS incidents,
  (SELECT COUNT(*) FROM public.automation_workflows aw WHERE aw.organization_id = o.id) AS automations,
  (SELECT COUNT(*) FROM public.integration_connections ic WHERE ic.organization_id = o.id) AS connectors,
  (SELECT COUNT(*) FROM public.audit_events ae WHERE ae.organization_id = o.id) AS audit_events,
  (SELECT COUNT(*) FROM public.queue_jobs qj WHERE qj.organization_id = o.id) AS queue_jobs
FROM public.organizations o
WHERE o.slug IN ('aurora-demo', 'acme-automation', 'vertex-msp', 'bluewave-consulting', 'novaops', 'cyberflow')
ORDER BY o.slug;
