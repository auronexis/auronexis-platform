-- Plan Enforcement v1 — plan limit notification type

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
      'plan_limit_reached'
    )
  );
