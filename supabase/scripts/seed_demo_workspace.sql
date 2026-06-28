-- Demo workspace seed for sales demos and staging validation (v0.97)
-- Run AFTER creating an owner account with organization slug 'aurora-demo'
--
-- Usage (Supabase SQL editor or psql):
--   1. Sign up at staging with agency name "Aurora Demo" (slug: aurora-demo)
--   2. Run this script as service role or postgres user
--
-- Idempotent: skips if demo clients already exist

DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
  v_client_ids UUID[] := ARRAY[]::UUID[];
  v_client_id UUID;
  v_workflow_id UUID;
  v_i INT;
  v_demo_workflow JSONB := '{"id":"demo-wf","name":"Demo Workflow","status":"active","trigger":{"type":"manual_trigger","config":{}},"conditions":{"id":"root","logic":"and","conditions":[]},"actions":[{"id":"a1","type":"create_activity","config":{"title":"Demo automation activity"}}],"confirmationRequired":false,"version":1,"createdAt":"2025-01-01T00:00:00.000Z","updatedAt":"2025-01-01T00:00:00.000Z"}'::jsonb;
BEGIN
  SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'aurora-demo' LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization with slug aurora-demo not found. Sign up first.';
  END IF;

  SELECT id INTO v_user_id FROM public.users
  WHERE organization_id = v_org_id AND role = 'owner' LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Owner user not found for aurora-demo org.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.clients WHERE organization_id = v_org_id AND name LIKE 'Demo Client %') THEN
    RAISE NOTICE 'Demo data already seeded for aurora-demo. Skipping.';
    RETURN;
  END IF;

  -- 10 clients
  FOR v_i IN 1..10 LOOP
    INSERT INTO public.clients (organization_id, name, status, contact_name, contact_email, monthly_revenue)
    VALUES (
      v_org_id,
      'Demo Client ' || v_i,
      CASE WHEN v_i <= 7 THEN 'active' WHEN v_i = 8 THEN 'watch' WHEN v_i = 9 THEN 'critical' ELSE 'active' END,
      'Contact ' || v_i,
      'client' || v_i || '@demo.auroranexis.com',
      (5000 + v_i * 1200)::numeric
    )
    RETURNING id INTO v_client_id;
    v_client_ids := array_append(v_client_ids, v_client_id);
  END LOOP;

  -- 20 reports
  FOR v_i IN 1..20 LOOP
    INSERT INTO public.reports (
      organization_id, client_id, title, reporting_period_start, reporting_period_end,
      status, executive_summary, assigned_user_id
    ) VALUES (
      v_org_id,
      v_client_ids[((v_i - 1) % 10) + 1],
      'Monthly Operations Report ' || v_i,
      (CURRENT_DATE - INTERVAL '1 month')::date,
      CURRENT_DATE,
      CASE WHEN v_i % 4 = 0 THEN 'ready' WHEN v_i % 5 = 0 THEN 'sent' ELSE 'draft' END,
      'Executive summary for demo report ' || v_i || '. Portfolio health stable with proactive risk mitigation.',
      v_user_id
    );
  END LOOP;

  -- 8 risks
  FOR v_i IN 1..8 LOOP
    INSERT INTO public.risks (
      organization_id, client_id, title, description, severity, status, owner_user_id
    ) VALUES (
      v_org_id,
      v_client_ids[((v_i - 1) % 10) + 1],
      'Demo Risk ' || v_i,
      'Sample risk for demo workspace.',
      CASE WHEN v_i % 4 = 0 THEN 'critical' WHEN v_i % 3 = 0 THEN 'high' ELSE 'medium' END,
      CASE WHEN v_i % 6 = 0 THEN 'resolved' ELSE 'open' END,
      v_user_id
    );
  END LOOP;

  -- 5 incidents
  FOR v_i IN 1..5 LOOP
    INSERT INTO public.incidents (
      organization_id, client_id, title, description, severity, status, assigned_user_id, occurred_at
    ) VALUES (
      v_org_id,
      v_client_ids[((v_i - 1) % 10) + 1],
      'Demo Incident ' || v_i,
      'Sample incident for demo workspace.',
      CASE WHEN v_i = 5 THEN 'critical' ELSE 'medium' END,
      CASE WHEN v_i % 4 = 0 THEN 'resolved' ELSE 'open' END,
      v_user_id,
      NOW() - (v_i || ' days')::interval
    );
  END LOOP;

  -- Report templates (3)
  INSERT INTO public.report_templates (
    organization_id, name, description, is_default,
    executive_summary_template, key_wins_template, key_risks_template, next_actions_template, created_by
  )
  VALUES
    (v_org_id, 'Executive Monthly', 'Standard executive summary template', TRUE, 'Monthly overview.', 'Key wins.', 'Key risks.', 'Next actions.', v_user_id),
    (v_org_id, 'Technical Review', 'Technical operations template', FALSE, 'Technical summary.', 'Deployments.', 'Technical debt.', 'Sprint goals.', v_user_id),
    (v_org_id, 'Client QBR', 'Quarterly business review', FALSE, 'QBR summary.', 'Growth.', 'Risks.', 'Roadmap.', v_user_id);

  -- Report schedules (2)
  INSERT INTO public.report_schedules (
    organization_id, client_id, title_template, frequency, day_of_month, assigned_user_id, is_active, next_run_at
  ) VALUES
    (v_org_id, v_client_ids[1], 'Monthly Report — Demo Client 1', 'monthly', 1, v_user_id, TRUE, (CURRENT_DATE + 7)::date),
    (v_org_id, v_client_ids[2], 'Monthly Report — Demo Client 2', 'monthly', 15, v_user_id, TRUE, (CURRENT_DATE + 14)::date);

  -- 5 automation workflows
  FOR v_i IN 1..5 LOOP
    INSERT INTO public.automation_workflows (
      organization_id, name, description, status, version, workflow_json, created_by, updated_by
    ) VALUES (
      v_org_id,
      'Demo Automation ' || v_i,
      'Sample automation workflow for staging demos.',
      CASE WHEN v_i <= 3 THEN 'active' ELSE 'draft' END,
      1,
      v_demo_workflow || jsonb_build_object('name', 'Demo Automation ' || v_i, 'id', 'demo-wf-' || v_i),
      v_user_id,
      v_user_id
    )
    RETURNING id INTO v_workflow_id;

    INSERT INTO public.automation_workflow_versions (workflow_id, version, workflow_json, created_by)
    VALUES (v_workflow_id, 1, v_demo_workflow || jsonb_build_object('name', 'Demo Automation ' || v_i), v_user_id);
  END LOOP;

  -- 3 demo connector connections (display-only — no OAuth tokens)
  INSERT INTO public.integration_connections (
    organization_id, connector_id, display_name, status, health_status, last_sync_at, last_sync_status, metadata, created_by
  ) VALUES
    (v_org_id, 'google', 'Google Workspace (Demo)', 'connected', 'healthy', NOW() - INTERVAL '2 hours', 'success', '{"demo": true}'::jsonb, v_user_id),
    (v_org_id, 'github', 'GitHub (Demo)', 'connected', 'healthy', NOW() - INTERVAL '1 day', 'success', '{"demo": true}'::jsonb, v_user_id),
    (v_org_id, 'slack', 'Slack (Demo)', 'connected', 'degraded', NOW() - INTERVAL '3 days', 'partial', '{"demo": true}'::jsonb, v_user_id);

  -- Demo invoices (Stripe test IDs — not live charges)
  INSERT INTO public.customer_invoices (
    organization_id, stripe_invoice_id, stripe_customer_id, status,
    amount_due, amount_paid, currency, period_start, period_end, paid_at
  ) VALUES
    (v_org_id, 'in_demo_paid_001', 'cus_demo_001', 'paid', 24900, 24900, 'eur', NOW() - INTERVAL '1 month', NOW(), NOW() - INTERVAL '25 days'),
    (v_org_id, 'in_demo_open_002', 'cus_demo_001', 'open', 24900, 0, 'eur', NOW(), NOW() + INTERVAL '1 month', NULL);

  -- White label example
  INSERT INTO public.white_label_settings (
    organization_id, company_name, platform_name, primary_color, secondary_color,
    portal_title, portal_welcome_message, login_title, published_at, updated_by
  ) VALUES (
    v_org_id,
    'Aurora Demo Agency',
    'Aurora Command Center',
    '#2563EB',
    '#071A3D',
    'Client Portal',
    'Welcome to your secure operations portal.',
    'Sign in to Aurora Demo',
    NOW(),
    v_user_id
  );

  -- API key example (revoked hash — not usable; for settings UI demo)
  INSERT INTO public.api_keys (
    organization_id, key_type, name, key_prefix, key_hash, scopes, status, created_by, metadata
  ) VALUES (
    v_org_id,
    'workspace',
    'Demo API Key',
    'ak_demo_',
    'demo_hash_not_valid_for_auth',
    ARRAY['clients:read', 'reports:read'],
    'active',
    v_user_id,
    '{"demo": true}'::jsonb
  );

  -- Compliance policies
  INSERT INTO public.compliance_policies (organization_id, framework, policy_key, title, status, config)
  VALUES
    (v_org_id, 'soc2', 'access_control', 'Access Control Policy', 'active', '{"description": "Demo SOC 2 access control policy."}'::jsonb),
    (v_org_id, 'gdpr', 'data_processing', 'Data Processing Policy', 'active', '{"description": "Demo GDPR processing policy."}'::jsonb);

  -- Retention rules (compliance controls)
  INSERT INTO public.retention_rules (organization_id, data_category, retention_period, simulation_only, enabled)
  VALUES
    (v_org_id, 'audit_events', '7y', TRUE, TRUE),
    (v_org_id, 'reports', '3y', TRUE, TRUE);

  -- Security incident (compliance)
  INSERT INTO public.security_incidents (
    organization_id, title, description, severity, status, impact, reported_by
  ) VALUES (
    v_org_id,
    'Demo phishing simulation',
    'Scheduled security awareness exercise — no customer impact.',
    'low',
    'resolved',
    'None — simulation only',
    v_user_id
  );

  -- GDPR request
  INSERT INTO public.gdpr_requests (organization_id, request_type, subject_email, status, notes)
  VALUES (v_org_id, 'access', 'subject@demo.auroranexis.com', 'open', 'Demo GDPR access request.');

  RAISE NOTICE 'Demo workspace seeded for organization %. Portal users: create manually via client settings.', v_org_id;
END $$;
