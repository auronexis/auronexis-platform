-- Phase 22.3 — Table privileges required for activation preference persistence.
-- RLS policies enforce organization scope and owner/admin role; grants allow the operation.

GRANT SELECT, INSERT, UPDATE ON public.organization_activation_preferences TO authenticated;
