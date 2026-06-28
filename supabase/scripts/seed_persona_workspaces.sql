-- Persona workspace seeds (v0.995) — run AFTER scripts/seed-pilot-environment.mjs creates orgs
-- Idempotent per org slug

DO $$
DECLARE
  v_persona RECORD;
  v_org_id UUID;
  v_user_id UUID;
  v_client_id UUID;
  v_i INT;
BEGIN
  FOR v_persona IN
    SELECT * FROM (VALUES
      ('acme-automation', 'Acme Automation'),
      ('vertex-msp', 'Vertex MSP'),
      ('bluewave-consulting', 'Bluewave Consulting'),
      ('novaops', 'NovaOps'),
      ('cyberflow', 'CyberFlow')
    ) AS t(slug, display_name)
  LOOP
    SELECT id INTO v_org_id FROM public.organizations WHERE slug = v_persona.slug LIMIT 1;
    IF v_org_id IS NULL THEN
      RAISE NOTICE 'Skipping persona % — org not found.', v_persona.slug;
      CONTINUE;
    END IF;

    IF EXISTS (SELECT 1 FROM public.clients WHERE organization_id = v_org_id LIMIT 1) THEN
      RAISE NOTICE 'Persona % already seeded.', v_persona.slug;
      CONTINUE;
    END IF;

    SELECT id INTO v_user_id FROM public.users
    WHERE organization_id = v_org_id ORDER BY created_at LIMIT 1;

    -- 5 clients per persona org
    FOR v_i IN 1..5 LOOP
      INSERT INTO public.clients (organization_id, name, status, contact_name, contact_email, monthly_revenue)
      VALUES (
        v_org_id,
        v_persona.display_name || ' Client ' || v_i,
        CASE WHEN v_i <= 3 THEN 'active' WHEN v_i = 4 THEN 'watch' ELSE 'critical' END,
        'Contact ' || v_i,
        'client' || v_i || '@' || replace(v_persona.slug, '-', '') || '.demo',
        (3000 + v_i * 900)::numeric
      );
    END LOOP;

    SELECT id INTO v_client_id FROM public.clients WHERE organization_id = v_org_id LIMIT 1;

    -- Reports, risks, incidents
    FOR v_i IN 1..6 LOOP
      INSERT INTO public.reports (
        organization_id, client_id, title, reporting_period_start, reporting_period_end,
        status, executive_summary, assigned_user_id
      ) VALUES (
        v_org_id, v_client_id,
        v_persona.display_name || ' Report ' || v_i,
        (CURRENT_DATE - INTERVAL '1 month')::date, CURRENT_DATE,
        CASE WHEN v_i % 3 = 0 THEN 'ready' ELSE 'draft' END,
        'Executive summary for ' || v_persona.display_name || '.',
        v_user_id
      );
    END LOOP;

    FOR v_i IN 1..3 LOOP
      INSERT INTO public.risks (organization_id, client_id, title, description, severity, status, owner_user_id)
      VALUES (
        v_org_id, v_client_id, v_persona.display_name || ' Risk ' || v_i,
        'Sample risk for persona simulation.', 'medium', 'open', v_user_id
      );
    END LOOP;

    FOR v_i IN 1..2 LOOP
      INSERT INTO public.incidents (organization_id, client_id, title, description, severity, status, assigned_user_id, occurred_at)
      VALUES (
        v_org_id, v_client_id, v_persona.display_name || ' Incident ' || v_i,
        'Sample incident for persona simulation.', 'medium', 'open', v_user_id,
        NOW() - (v_i || ' days')::interval
      );
    END LOOP;

    INSERT INTO public.customer_invoices (
      organization_id, stripe_invoice_id, stripe_customer_id, status,
      amount_due, amount_paid, currency, period_start, period_end, paid_at
    ) VALUES (
      v_org_id, 'in_persona_' || v_persona.slug, 'cus_persona_' || v_persona.slug,
      'paid', 24900, 24900, 'eur', NOW() - INTERVAL '1 month', NOW(), NOW() - INTERVAL '20 days'
    );

    INSERT INTO public.compliance_policies (organization_id, framework, policy_key, title, status, config)
    VALUES (v_org_id, 'soc2', 'access_control', v_persona.display_name || ' Access Policy', 'active', '{"demo": true}'::jsonb);

    INSERT INTO public.gdpr_requests (organization_id, request_type, subject_email, status, notes)
    VALUES (v_org_id, 'access', 'subject@' || v_persona.slug || '.demo', 'open', 'Persona GDPR sample.');

    RAISE NOTICE 'Seeded persona workspace: %', v_persona.slug;
  END LOOP;
END $$;
