-- Report publish workflow + Notification Center v1

-- ---------------------------------------------------------------------------
-- Report status: add published (client portal visibility before email sent)
-- ---------------------------------------------------------------------------
ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_status_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_status_check
  CHECK (status IN ('draft', 'ready', 'published', 'sent', 'archived'));

-- Portal users may view published or sent reports only
DROP POLICY IF EXISTS reports_select_portal_client ON public.reports;

CREATE POLICY reports_select_portal_client
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (
    client_id = public.current_portal_client_id()
    AND status IN ('published', 'sent')
    AND public.current_portal_client_id() IS NOT NULL
  );

-- ---------------------------------------------------------------------------
-- Internal notifications for agency users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN (
      'report_generated',
      'report_published',
      'critical_risk',
      'critical_incident',
      'portal_user_created',
      'report_email_failed'
    )
  ),
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_organization_id
  ON public.notifications (organization_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_type
  ON public.notifications (organization_id, type);

CREATE INDEX IF NOT EXISTS idx_notifications_read_at
  ON public.notifications (user_id, read_at);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND user_id = public.current_app_user_id()
  );

CREATE POLICY notifications_update_own
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND user_id = public.current_app_user_id()
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND user_id = public.current_app_user_id()
  );

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;
