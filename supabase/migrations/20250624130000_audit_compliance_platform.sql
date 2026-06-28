-- Phase 4 Sprint 9 — Audit, Compliance & Governance Platform v1

CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  ip_address TEXT,
  user_agent TEXT,
  source TEXT NOT NULL DEFAULT 'system',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_org_created
  ON public.audit_events (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_org_entity
  ON public.audit_events (organization_id, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_events_org_event_type
  ON public.audit_events (organization_id, event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS public.audit_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  requested_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  export_format TEXT NOT NULL CHECK (export_format IN ('csv', 'json', 'evidence')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  row_count INTEGER NOT NULL DEFAULT 0,
  payload JSONB,
  error_message TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_exports_org_created
  ON public.audit_exports (organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.compliance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  framework TEXT NOT NULL,
  policy_key TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'deprecated')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, framework, policy_key)
);

CREATE INDEX IF NOT EXISTS idx_compliance_policies_org_framework
  ON public.compliance_policies (organization_id, framework);

CREATE TABLE IF NOT EXISTS public.retention_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  data_category TEXT NOT NULL,
  retention_period TEXT NOT NULL CHECK (
    retention_period IN ('30d', '90d', '180d', '1y', '3y', '7y', 'forever')
  ),
  simulation_only BOOLEAN NOT NULL DEFAULT TRUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, data_category)
);

CREATE INDEX IF NOT EXISTS idx_retention_rules_org_enabled
  ON public.retention_rules (organization_id, enabled);

CREATE TABLE IF NOT EXISTS public.data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  action TEXT NOT NULL,
  ip_address TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_access_logs_org_created
  ON public.data_access_logs (organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'investigating', 'mitigated', 'resolved')
  ),
  impact TEXT,
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  affected_entities JSONB NOT NULL DEFAULT '[]'::jsonb,
  root_cause TEXT,
  mitigation TEXT,
  postmortem TEXT,
  reported_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_incidents_org_status
  ON public.security_incidents (organization_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  subject_email TEXT NOT NULL,
  subject_type TEXT NOT NULL DEFAULT 'portal_user',
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_records_org_email
  ON public.consent_records (organization_id, subject_email);

CREATE TABLE IF NOT EXISTS public.gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (
    request_type IN (
      'access',
      'deletion',
      'export',
      'correction',
      'restriction',
      'consent_withdrawal'
    )
  ),
  subject_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'processing', 'completed', 'rejected', 'expired')
  ),
  notes TEXT,
  requested_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_org_status
  ON public.gdpr_requests (organization_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.legal_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  entity_type TEXT,
  entity_id UUID,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_holds_org_active
  ON public.legal_holds (organization_id, active);

DROP TRIGGER IF EXISTS audit_exports_set_updated_at ON public.audit_exports;
CREATE TRIGGER audit_exports_set_updated_at
  BEFORE UPDATE ON public.audit_exports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS compliance_policies_set_updated_at ON public.compliance_policies;
CREATE TRIGGER compliance_policies_set_updated_at
  BEFORE UPDATE ON public.compliance_policies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS retention_rules_set_updated_at ON public.retention_rules;
CREATE TRIGGER retention_rules_set_updated_at
  BEFORE UPDATE ON public.retention_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS security_incidents_set_updated_at ON public.security_incidents;
CREATE TRIGGER security_incidents_set_updated_at
  BEFORE UPDATE ON public.security_incidents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS gdpr_requests_set_updated_at ON public.gdpr_requests;
CREATE TRIGGER gdpr_requests_set_updated_at
  BEFORE UPDATE ON public.gdpr_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS legal_holds_set_updated_at ON public.legal_holds;
CREATE TRIGGER legal_holds_set_updated_at
  BEFORE UPDATE ON public.legal_holds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_holds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_events_select_owner_admin ON public.audit_events;
CREATE POLICY audit_events_select_owner_admin
  ON public.audit_events FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS audit_exports_select_owner_admin ON public.audit_exports;
CREATE POLICY audit_exports_select_owner_admin
  ON public.audit_exports FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS audit_exports_insert_owner_admin ON public.audit_exports;
CREATE POLICY audit_exports_insert_owner_admin
  ON public.audit_exports FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS compliance_policies_select_owner_admin ON public.compliance_policies;
CREATE POLICY compliance_policies_select_owner_admin
  ON public.compliance_policies FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS compliance_policies_mutate_owner_admin ON public.compliance_policies;
CREATE POLICY compliance_policies_mutate_owner_admin
  ON public.compliance_policies FOR ALL TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS retention_rules_select_owner_admin ON public.retention_rules;
CREATE POLICY retention_rules_select_owner_admin
  ON public.retention_rules FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS retention_rules_mutate_owner_admin ON public.retention_rules;
CREATE POLICY retention_rules_mutate_owner_admin
  ON public.retention_rules FOR ALL TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS data_access_logs_select_owner_admin ON public.data_access_logs;
CREATE POLICY data_access_logs_select_owner_admin
  ON public.data_access_logs FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS security_incidents_select_owner_admin ON public.security_incidents;
CREATE POLICY security_incidents_select_owner_admin
  ON public.security_incidents FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS security_incidents_mutate_owner_admin ON public.security_incidents;
CREATE POLICY security_incidents_mutate_owner_admin
  ON public.security_incidents FOR ALL TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS consent_records_select_owner_admin ON public.consent_records;
CREATE POLICY consent_records_select_owner_admin
  ON public.consent_records FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS consent_records_mutate_owner_admin ON public.consent_records;
CREATE POLICY consent_records_mutate_owner_admin
  ON public.consent_records FOR ALL TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS gdpr_requests_select_owner_admin ON public.gdpr_requests;
CREATE POLICY gdpr_requests_select_owner_admin
  ON public.gdpr_requests FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS gdpr_requests_mutate_owner_admin ON public.gdpr_requests;
CREATE POLICY gdpr_requests_mutate_owner_admin
  ON public.gdpr_requests FOR ALL TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS legal_holds_select_owner_admin ON public.legal_holds;
CREATE POLICY legal_holds_select_owner_admin
  ON public.legal_holds FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS legal_holds_mutate_owner_admin ON public.legal_holds;
CREATE POLICY legal_holds_mutate_owner_admin
  ON public.legal_holds FOR ALL TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT ON public.audit_events TO authenticated;
GRANT SELECT, INSERT ON public.audit_exports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_policies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.retention_rules TO authenticated;
GRANT SELECT ON public.data_access_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_incidents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consent_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gdpr_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_holds TO authenticated;

GRANT ALL ON TABLE public.audit_events TO service_role;
GRANT ALL ON TABLE public.audit_exports TO service_role;
GRANT ALL ON TABLE public.compliance_policies TO service_role;
GRANT ALL ON TABLE public.retention_rules TO service_role;
GRANT ALL ON TABLE public.data_access_logs TO service_role;
GRANT ALL ON TABLE public.security_incidents TO service_role;
GRANT ALL ON TABLE public.consent_records TO service_role;
GRANT ALL ON TABLE public.gdpr_requests TO service_role;
GRANT ALL ON TABLE public.legal_holds TO service_role;
