-- Phase 22 — Customer activation preferences (organization-scoped, additive)

CREATE TABLE IF NOT EXISTS public.organization_activation_preferences (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations (id) ON DELETE CASCADE,
  welcome_dismissed_at TIMESTAMPTZ,
  onboarding_dismissed_at TIMESTAMPTZ,
  onboarding_last_viewed_at TIMESTAMPTZ,
  activation_milestone_reached_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_activation_prefs_org
  ON public.organization_activation_preferences (organization_id);

CREATE TRIGGER organization_activation_preferences_set_updated_at
  BEFORE UPDATE ON public.organization_activation_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.organization_activation_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_activation_prefs_select_member ON public.organization_activation_preferences;
CREATE POLICY org_activation_prefs_select_member
  ON public.organization_activation_preferences
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS org_activation_prefs_insert_admin ON public.organization_activation_preferences;
CREATE POLICY org_activation_prefs_insert_admin
  ON public.organization_activation_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.auth_user_id = auth.uid()
        AND users.organization_id = organization_activation_preferences.organization_id
        AND users.is_disabled = FALSE
        AND users.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS org_activation_prefs_update_admin ON public.organization_activation_preferences;
CREATE POLICY org_activation_prefs_update_admin
  ON public.organization_activation_preferences
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.auth_user_id = auth.uid()
        AND users.organization_id = organization_activation_preferences.organization_id
        AND users.is_disabled = FALSE
        AND users.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.auth_user_id = auth.uid()
        AND users.organization_id = organization_activation_preferences.organization_id
        AND users.is_disabled = FALSE
        AND users.role IN ('owner', 'admin')
    )
  );

GRANT SELECT ON public.organization_activation_preferences TO authenticated;
GRANT ALL ON public.organization_activation_preferences TO service_role;
