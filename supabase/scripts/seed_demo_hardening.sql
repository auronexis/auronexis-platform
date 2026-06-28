-- Demo workspace hardening (v0.995) — run AFTER seed_demo_workspace.sql
-- Adds Acme Automation client, published reports, audit trail, queue/cron samples, notifications
-- Idempotent: keyed on audit event marker

DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
  v_acme_id UUID;
  v_report_id UUID;
BEGIN
  SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'aurora-demo' LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization aurora-demo not found. Run seed-pilot-environment script first.';
  END IF;

  SELECT id INTO v_user_id FROM public.users
  WHERE organization_id = v_org_id AND role IN ('owner', 'admin')
  ORDER BY CASE role WHEN 'owner' THEN 0 ELSE 1 END
  LIMIT 1;

  IF EXISTS (
    SELECT 1 FROM public.audit_events
    WHERE organization_id = v_org_id AND event_type = 'demo_hardening_seeded'
  ) THEN
    RAISE NOTICE 'Demo hardening already applied for aurora-demo. Skipping.';
    RETURN;
  END IF;

  -- Acme Automation flagship client
  UPDATE public.clients
  SET name = 'Acme Automation', status = 'active',
      contact_name = 'Jordan Acme', contact_email = 'jordan@acme-automation.demo',
      monthly_revenue = 18500
  WHERE organization_id = v_org_id AND name = 'Demo Client 1'
  RETURNING id INTO v_acme_id;

  IF v_acme_id IS NULL THEN
    INSERT INTO public.clients (organization_id, name, status, contact_name, contact_email, monthly_revenue)
    VALUES (v_org_id, 'Acme Automation', 'active', 'Jordan Acme', 'jordan@acme-automation.demo', 18500)
    RETURNING id INTO v_acme_id;
  END IF;

  -- Published + sent reports for portal demo
  UPDATE public.reports
  SET status = 'published'
  WHERE organization_id = v_org_id AND client_id = v_acme_id AND title LIKE 'Monthly Operations Report 1';

  UPDATE public.reports
  SET status = 'sent', sent_at = NOW() - INTERVAL '10 days'
  WHERE organization_id = v_org_id AND client_id = v_acme_id AND title LIKE 'Monthly Operations Report 2';

  SELECT id INTO v_report_id FROM public.reports
  WHERE organization_id = v_org_id AND client_id = v_acme_id AND status IN ('published', 'sent')
  LIMIT 1;

  -- Audit trail samples
  INSERT INTO public.audit_events (organization_id, user_id, entity_type, entity_id, event_type, severity, source, metadata)
  VALUES
    (v_org_id, v_user_id, 'client', v_acme_id, 'client.updated', 'info', 'demo_seed', '{"demo": true}'::jsonb),
    (v_org_id, v_user_id, 'report', v_report_id, 'report.published', 'info', 'demo_seed', '{"demo": true}'::jsonb),
    (v_org_id, v_user_id, 'compliance', NULL, 'compliance.export_requested', 'low', 'demo_seed', '{"format": "csv"}'::jsonb),
    (v_org_id, v_user_id, 'billing', NULL, 'subscription.viewed', 'info', 'demo_seed', '{}'::jsonb),
    (v_org_id, v_user_id, 'system', NULL, 'demo_hardening_seeded', 'info', 'demo_seed', '{"version": "0.995.0"}'::jsonb);

  -- Queue jobs (completed + pending for diagnostics)
  INSERT INTO public.queue_jobs (
    queue_name, organization_id, job_type, payload, status, priority, scheduled_at, completed_at
  ) VALUES
    ('default', v_org_id, 'report_email', '{"demo": true}'::jsonb, 'completed', 0, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour'),
    ('default', v_org_id, 'connector_sync', '{"connector": "github"}'::jsonb, 'completed', 0, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours'),
    ('default', v_org_id, 'automation_run', '{"workflow": "demo-wf-1"}'::jsonb, 'pending', 1, NOW() + INTERVAL '5 minutes', NULL);

  -- Cron execution history
  INSERT INTO public.job_executions (job_id, organization_id, status, started_at, completed_at, duration_ms, metadata)
  VALUES
    ('report_schedules', v_org_id, 'completed', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '59 minutes', 42000, '{"demo": true}'::jsonb),
    ('sla_alerts', v_org_id, 'completed', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '29 minutes', 8000, '{"demo": true}'::jsonb),
    ('queue_worker', NULL, 'completed', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '14 minutes', 12000, '{"processed": 2}'::jsonb);

  -- Internal notifications
  INSERT INTO public.notifications (organization_id, user_id, type, title, message, entity_type, entity_id)
  VALUES
    (v_org_id, v_user_id, 'report_published', 'Report published to portal', 'Acme Automation monthly report is live.', 'report', v_report_id),
    (v_org_id, v_user_id, 'critical_risk', 'High risk flagged', 'Demo Risk 3 requires review.', 'risk', NULL);

  -- Compliance export sample
  INSERT INTO public.audit_exports (organization_id, requested_by, export_format, status, row_count, completed_at)
  VALUES (v_org_id, v_user_id, 'csv', 'completed', 42, NOW() - INTERVAL '2 days');

  RAISE NOTICE 'Demo hardening complete for aurora-demo (Acme Automation, audit, queue, cron samples).';
END $$;
