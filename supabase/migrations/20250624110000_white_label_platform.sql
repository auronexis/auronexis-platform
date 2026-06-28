-- Phase 4 Sprint 7 — White Label Platform v1

CREATE TABLE IF NOT EXISTS public.white_label_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations (id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  platform_name TEXT,
  logo_light TEXT,
  logo_dark TEXT,
  favicon TEXT,
  login_background TEXT,
  dashboard_background TEXT,
  primary_color TEXT NOT NULL DEFAULT '#2563EB',
  secondary_color TEXT NOT NULL DEFAULT '#071A3D',
  accent_color TEXT NOT NULL DEFAULT '#2563EB',
  success_color TEXT NOT NULL DEFAULT '#16A34A',
  warning_color TEXT NOT NULL DEFAULT '#D97706',
  danger_color TEXT NOT NULL DEFAULT '#DC2626',
  support_email TEXT,
  support_url TEXT,
  website TEXT,
  privacy_url TEXT,
  terms_url TEXT,
  custom_css TEXT,
  custom_domain TEXT,
  domain_verification_status TEXT NOT NULL DEFAULT 'not_configured' CHECK (
    domain_verification_status IN ('not_configured', 'pending', 'verified', 'failed')
  ),
  domain_ssl_status TEXT NOT NULL DEFAULT 'not_configured' CHECK (
    domain_ssl_status IN ('not_configured', 'pending', 'active', 'failed')
  ),
  domain_verified_at TIMESTAMPTZ,
  email_sender_name TEXT,
  email_sender_address TEXT,
  portal_title TEXT,
  portal_description TEXT,
  portal_welcome_message TEXT,
  login_title TEXT,
  login_subtitle TEXT,
  login_welcome_message TEXT,
  pdf_footer TEXT,
  published_at TIMESTAMPTZ,
  updated_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_white_label_settings_organization_id
  ON public.white_label_settings (organization_id);

CREATE INDEX IF NOT EXISTS idx_white_label_settings_custom_domain
  ON public.white_label_settings (custom_domain)
  WHERE custom_domain IS NOT NULL;

DROP TRIGGER IF EXISTS white_label_settings_set_updated_at ON public.white_label_settings;
CREATE TRIGGER white_label_settings_set_updated_at
  BEFORE UPDATE ON public.white_label_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.white_label_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS white_label_settings_select_own_org ON public.white_label_settings;
CREATE POLICY white_label_settings_select_own_org
  ON public.white_label_settings FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS white_label_settings_insert_owner_admin ON public.white_label_settings;
CREATE POLICY white_label_settings_insert_owner_admin
  ON public.white_label_settings FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS white_label_settings_update_owner_admin ON public.white_label_settings;
CREATE POLICY white_label_settings_update_owner_admin
  ON public.white_label_settings FOR UPDATE TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT, INSERT, UPDATE ON public.white_label_settings TO authenticated;
GRANT ALL ON TABLE public.white_label_settings TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'white-label-assets',
  'white-label-assets',
  false,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS white_label_assets_select ON storage.objects;
CREATE POLICY white_label_assets_select
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'white-label-assets'
    AND (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS white_label_assets_insert ON storage.objects;
CREATE POLICY white_label_assets_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'white-label-assets'
    AND (storage.foldername(name))[1] = public.current_organization_id()::text
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS white_label_assets_update ON storage.objects;
CREATE POLICY white_label_assets_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'white-label-assets'
    AND (storage.foldername(name))[1] = public.current_organization_id()::text
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS white_label_assets_delete ON storage.objects;
CREATE POLICY white_label_assets_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'white-label-assets'
    AND (storage.foldername(name))[1] = public.current_organization_id()::text
    AND public.current_user_role() IN ('owner', 'admin')
  );
