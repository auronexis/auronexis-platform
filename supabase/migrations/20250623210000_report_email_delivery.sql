-- Report Email Delivery v1

CREATE TABLE IF NOT EXISTS public.report_email_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES public.reports (id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_by UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_email_deliveries_organization_id
  ON public.report_email_deliveries (organization_id);

CREATE INDEX IF NOT EXISTS idx_report_email_deliveries_report_id
  ON public.report_email_deliveries (report_id);

CREATE INDEX IF NOT EXISTS idx_report_email_deliveries_status
  ON public.report_email_deliveries (organization_id, status);

ALTER TABLE public.report_email_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_email_deliveries_select_own_org
  ON public.report_email_deliveries
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

CREATE POLICY report_email_deliveries_insert_owner_admin
  ON public.report_email_deliveries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY report_email_deliveries_update_owner_admin
  ON public.report_email_deliveries
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

GRANT SELECT, INSERT, UPDATE ON public.report_email_deliveries TO authenticated;
GRANT ALL ON TABLE public.report_email_deliveries TO service_role;
