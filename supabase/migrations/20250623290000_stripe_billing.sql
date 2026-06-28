-- Stripe Billing v1 — organization subscription records synced from Stripe webhooks

CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations (id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_organization_id
  ON public.organization_subscriptions (organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_stripe_customer_id
  ON public.organization_subscriptions (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_stripe_subscription_id
  ON public.organization_subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

DROP TRIGGER IF EXISTS organization_subscriptions_set_updated_at ON public.organization_subscriptions;

CREATE TRIGGER organization_subscriptions_set_updated_at
  BEFORE UPDATE ON public.organization_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organization_subscriptions_select_own_org ON public.organization_subscriptions;

CREATE POLICY organization_subscriptions_select_own_org
  ON public.organization_subscriptions
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS organization_subscriptions_update_owner_admin ON public.organization_subscriptions;

CREATE POLICY organization_subscriptions_update_owner_admin
  ON public.organization_subscriptions
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

GRANT SELECT, UPDATE ON public.organization_subscriptions TO authenticated;
GRANT ALL ON TABLE public.organization_subscriptions TO service_role;

-- Notification types for billing events
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
      'escalation_triggered',
      'subscription_activated',
      'subscription_payment_failed',
      'subscription_cancelled',
      'subscription_trial_ending'
    )
  );
