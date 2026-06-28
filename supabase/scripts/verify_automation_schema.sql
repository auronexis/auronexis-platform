-- Verify automation persistence tables (Phase 4 Sprint 0 + Sprint 1)
-- Run in Supabase Dashboard → SQL Editor against the project in NEXT_PUBLIC_SUPABASE_URL.

-- 1) Expected tables
SELECT
  expected.table_name,
  CASE
    WHEN t.table_name IS NOT NULL THEN 'present'
    ELSE 'MISSING'
  END AS status
FROM (
  VALUES
    ('automation_workflows'),
    ('automation_workflow_versions'),
    ('automation_executions'),
    ('automation_execution_steps'),
    ('automation_webhooks'),
    ('automation_org_state')
) AS expected(table_name)
LEFT JOIN information_schema.tables t
  ON t.table_schema = 'public'
 AND t.table_name = expected.table_name
ORDER BY expected.table_name;

-- 2) Migration history (Supabase CLI tracking)
SELECT version, name
FROM supabase_migrations.schema_migrations
WHERE version IN ('20250623330000', '20250623340000')
ORDER BY version;

-- 3) If any table is MISSING, apply migrations (from repo root):
--    supabase login
--    supabase link --project-ref <your-project-ref>
--    supabase db push
--
--    Or paste and run these files in order in the SQL Editor:
--    supabase/migrations/20250623330000_automation_workflows.sql
--    supabase/migrations/20250623340000_automation_engine_v1.sql

-- 4) After all six tables exist, reload PostgREST schema cache:
NOTIFY pgrst, 'reload schema';

-- 5) Optional: confirm API exposure (returns rows or empty set, not PGRST205)
-- SELECT id FROM public.automation_workflows LIMIT 1;
