-- Transactional email delivery ledger + user email preferences (marketing opt-in foundation).
-- Does not change auth, RBAC, RLS tenant isolation, or billing behaviour.

-- ---------------------------------------------------------------------------
-- Idempotent transactional delivery claims (welcome, future account mail)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactional_email_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('auth', 'account', 'billing_system')),
  template_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('claimed', 'sent', 'failed', 'skipped')),
  provider_message_id TEXT,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, template_key)
);

CREATE INDEX IF NOT EXISTS idx_transactional_email_deliveries_org
  ON public.transactional_email_deliveries (organization_id);

CREATE INDEX IF NOT EXISTS idx_transactional_email_deliveries_status
  ON public.transactional_email_deliveries (organization_id, status);

CREATE TRIGGER transactional_email_deliveries_set_updated_at
  BEFORE UPDATE ON public.transactional_email_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.transactional_email_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transactional_email_deliveries_select_own_org
  ON public.transactional_email_deliveries;
CREATE POLICY transactional_email_deliveries_select_own_org
  ON public.transactional_email_deliveries
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

-- Writes are service-role only (signup / system jobs).
GRANT SELECT ON public.transactional_email_deliveries TO authenticated;
GRANT ALL ON TABLE public.transactional_email_deliveries TO service_role;

-- ---------------------------------------------------------------------------
-- Email preferences — marketing channels default OFF; transactional is not toggleable
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_email_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  product_updates BOOLEAN NOT NULL DEFAULT FALSE,
  newsletter BOOLEAN NOT NULL DEFAULT FALSE,
  promotions BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_email_preferences_org
  ON public.user_email_preferences (organization_id);

CREATE TRIGGER user_email_preferences_set_updated_at
  BEFORE UPDATE ON public.user_email_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_email_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_email_preferences_select_own ON public.user_email_preferences;
CREATE POLICY user_email_preferences_select_own
  ON public.user_email_preferences
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND user_id = (
      SELECT u.id FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.organization_id = public.current_organization_id()
        AND u.is_disabled = FALSE
      LIMIT 1
    )
  );

DROP POLICY IF EXISTS user_email_preferences_upsert_own ON public.user_email_preferences;
CREATE POLICY user_email_preferences_insert_own
  ON public.user_email_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND user_id = (
      SELECT u.id FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.organization_id = public.current_organization_id()
        AND u.is_disabled = FALSE
      LIMIT 1
    )
  );

CREATE POLICY user_email_preferences_update_own
  ON public.user_email_preferences
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND user_id = (
      SELECT u.id FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.organization_id = public.current_organization_id()
        AND u.is_disabled = FALSE
      LIMIT 1
    )
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND user_id = (
      SELECT u.id FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.organization_id = public.current_organization_id()
        AND u.is_disabled = FALSE
      LIMIT 1
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.user_email_preferences TO authenticated;
GRANT ALL ON TABLE public.user_email_preferences TO service_role;
