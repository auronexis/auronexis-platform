-- Escalation Rules v1 — configurable reactions to SLA breaches and critical events

CREATE TABLE IF NOT EXISTS public.escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (
    trigger_type IN (
      'sla_warning',
      'sla_breached',
      'critical_risk',
      'critical_incident',
      'report_overdue'
    )
  ),
  severity TEXT,
  delay_minutes INTEGER NOT NULL DEFAULT 0 CHECK (delay_minutes >= 0),
  notify_owner BOOLEAN NOT NULL DEFAULT TRUE,
  notify_assigned_user BOOLEAN NOT NULL DEFAULT TRUE,
  create_activity BOOLEAN NOT NULL DEFAULT TRUE,
  create_notification BOOLEAN NOT NULL DEFAULT TRUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalation_rules_organization_id
  ON public.escalation_rules (organization_id);

CREATE INDEX IF NOT EXISTS idx_escalation_rules_org_trigger
  ON public.escalation_rules (organization_id, trigger_type)
  WHERE enabled = TRUE;

DROP TRIGGER IF EXISTS escalation_rules_set_updated_at ON public.escalation_rules;

CREATE TRIGGER escalation_rules_set_updated_at
  BEFORE UPDATE ON public.escalation_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS escalation_rules_select_own_org ON public.escalation_rules;

CREATE POLICY escalation_rules_select_own_org
  ON public.escalation_rules
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS escalation_rules_insert_owner_admin ON public.escalation_rules;

CREATE POLICY escalation_rules_insert_owner_admin
  ON public.escalation_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS escalation_rules_update_owner_admin ON public.escalation_rules;

CREATE POLICY escalation_rules_update_owner_admin
  ON public.escalation_rules
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS escalation_rules_delete_owner_admin ON public.escalation_rules;

CREATE POLICY escalation_rules_delete_owner_admin
  ON public.escalation_rules
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.escalation_rules TO authenticated;
GRANT ALL ON TABLE public.escalation_rules TO service_role;

-- Track rule execution per entity to prevent duplicate escalations
CREATE TABLE IF NOT EXISTS public.escalation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  escalation_rule_id UUID NOT NULL REFERENCES public.escalation_rules (id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (escalation_rule_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_escalation_executions_organization_id
  ON public.escalation_executions (organization_id);

CREATE INDEX IF NOT EXISTS idx_escalation_executions_executed_at
  ON public.escalation_executions (organization_id, executed_at DESC);

ALTER TABLE public.escalation_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS escalation_executions_select_own_org ON public.escalation_executions;

CREATE POLICY escalation_executions_select_own_org
  ON public.escalation_executions
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

GRANT SELECT ON public.escalation_executions TO authenticated;
GRANT ALL ON TABLE public.escalation_executions TO service_role;

-- Notification types for escalation alerts
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (
    type IN (
      'report_generated',
      'report_published',
      'report_sent',
      'critical_risk',
      'critical_incident',
      'portal_user_created',
      'report_email_failed',
      'sla_warning',
      'sla_breached',
      'escalation_warning',
      'escalation_triggered'
    )
  );

-- Default escalation rules for existing organizations
INSERT INTO public.escalation_rules (
  organization_id,
  name,
  trigger_type,
  notify_owner,
  notify_assigned_user,
  create_activity,
  create_notification,
  enabled
)
SELECT
  o.id,
  'Critical Incident',
  'critical_incident',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1
  FROM public.escalation_rules er
  WHERE er.organization_id = o.id
    AND er.trigger_type = 'critical_incident'
    AND er.name = 'Critical Incident'
);

INSERT INTO public.escalation_rules (
  organization_id,
  name,
  trigger_type,
  notify_owner,
  notify_assigned_user,
  create_activity,
  create_notification,
  enabled
)
SELECT
  o.id,
  'Critical Risk',
  'critical_risk',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1
  FROM public.escalation_rules er
  WHERE er.organization_id = o.id
    AND er.trigger_type = 'critical_risk'
    AND er.name = 'Critical Risk'
);

INSERT INTO public.escalation_rules (
  organization_id,
  name,
  trigger_type,
  notify_owner,
  notify_assigned_user,
  create_activity,
  create_notification,
  enabled
)
SELECT
  o.id,
  'SLA Breached',
  'sla_breached',
  TRUE,
  FALSE,
  TRUE,
  TRUE,
  TRUE
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1
  FROM public.escalation_rules er
  WHERE er.organization_id = o.id
    AND er.trigger_type = 'sla_breached'
    AND er.name = 'SLA Breached'
);
