-- Email Delivery Finalization v1 — org email settings, delivery logging, notifications

-- ---------------------------------------------------------------------------
-- Per-organization email sender settings (Owner/Admin managed)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations (id) ON DELETE CASCADE,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  reply_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_email_settings_organization_id
  ON public.organization_email_settings (organization_id);

CREATE TRIGGER organization_email_settings_set_updated_at
  BEFORE UPDATE ON public.organization_email_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.organization_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY organization_email_settings_select_own_org
  ON public.organization_email_settings
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

CREATE POLICY organization_email_settings_insert_owner_admin
  ON public.organization_email_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY organization_email_settings_update_owner_admin
  ON public.organization_email_settings
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

GRANT SELECT, INSERT, UPDATE ON public.organization_email_settings TO authenticated;
GRANT ALL ON TABLE public.organization_email_settings TO service_role;

-- ---------------------------------------------------------------------------
-- Extend delivery log with Resend message ID
-- ---------------------------------------------------------------------------
ALTER TABLE public.report_email_deliveries
  ADD COLUMN IF NOT EXISTS resend_message_id TEXT;

CREATE INDEX IF NOT EXISTS idx_report_email_deliveries_resend_message_id
  ON public.report_email_deliveries (resend_message_id)
  WHERE resend_message_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Notification type: report_sent
-- ---------------------------------------------------------------------------
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
      'report_email_failed'
    )
  );
