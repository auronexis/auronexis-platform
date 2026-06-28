-- Phase 4 Sprint 8 — Billing, Usage & Subscription Platform v2

CREATE TABLE IF NOT EXISTS public.billing_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_usage_events_org_period
  ON public.billing_usage_events (organization_id, billing_period_start DESC, metric);

CREATE INDEX IF NOT EXISTS idx_billing_usage_events_org_recorded
  ON public.billing_usage_events (organization_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS public.subscription_usage_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_snapshots_org_period
  ON public.subscription_usage_snapshots (organization_id, period_start DESC);

CREATE TABLE IF NOT EXISTS public.customer_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL,
  amount_due INTEGER NOT NULL DEFAULT 0,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'eur',
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_invoices_org_created
  ON public.customer_invoices (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_invoices_org_status
  ON public.customer_invoices (organization_id, status);

CREATE TABLE IF NOT EXISTS public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  percentage_off NUMERIC CHECK (percentage_off IS NULL OR (percentage_off > 0 AND percentage_off <= 100)),
  amount_off INTEGER CHECK (amount_off IS NULL OR amount_off > 0),
  currency TEXT NOT NULL DEFAULT 'eur',
  max_redemptions INTEGER,
  redemption_count INTEGER NOT NULL DEFAULT 0 CHECK (redemption_count >= 0),
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_active
  ON public.discount_codes (active, expires_at);

CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_org_created
  ON public.billing_events (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_events_stripe_event
  ON public.billing_events (stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;

DROP TRIGGER IF EXISTS subscription_usage_snapshots_set_updated_at ON public.subscription_usage_snapshots;
CREATE TRIGGER subscription_usage_snapshots_set_updated_at
  BEFORE UPDATE ON public.subscription_usage_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS customer_invoices_set_updated_at ON public.customer_invoices;
CREATE TRIGGER customer_invoices_set_updated_at
  BEFORE UPDATE ON public.customer_invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS discount_codes_set_updated_at ON public.discount_codes;
CREATE TRIGGER discount_codes_set_updated_at
  BEFORE UPDATE ON public.discount_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.billing_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS billing_usage_events_select_own_org ON public.billing_usage_events;
CREATE POLICY billing_usage_events_select_own_org
  ON public.billing_usage_events FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS subscription_usage_snapshots_select_own_org ON public.subscription_usage_snapshots;
CREATE POLICY subscription_usage_snapshots_select_own_org
  ON public.subscription_usage_snapshots FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS customer_invoices_select_own_org ON public.customer_invoices;
CREATE POLICY customer_invoices_select_own_org
  ON public.customer_invoices FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS discount_codes_select_authenticated ON public.discount_codes;
CREATE POLICY discount_codes_select_authenticated
  ON public.discount_codes FOR SELECT TO authenticated
  USING (active = TRUE);

DROP POLICY IF EXISTS billing_events_select_owner_admin ON public.billing_events;
CREATE POLICY billing_events_select_owner_admin
  ON public.billing_events FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT ON public.billing_usage_events TO authenticated;
GRANT SELECT ON public.subscription_usage_snapshots TO authenticated;
GRANT SELECT ON public.customer_invoices TO authenticated;
GRANT SELECT ON public.discount_codes TO authenticated;
GRANT SELECT ON public.billing_events TO authenticated;

GRANT ALL ON TABLE public.billing_usage_events TO service_role;
GRANT ALL ON TABLE public.subscription_usage_snapshots TO service_role;
GRANT ALL ON TABLE public.customer_invoices TO service_role;
GRANT ALL ON TABLE public.discount_codes TO service_role;
GRANT ALL ON TABLE public.billing_events TO service_role;

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
      'subscription_trial_ending',
      'seat_limit_reached',
      'plan_limit_reached',
      'billing_limit_approaching',
      'billing_limit_reached',
      'invoice_paid',
      'invoice_failed'
    )
  );

INSERT INTO public.discount_codes (code, description, discount_type, percentage_off, amount_off, max_redemptions, active)
VALUES
  ('LAUNCH20', 'Launch promotion — 20% off first billing period', 'percentage', 20, NULL, 1000, TRUE),
  ('ANNUAL50', 'Annual migration credit — €50 off', 'fixed', NULL, 5000, 500, TRUE)
ON CONFLICT (code) DO NOTHING;
