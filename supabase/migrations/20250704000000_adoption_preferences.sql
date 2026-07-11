-- Phase 23 — Adoption UI preferences (organization-scoped, additive)

CREATE TABLE IF NOT EXISTS public.organization_adoption_preferences (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations (id) ON DELETE CASCADE,
  last_viewed_at TIMESTAMPTZ,
  summary_dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_adoption_prefs_org
  ON public.organization_adoption_preferences (organization_id);

CREATE TRIGGER organization_adoption_preferences_set_updated_at
  BEFORE UPDATE ON public.organization_adoption_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.organization_adoption_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_adoption_prefs_select_member ON public.organization_adoption_preferences;
CREATE POLICY org_adoption_prefs_select_member
  ON public.organization_adoption_preferences
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS org_adoption_prefs_insert_admin ON public.organization_adoption_preferences;
CREATE POLICY org_adoption_prefs_insert_admin
  ON public.organization_adoption_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.auth_user_id = auth.uid()
        AND users.organization_id = organization_adoption_preferences.organization_id
        AND users.is_disabled = FALSE
        AND users.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS org_adoption_prefs_update_admin ON public.organization_adoption_preferences;
CREATE POLICY org_adoption_prefs_update_admin
  ON public.organization_adoption_preferences
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.auth_user_id = auth.uid()
        AND users.organization_id = organization_adoption_preferences.organization_id
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
        AND users.organization_id = organization_adoption_preferences.organization_id
        AND users.is_disabled = FALSE
        AND users.role IN ('owner', 'admin')
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.organization_adoption_preferences TO authenticated;
GRANT ALL ON TABLE public.organization_adoption_preferences TO service_role;
