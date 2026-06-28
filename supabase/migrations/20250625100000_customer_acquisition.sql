-- Phase 7 Sprint 2 — Customer acquisition: outbound, enrichment, success

CREATE TYPE public.outbound_list_type AS ENUM (
  'prospects',
  'companies',
  'agencies',
  'msps',
  'consultants',
  'ai_agencies'
);

CREATE TYPE public.prospect_segment AS ENUM (
  'prospects',
  'companies',
  'agencies',
  'msps',
  'consultants',
  'ai_agencies'
);

ALTER TABLE public.sales_leads
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS arr_estimate NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS potential_mrr NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS pain_score INTEGER CHECK (pain_score IS NULL OR (pain_score >= 0 AND pain_score <= 100)),
  ADD COLUMN IF NOT EXISTS fit_score INTEGER CHECK (fit_score IS NULL OR (fit_score >= 0 AND fit_score <= 100)),
  ADD COLUMN IF NOT EXISTS priority_score INTEGER CHECK (priority_score IS NULL OR (priority_score >= 0 AND priority_score <= 100)),
  ADD COLUMN IF NOT EXISTS prospect_segment public.prospect_segment,
  ADD COLUMN IF NOT EXISTS outbound_list_id UUID,
  ADD COLUMN IF NOT EXISTS last_outreach_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outreach_sequence_step INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS no_response_flag BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.outbound_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  list_type public.outbound_list_type NOT NULL DEFAULT 'prospects',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sales_leads
  ADD CONSTRAINT sales_leads_outbound_list_id_fkey
  FOREIGN KEY (outbound_list_id) REFERENCES public.outbound_lists (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_outbound_lists_org ON public.outbound_lists (organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_leads_segment ON public.sales_leads (organization_id, prospect_segment);
CREATE INDEX IF NOT EXISTS idx_sales_leads_priority ON public.sales_leads (organization_id, priority_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_sales_leads_no_response ON public.sales_leads (organization_id, no_response_flag);

CREATE TABLE IF NOT EXISTS public.sales_lead_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.sales_leads (id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL DEFAULT 'followup' CHECK (reminder_type IN ('followup', 'cadence', 'escalation', 'meeting')),
  subject TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_lead_reminders_due ON public.sales_lead_reminders (organization_id, due_at);

CREATE TABLE IF NOT EXISTS public.customer_success_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.sales_leads (id) ON DELETE SET NULL,
  customer_organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  milestones_completed INTEGER NOT NULL DEFAULT 0,
  milestones_total INTEGER NOT NULL DEFAULT 8,
  adoption_score INTEGER NOT NULL DEFAULT 0 CHECK (adoption_score >= 0 AND adoption_score <= 100),
  usage_score INTEGER NOT NULL DEFAULT 0 CHECK (usage_score >= 0 AND usage_score <= 100),
  success_score INTEGER NOT NULL DEFAULT 0 CHECK (success_score >= 0 AND success_score <= 100),
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  renewal_probability INTEGER NOT NULL DEFAULT 0 CHECK (renewal_probability >= 0 AND renewal_probability <= 100),
  pilot_started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_success_org ON public.customer_success_records (organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_success_lead ON public.customer_success_records (lead_id);

CREATE TRIGGER outbound_lists_set_updated_at
  BEFORE UPDATE ON public.outbound_lists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER customer_success_set_updated_at
  BEFORE UPDATE ON public.customer_success_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.outbound_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_lead_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_success_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY outbound_lists_select ON public.outbound_lists FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());
CREATE POLICY outbound_lists_write ON public.outbound_lists FOR ALL TO authenticated
  USING (organization_id = public.current_organization_id() AND public.current_user_role() IN ('owner', 'admin'))
  WITH CHECK (organization_id = public.current_organization_id() AND public.current_user_role() IN ('owner', 'admin'));

CREATE POLICY sales_lead_reminders_select ON public.sales_lead_reminders FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());
CREATE POLICY sales_lead_reminders_write ON public.sales_lead_reminders FOR ALL TO authenticated
  USING (organization_id = public.current_organization_id() AND public.current_user_role() IN ('owner', 'admin'))
  WITH CHECK (organization_id = public.current_organization_id() AND public.current_user_role() IN ('owner', 'admin'));

CREATE POLICY customer_success_select ON public.customer_success_records FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());
CREATE POLICY customer_success_write ON public.customer_success_records FOR ALL TO authenticated
  USING (organization_id = public.current_organization_id() AND public.current_user_role() IN ('owner', 'admin'))
  WITH CHECK (organization_id = public.current_organization_id() AND public.current_user_role() IN ('owner', 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.outbound_lists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_lead_reminders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_success_records TO authenticated;
GRANT ALL ON TABLE public.outbound_lists TO service_role;
GRANT ALL ON TABLE public.sales_lead_reminders TO service_role;
GRANT ALL ON TABLE public.customer_success_records TO service_role;
