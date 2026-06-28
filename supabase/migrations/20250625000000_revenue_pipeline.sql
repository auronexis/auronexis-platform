-- Phase 7 Sprint 1 — Revenue pipeline, CRM leads, founding program

CREATE TYPE public.sales_pipeline_stage AS ENUM (
  'pilot_lead',
  'pilot_application',
  'discovery_call',
  'qualified',
  'proposal_sent',
  'negotiation',
  'won',
  'lost'
);

CREATE TYPE public.sales_lead_source AS ENUM (
  'contact',
  'pilot',
  'demo',
  'newsletter',
  'referral',
  'signup',
  'other'
);

CREATE TYPE public.sales_inbox_key AS ENUM (
  'support',
  'sales',
  'info',
  'security'
);

CREATE TABLE IF NOT EXISTS public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  pipeline_stage public.sales_pipeline_stage NOT NULL DEFAULT 'pilot_lead',
  lead_source public.sales_lead_source NOT NULL DEFAULT 'other',
  inbox_key public.sales_inbox_key NOT NULL DEFAULT 'sales',
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  company_name TEXT,
  company_size TEXT,
  website TEXT,
  industry TEXT,
  employee_count INTEGER,
  pain_points TEXT,
  lead_value NUMERIC(12, 2),
  mrr_estimate NUMERIC(12, 2),
  owner_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  next_followup_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  notes TEXT,
  message TEXT,
  calendly_event_url TEXT,
  google_meet_url TEXT,
  booking_link TEXT,
  referral_code TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  converted_organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  is_founding_customer BOOLEAN NOT NULL DEFAULT FALSE,
  founding_discount_percent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_leads_organization_id ON public.sales_leads (organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_leads_pipeline_stage ON public.sales_leads (organization_id, pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_sales_leads_inbox ON public.sales_leads (organization_id, inbox_key);
CREATE INDEX IF NOT EXISTS idx_sales_leads_email ON public.sales_leads (contact_email);
CREATE INDEX IF NOT EXISTS idx_sales_leads_next_followup ON public.sales_leads (organization_id, next_followup_at);

CREATE TABLE IF NOT EXISTS public.sales_lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.sales_leads (id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL DEFAULT 'note' CHECK (activity_type IN ('note', 'email', 'call', 'meeting', 'status_change', 'outreach')),
  subject TEXT,
  body TEXT,
  created_by_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_lead_activities_lead ON public.sales_lead_activities (lead_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.founding_program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.sales_leads (id) ON DELETE SET NULL,
  customer_organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  slot_number INTEGER NOT NULL CHECK (slot_number >= 1 AND slot_number <= 10),
  discount_percent INTEGER NOT NULL DEFAULT 50 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  lifetime_discount BOOLEAN NOT NULL DEFAULT TRUE,
  founding_badge BOOLEAN NOT NULL DEFAULT TRUE,
  roadmap_influence BOOLEAN NOT NULL DEFAULT TRUE,
  priority_support BOOLEAN NOT NULL DEFAULT TRUE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, slot_number)
);

CREATE INDEX IF NOT EXISTS idx_founding_enrollments_org ON public.founding_program_enrollments (organization_id);

CREATE TRIGGER sales_leads_set_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founding_program_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY sales_leads_select_own_org
  ON public.sales_leads FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());

CREATE POLICY sales_leads_insert_owner_admin
  ON public.sales_leads FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY sales_leads_update_owner_admin
  ON public.sales_leads FOR UPDATE TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY sales_leads_delete_owner_admin
  ON public.sales_leads FOR DELETE TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY sales_lead_activities_select_own_org
  ON public.sales_lead_activities FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());

CREATE POLICY sales_lead_activities_insert_owner_admin
  ON public.sales_lead_activities FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY founding_enrollments_select_own_org
  ON public.founding_program_enrollments FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());

CREATE POLICY founding_enrollments_insert_owner_admin
  ON public.founding_program_enrollments FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_leads TO authenticated;
GRANT SELECT, INSERT ON public.sales_lead_activities TO authenticated;
GRANT SELECT, INSERT ON public.founding_program_enrollments TO authenticated;
GRANT ALL ON TABLE public.sales_leads TO service_role;
GRANT ALL ON TABLE public.sales_lead_activities TO service_role;
GRANT ALL ON TABLE public.founding_program_enrollments TO service_role;
