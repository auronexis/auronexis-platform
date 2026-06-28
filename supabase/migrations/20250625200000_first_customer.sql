-- Phase 7 Sprint 3 — First paying customer: sourcing, execution, onboarding, proposals, portal

CREATE TYPE public.lead_source_region AS ENUM ('germany', 'dach', 'eu');

CREATE TYPE public.agency_type AS ENUM (
  'msp',
  'ai_agency',
  'automation_agency',
  'agency',
  'consultant'
);

CREATE TYPE public.sales_proposal_status AS ENUM ('draft', 'sent', 'accepted', 'declined');

ALTER TABLE public.sales_leads
  ADD COLUMN IF NOT EXISTS source_region public.lead_source_region,
  ADD COLUMN IF NOT EXISTS agency_type public.agency_type,
  ADD COLUMN IF NOT EXISTS reply_received_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sales_leads_source_region ON public.sales_leads (organization_id, source_region);
CREATE INDEX IF NOT EXISTS idx_sales_leads_agency_type ON public.sales_leads (organization_id, agency_type);

CREATE TABLE IF NOT EXISTS public.sales_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.sales_leads (id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Commercial Proposal',
  status public.sales_proposal_status NOT NULL DEFAULT 'draft',
  pilot_agreement TEXT,
  pricing_proposal TEXT,
  roi_estimate TEXT,
  timeline TEXT,
  implementation_plan TEXT,
  mrr_proposed NUMERIC(12, 2),
  arr_proposed NUMERIC(12, 2),
  pdf_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_proposals_org ON public.sales_proposals (organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_proposals_lead ON public.sales_proposals (lead_id);

CREATE TABLE IF NOT EXISTS public.customer_onboarding_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.sales_leads (id) ON DELETE SET NULL,
  customer_organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  kickoff_scheduled_at TIMESTAMPTZ,
  kickoff_completed_at TIMESTAMPTZ,
  workspace_created BOOLEAN NOT NULL DEFAULT FALSE,
  checklist_completed INTEGER NOT NULL DEFAULT 0 CHECK (checklist_completed >= 0),
  checklist_total INTEGER NOT NULL DEFAULT 7,
  team_invited BOOLEAN NOT NULL DEFAULT FALSE,
  integrations_connected BOOLEAN NOT NULL DEFAULT FALSE,
  diagnostics_baseline BOOLEAN NOT NULL DEFAULT FALSE,
  health_baseline_score INTEGER NOT NULL DEFAULT 0 CHECK (health_baseline_score >= 0 AND health_baseline_score <= 100),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'complete')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_onboarding_org ON public.customer_onboarding_records (organization_id);

CREATE TABLE IF NOT EXISTS public.portal_customer_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.sales_leads (id) ON DELETE SET NULL,
  customer_organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients (id) ON DELETE SET NULL,
  onboarding_status TEXT NOT NULL DEFAULT 'not_started',
  milestones_completed INTEGER NOT NULL DEFAULT 0 CHECK (milestones_completed >= 0),
  milestones_total INTEGER NOT NULL DEFAULT 6,
  open_tasks INTEGER NOT NULL DEFAULT 0 CHECK (open_tasks >= 0),
  feedback TEXT,
  satisfaction_score INTEGER CHECK (satisfaction_score IS NULL OR (satisfaction_score >= 0 AND satisfaction_score <= 100)),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_onboarding_org ON public.portal_customer_onboarding (organization_id);
CREATE INDEX IF NOT EXISTS idx_portal_onboarding_client ON public.portal_customer_onboarding (client_id);

CREATE TRIGGER sales_proposals_set_updated_at
  BEFORE UPDATE ON public.sales_proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER customer_onboarding_records_set_updated_at
  BEFORE UPDATE ON public.customer_onboarding_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER portal_customer_onboarding_set_updated_at
  BEFORE UPDATE ON public.portal_customer_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.sales_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_onboarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_customer_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY sales_proposals_select ON public.sales_proposals FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());
CREATE POLICY sales_proposals_write ON public.sales_proposals FOR ALL TO authenticated
  USING (organization_id = public.current_organization_id() AND public.current_user_role() IN ('owner', 'admin'))
  WITH CHECK (organization_id = public.current_organization_id() AND public.current_user_role() IN ('owner', 'admin'));

CREATE POLICY customer_onboarding_select ON public.customer_onboarding_records FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());
CREATE POLICY customer_onboarding_write ON public.customer_onboarding_records FOR ALL TO authenticated
  USING (organization_id = public.current_organization_id() AND public.current_user_role() IN ('owner', 'admin'))
  WITH CHECK (organization_id = public.current_organization_id() AND public.current_user_role() IN ('owner', 'admin'));

CREATE POLICY portal_onboarding_select ON public.portal_customer_onboarding FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());
CREATE POLICY portal_onboarding_write ON public.portal_customer_onboarding FOR ALL TO authenticated
  USING (organization_id = public.current_organization_id() AND public.current_user_role() IN ('owner', 'admin'))
  WITH CHECK (organization_id = public.current_organization_id() AND public.current_user_role() IN ('owner', 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_proposals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_onboarding_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_customer_onboarding TO authenticated;
GRANT ALL ON TABLE public.sales_proposals TO service_role;
GRANT ALL ON TABLE public.customer_onboarding_records TO service_role;
GRANT ALL ON TABLE public.portal_customer_onboarding TO service_role;
